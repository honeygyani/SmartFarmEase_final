"""
predict.py — Farmer-Facing Inference for Sowing Window Predictor.

Usage:
  python predict.py
  python predict.py --crop rice --state "Telangana" --season kharif
  python predict.py --crop wheat --state "Punjab" --season rabi --year 2026
  python predict.py --list-crops

FIXES vs original:
  1. CNN-LSTM never loaded or called — it is not part of static ensemble.
  2. build_inference_features(): starts from encoders.feature_means (training
     medians) not zeros. Zeros → wrong scaled values for continuous features.
  3. Sanity check: predictions outside [0.5, 52.5] are skipped.
  4. Confidence thresholds use cfg.CONFIDENCE_HIGH/MEDIUM_STD (weeks scale).
"""

import argparse, json
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as cfg
from src.target_builder import get_sowing_info, get_all_supported_crops


def week_to_date_range(ws, we, year=2024):
    def _w(w, d, y):
        try:
            return datetime.strptime(f"{y}-W{int(w):02d}-{d}", "%Y-W%W-%w")
        except ValueError:
            return datetime(y, 1, 1) + timedelta(weeks=int(w)-1, days=d-1)
    return _w(ws, 1, year).strftime("%B %d"), _w(we, 7, year).strftime("%B %d")


def load_trained_pipeline(output_dir: Path):
    from src.feature_engineer import FeatureEncoders
    from src.ensemble import WeightedEnsemble, StackingEnsemble
    from src.models import BaseModel, MLPModel

    encoders = FeatureEncoders.load(output_dir / "encoders.joblib")

    wens, sens = None, None
    try: wens = WeightedEnsemble.load(output_dir / "ensemble_weighted.joblib")
    except FileNotFoundError: pass
    try: sens = StackingEnsemble.load(output_dir / "ensemble_stacking.joblib")
    except FileNotFoundError: pass

    # FIX: load only static models; skip cnn_lstm.pt entirely
    mdir = output_dir / "models"
    base_models = {}
    for f in mdir.glob("*.joblib"):
        try: base_models[f.stem] = BaseModel.load(f)
        except Exception as e: print(f"  [WARN] {f.stem}: {e}")
    for f in mdir.glob("*.pt"):
        if "cnn" in f.stem.lower() or "lstm" in f.stem.lower():
            continue   # FIX: skip CNN-LSTM
        try: base_models[f.stem] = MLPModel.load(f)
        except Exception as e: print(f"  [WARN] {f.stem}: {e}")

    return encoders, base_models, wens, sens


def build_inference_features(crop, state, season, year, encoders):
    """
    FIX: start from training medians (not zeros) then overwrite known values.
    """
    feat_map = {n: i for i, n in enumerate(encoders.feature_columns)}
    n = len(encoders.feature_columns)

    # FIX: use training medians as base
    raw = (encoders.feature_means.copy()
           if encoders.feature_means is not None
           else np.zeros(n, dtype=np.float32))

    def _enc(enc, val, fallback):
        try: return enc.transform([val])[0]
        except Exception: return fallback

    ce = _enc(encoders.crop_encoder,   crop.strip().upper(),   len(encoders.crop_encoder.classes_)//2)
    se = _enc(encoders.season_encoder, season.strip().lower(), 0)
    ste= _enc(encoders.state_encoder,  state.strip().title(),  len(encoders.state_encoder.classes_)//2)

    if "crop_encoded"   in feat_map: raw[feat_map["crop_encoded"]]   = ce
    if "season_encoded" in feat_map: raw[feat_map["season_encoded"]] = se
    if "state_encoded"  in feat_map: raw[feat_map["state_encoded"]]  = ste

    lat, lon = cfg.STATE_CENTROIDS.get(state.strip().title(), (20.0, 80.0))
    if "latitude"  in feat_map: raw[feat_map["latitude"]]  = lat
    if "longitude" in feat_map: raw[feat_map["longitude"]] = lon
    if "Year"      in feat_map: raw[feat_map["Year"]]      = float(year)

    # Apply imputer if available, then scale
    if hasattr(encoders, "imputer") and encoders.imputer is not None:
        try:
            raw = encoders.imputer.transform(raw.reshape(1, -1))[0].astype(np.float32)
        except Exception:
            pass
    return encoders.scaler.transform(raw.reshape(1, -1)).astype(np.float32)


def predict_sowing_window(crop, state, season, year=2026, verbose=True):
    encoders, base_models, wens, sens = load_trained_pipeline(cfg.OUTPUT_DIR)
    if not base_models:
        print("[ERROR] No trained models. Run train.py first.")
        return {}

    features = build_inference_features(crop, state, season, year, encoders)
    display_map = {"xgboost":"XGBoost","lightgbm":"LightGBM","catboost":"CatBoost",
                   "randomforest":"RandomForest","mlp":"MLP"}

    model_preds = {}
    for name, model in base_models.items():
        try:
            p = float(model.predict(features)[0])
            if not (0.5 <= p <= 52.5):
                print(f"  [WARN] {name} out of range ({p:.1f}) — skipped")
                continue
            model_preds[display_map.get(name.lower(), name)] = p
        except Exception as e:
            if verbose: print(f"  [WARN] {name}: {e}")

    if not model_preds:
        print("[ERROR] All predictions failed.")
        return {}

    # Ensemble — handle both dict and object formats from joblib
    ens_pred = None

    def _try_weighted(ens):
        if ens is None:
            return None
        names = ens.get("model_names") if isinstance(ens, dict) else getattr(ens, "model_names", None)
        weights = ens.get("weights") if isinstance(ens, dict) else getattr(ens, "weights", None)
        if names is not None and weights is not None and set(names).issubset(model_preds):
            return float(sum(model_preds.get(n, 0) * weights[i] for i, n in enumerate(names)))
        return None

    def _try_stacking(ens):
        if ens is None:
            return None
        names = ens.get("model_names") if isinstance(ens, dict) else getattr(ens, "model_names", None)
        meta = ens.get("meta_model") if isinstance(ens, dict) else getattr(ens, "meta_model", None)
        if names is not None and meta is not None and set(names).issubset(model_preds):
            X = np.array([[model_preds.get(n, 0) for n in names]])
            res = meta.predict(X)
            return float(res[0]) if hasattr(res, '__len__') else float(res)
        return None

    ens_pred = _try_weighted(wens) or _try_stacking(sens)
    if ens_pred is None:
        ens_pred = float(np.mean(list(model_preds.values())))

    center = float(np.clip(ens_pred, 1, 52))
    hw = cfg.SOWING_WINDOW_HALF_WIDTH
    ws = max(1,  int(round(center - hw)))
    we = min(52, int(round(center + hw)))

    std = float(np.std(list(model_preds.values())))
    conf = ("HIGH"   if std < cfg.CONFIDENCE_HIGH_STD else
            "MEDIUM" if std < cfg.CONFIDENCE_MEDIUM_STD else "LOW")

    d0, d1 = week_to_date_range(ws, we, year)
    result = {
        "crop": crop, "state": state, "season": season, "year": year,
        "predicted_center_week": round(center, 1),
        "sowing_week_start": ws, "sowing_week_end": we,
        "date_start": d0, "date_end": d1,
        "confidence": conf, "model_std": round(std, 2),
        "model_predictions": model_preds,
        "fao_reference": get_sowing_info(crop, season),
    }
    if verbose: _print(result)
    return result


def predict_all_seasons(crop, state, year=2026):
    results = []
    for season in ["kharif","rabi","summer","whole year"]:
        try:
            r = predict_sowing_window(crop, state, season, year, verbose=False)
            if r: results.append(r)
        except Exception: pass
    co = {"HIGH":0,"MEDIUM":1,"LOW":2}
    return sorted(results, key=lambda x: (co.get(x["confidence"],3), x["model_std"]))


def _print(r):
    print("\n" + "="*60)
    print("  SOWING WINDOW PREDICTION")
    print("="*60)
    print(f"  Crop    : {r['crop']}")
    print(f"  State   : {r['state']}")
    print(f"  Season  : {r['season']}")
    print(f"  Year    : {r['year']}")
    print(f"\n  PREDICTED WINDOW:")
    print(f"    Weeks {r['sowing_week_start']}–{r['sowing_week_end']} "
          f"({r['date_start']} – {r['date_end']})")
    print(f"    Center : Week {r['predicted_center_week']}")
    print(f"    Confidence : {r['confidence']} (std={r['model_std']:.2f}wk)")
    if r.get("fao_reference"):
        print("\n  FAO/ICAR REFERENCE:")
        for s, info in r["fao_reference"].items():
            print(f"    {s}: {info.get('description','N/A')}")
    print("\n  MODEL PREDICTIONS:")
    for nm, p in r["model_predictions"].items():
        print(f"    {nm:15s}: Week {p:.1f}")
    print("="*60)


def _list_crops():
    crops = get_all_supported_crops()
    print(f"\nSupported crops ({len(crops)}):")
    for c in crops:
        info = get_sowing_info(c)
        print(f"  {c:30s} [{', '.join(info.keys())}]")


def _interactive():
    print("\n" + "="*60 + "\n  SOWING WINDOW PREDICTOR\n" + "="*60)
    print("Type 'list' to see crops, 'quit' to exit.\n")
    while True:
        crop = input("Crop: ").strip()
        if crop.lower() in ("quit","exit","q"): break
        if crop.lower() == "list": _list_crops(); continue
        state  = input("State: ").strip()
        season = input("Season (kharif/rabi/summer): ").strip()
        yr_s   = input("Year (default 2026): ").strip()
        year   = int(yr_s) if yr_s.isdigit() else 2026
        try: predict_sowing_window(crop, state, season, year)
        except Exception as e: print(f"[ERROR] {e}")
        print()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--crop"); p.add_argument("--state")
    p.add_argument("--season"); p.add_argument("--year", type=int, default=2026)
    p.add_argument("--list-crops", action="store_true")
    p.add_argument("--all-seasons", action="store_true")
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    if args.list_crops:
        _list_crops(); return
    if args.crop and args.state:
        if args.all_seasons or not args.season:
            results = predict_all_seasons(args.crop, args.state, args.year)
            if args.json: print(json.dumps(results, indent=2, default=str))
            else:
                for r in results: _print(r)
        else:
            r = predict_sowing_window(args.crop, args.state, args.season, args.year)
            if args.json: print(json.dumps(r, indent=2, default=str))
    else:
        _interactive()


if __name__ == "__main__":
    main()