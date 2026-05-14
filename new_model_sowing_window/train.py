"""
train.py — Main Training Pipeline for Sowing Window Predictor.

Usage:
  python train.py
  python train.py --skip-hpo
  python train.py --use-bharatbench
  python train.py --optuna-trials 20
  python train.py --models xgboost lightgbm

FIXES vs original:
  1. CNN-LSTM evaluated SEPARATELY — never mixed into static ensemble dicts.
  2. _build_seqs() uses original df (has State string), not the encoded array.
  3. val_predictions / test_predictions contain STATIC models only.
"""

import argparse, json, time
import numpy as np
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as cfg


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--skip-hpo",        action="store_true")
    p.add_argument("--use-bharatbench", action="store_true")
    p.add_argument("--optuna-trials",   type=int, default=None)
    p.add_argument("--models", nargs="+", default=None)
    return p.parse_args()


def main():
    args = parse_args()
    t0   = time.time()
    output_dir = cfg.OUTPUT_DIR
    models_dir = output_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    # 1. Feature matrix
    from src.feature_engineer import build_full_dataset, temporal_split
    df, encoders = build_full_dataset(use_bharatbench=args.use_bharatbench)
    try:
        df.to_parquet(output_dir / "feature_data.parquet", index=False)
    except Exception:
        df.to_csv(output_dir / "feature_data.csv", index=False)

    # 2. Temporal split
    print("\n" + "="*60 + "\nTEMPORAL SPLIT\n" + "="*60)
    X_train, y_train, X_val, y_val, X_test, y_test, meta_test = \
        temporal_split(df, encoders)
    encoders.save(output_dir / "encoders.joblib")

    # 3. HPO
    from src.ensemble import run_optuna_tuning
    if args.skip_hpo:
        print("\n[SKIP] Optuna HPO.")
        best_params = {"xgboost": cfg.XGB_PARAMS, "lightgbm": cfg.LGBM_PARAMS,
                       "catboost": cfg.CATBOOST_PARAMS, "rf": cfg.RF_PARAMS}
    else:
        n = args.optuna_trials or cfg.OPTUNA_TRIALS
        best_params = run_optuna_tuning(X_train, y_train, X_val, y_val, n)
    def _py(v):
        if isinstance(v, (np.integer,)): return int(v)
        if isinstance(v, (np.floating,)): return float(v)
        return v
    with open(output_dir / "best_params.json", "w") as f:
        json.dump({k: {pk: _py(pv) for pk, pv in vv.items()}
                   for k, vv in best_params.items()}, f, indent=2)

    # 4. Static base models
    from src.models import (XGBoostModel, LightGBMModel, CatBoostModel,
                             RandomForestModel, MLPModel)
    print("\n" + "="*60 + "\nTRAINING BASE MODELS\n" + "="*60)
    all_static = {
        "XGBoost":      (XGBoostModel,      best_params.get("xgboost")),
        "LightGBM":     (LightGBMModel,     best_params.get("lightgbm")),
        "CatBoost":     (CatBoostModel,     best_params.get("catboost")),
        "RandomForest": (RandomForestModel, best_params.get("rf")),
        "MLP":          (MLPModel,          None),
    }
    if args.models:
        model_configs = {k: v for k, v in all_static.items()
                         if k.lower() in [m.lower() for m in args.models]}
    else:
        model_configs = all_static

    trained_models, val_predictions, test_predictions = {}, {}, {}
    for name, (Cls, params) in model_configs.items():
        print(f"\n--- {name} ---")
        t1 = time.time()
        m = Cls(params=params) if params else Cls()
        m.fit(X_train, y_train, X_val, y_val)
        val_predictions[name]  = m.predict(X_val)
        test_predictions[name] = m.predict(X_test)
        trained_models[name]   = m
        sp = models_dir / (f"{name.lower()}.pt" if name == "MLP"
                           else f"{name.lower()}.joblib")
        m.save(sp)
        print(f"  Done {time.time()-t1:.1f}s → {sp.name}")

    # 5. CNN-LSTM (separate — NOT in ensemble)
    cnn_lstm_test_pred = None
    try:
        from src.models import CNNLSTMModel
        from src.data_loader import load_daily_weather, compute_weekly_weather, STATE_CITY_MAP
        print("\n--- CNN-LSTM (temporal) ---")
        weather = load_daily_weather()
        weekly  = compute_weekly_weather(weather)
        seq_len = cfg.CNN_LSTM_PARAMS["seq_len_weeks"]
        wcols   = ["temp_max_mean","temp_min_mean","precip_sum","rain_days","wind_max_mean"]
        nwf     = len(wcols)

        def _build_seqs(rows_df):
            seqs = []
            for _, row in rows_df.iterrows():
                state  = str(row.get("State", "Delhi"))
                year   = int(row.get("Year", 2010))
                sow_wk = int(row.get("sowing_window_center", 25))
                city   = STATE_CITY_MAP.get(state.strip(), "Delhi")
                start  = max(1, sow_wk - seq_len)
                mask   = ((weekly["city"] == city) & (weekly["year"] == year) &
                          (weekly["week"] >= start) & (weekly["week"] < sow_wk))
                wd = weekly.loc[mask, wcols].values
                if len(wd) < seq_len:
                    wd = np.vstack([np.zeros((seq_len - len(wd), nwf)), wd])
                else:
                    wd = wd[-seq_len:]
                seqs.append(wd)
            return np.array(seqs, dtype=np.float32)

        # FIX: use original df (keeps State as string + sowing_window_center)
        tr_m = df["Year"] <= cfg.TRAIN_YEARS_MAX
        va_m = df["Year"].isin(cfg.VAL_YEARS)
        te_m = df["Year"].isin(cfg.TEST_YEARS)
        print("  Building sequences...")
        X_seq_tr = _build_seqs(df[tr_m])
        X_seq_va = _build_seqs(df[va_m])
        X_seq_te = _build_seqs(df[te_m])

        cnn_lstm = CNNLSTMModel()
        cnn_lstm.fit(X_train, y_train, X_val, y_val,
                     X_seq_train=X_seq_tr, X_seq_val=X_seq_va)
        if cnn_lstm.model is not None:
            cnn_lstm_test_pred = cnn_lstm.predict(X_test, X_seq=X_seq_te)
            trained_models["CNN-LSTM"] = cnn_lstm
            cnn_lstm.save(models_dir / "cnn_lstm.pt")
            print("  Saved (NOT in static ensemble)")
    except Exception as e:
        print(f"\n  [WARN] CNN-LSTM skipped: {e}")

    # 6. Static ensembles
    from src.ensemble import WeightedEnsemble, StackingEnsemble
    print("\n" + "="*60 + "\nBUILDING ENSEMBLES\n" + "="*60)
    wens = WeightedEnsemble(); wens.fit(val_predictions, y_val)
    wens.save(output_dir / "ensemble_weighted.joblib")
    sens = StackingEnsemble(); sens.fit(val_predictions, y_val)
    sens.save(output_dir / "ensemble_stacking.joblib")

    # 7. Evaluate
    from src.ensemble import evaluate_predictions, per_crop_evaluation
    print("\n" + "="*60 + "\nTEST EVALUATION\n" + "="*60)
    all_metrics = {}
    for name, pred in test_predictions.items():
        all_metrics[name] = evaluate_predictions(y_test, pred, label=name)
    w_pred = wens.predict(test_predictions)
    all_metrics["WeightedEnsemble"] = evaluate_predictions(y_test, w_pred, label="Weighted Ensemble")
    s_pred = sens.predict(test_predictions)
    all_metrics["StackingEnsemble"] = evaluate_predictions(y_test, s_pred, label="Stacking Ensemble")
    if cnn_lstm_test_pred is not None:
        all_metrics["CNN-LSTM"] = evaluate_predictions(y_test, cnn_lstm_test_pred, label="CNN-LSTM")

    best = min(all_metrics, key=lambda k: all_metrics[k]["mae"])
    best_pred = (w_pred if best == "WeightedEnsemble" else
                 s_pred if best == "StackingEnsemble" else
                 cnn_lstm_test_pred if best == "CNN-LSTM" and cnn_lstm_test_pred is not None else
                 test_predictions.get(best, w_pred))
    print(f"\n>>> BEST: {best}  MAE={all_metrics[best]['mae']:.3f}wk  Acc={all_metrics[best]['accuracy_pct']:.1f}%")
    all_metrics["per_crop"] = per_crop_evaluation(y_test, best_pred, meta_test)

    # 8. Save metrics
    def _c(o):
        if isinstance(o, (np.integer,)): return int(o)
        if isinstance(o, (np.floating,)): return float(o)
        if isinstance(o, np.ndarray): return o.tolist()
        return o
    with open(output_dir / "metrics.json", "w") as f:
        json.dump(json.loads(json.dumps(all_metrics, default=_c)), f, indent=2)

    print(f"\n{'='*60}\nDONE {(time.time()-t0)/60:.1f}min  {output_dir}\nBest: {best}\n{'='*60}")
    return all_metrics


if __name__ == "__main__":
    main()