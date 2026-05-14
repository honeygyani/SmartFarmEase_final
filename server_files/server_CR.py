# server_CR.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import requests
import numpy as np
import shap
import os

# Use relative paths for portability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "Crop Recommendation", "crop_recommendation_rf.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "..", "models", "Crop Recommendation", "crop_label_encoder.pkl")
DATA_PATH = os.path.join(BASE_DIR, "..", "models", "Crop Recommendation", "CropRecommendation.csv")

PRICE_SERIES_API_URL = os.getenv("AI_PRICE_URL", "http://127.0.0.1:8004") + "/predict/price_series"

# =========================================================
# LOAD MODEL & ENCODER
# =========================================================

print(f"Loading crop model from: {MODEL_PATH}")
rf_pipe = joblib.load(MODEL_PATH)
print("Crop model loaded.")
print(f"Loading label encoder from: {ENCODER_PATH}")
le = joblib.load(ENCODER_PATH)
print("Label encoder loaded.")

preprocessor = rf_pipe.named_steps["preprocessor"]
classifier = rf_pipe.named_steps["classifier"]

try:
    FEATURE_NAMES = preprocessor.get_feature_names_out()
except Exception:
    FEATURE_NAMES = None

shap_explainer = shap.TreeExplainer(classifier)

# =========================================================
# OPTIONAL: DiCE (counterfactuals) – load only if everything exists
# =========================================================

dice_exp = None
continuous_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

try:
    import dice_ml
    from dice_ml.utils import helpers  # noqa

    if os.path.exists(DATA_PATH):
        print(f"Loading data for DiCE from: {DATA_PATH}")
        df = pd.read_csv(DATA_PATH)
        if "label" in df.columns:
            X = df.drop("label", axis=1)
            y = df["label"]
            y_encoded = le.transform(y)
            df_for_dice = X.copy()
            df_for_dice["label"] = y_encoded
            TRAIN_FEATURES_FOR_DICE = [c for c in df_for_dice.columns if c != "label"]
            if "prev_crop" in df_for_dice.columns:
                PREV_CROP_VALUES = set(df_for_dice["prev_crop"].unique())
            else:
                PREV_CROP_VALUES = set()
            dice_data = dice_ml.Data(
                dataframe=df_for_dice,
                continuous_features=continuous_features,
                outcome_name="label",
            )
            dice_model = dice_ml.Model(model=rf_pipe, backend="sklearn")
            dice_exp = dice_ml.Dice(dice_data, dice_model, method="genetic")
            print("DiCE counterfactual engine initialized.")
        else:
            print("WARNING: 'label' column not found in CSV. Skipping DiCE.")
    else:
        print("WARNING: Data CSV for DiCE not found. Skipping counterfactuals.")
except Exception as e:
    print(f"WARNING: Failed to initialize DiCE. Counterfactuals will be disabled. Error: {e}")
    dice_exp = None

# =========================================================
# CROP → COMMODITY MAPPING (for price models)
# These names MUST match the sanitized commodity in the .pkl files
# inside models/Price Forecasting/
# =========================================================
CROP_TO_COMMODITY = {
    "rice": "PaddyDhanCommon",
    "paddy": "PaddyDhanCommon",
    "pigeonpea": "Arhar_Tur_Red_GramWhole",
    "tur": "Arhar_Tur_Red_GramWhole",
    "arhar": "Arhar_Tur_Red_GramWhole",
    "blackgram": "Black_Gram_Urd_BeansWhole",
    "urad": "Black_Gram_Urd_BeansWhole",
    "greengram": "Green_Gram_MoongWhole",
    "moong": "Green_Gram_MoongWhole",
    "mungbean": "Green_Gram_MoongWhole",
    "lentil": "Lentil_MasurWhole",
    "masoor": "Lentil_MasurWhole",
    "gram": "Bengal_GramGramWhole",
    "chickpea": "Bengal_GramGramWhole",
    "maize": "Maize",
    "wheat": "Wheat",
    "cotton": "Cotton",
    "groundnut": "Groundnut",
    "soybean": "Soyabean",
    "sunflower": "Sunflower",
    "jowar": "JowarSorghum",
    "sorghum": "JowarSorghum",
    "turmeric": "Turmeric",
    "tomato": "Tomato",
    "potato": "Potato",
    "onion": "Onion",
}

def map_crop_to_commodity(crop_name: str) -> str:
    key = crop_name.lower().replace(" ", "")
    return CROP_TO_COMMODITY.get(key, crop_name)

# =========================================================
# HELPERS
# =========================================================

def friendly_feature_name(raw: str) -> str:
    if raw == "N":
        return "Nitrogen level (N)"
    if raw == "P":
        return "Phosphorus level (P)"
    if raw == "K":
        return "Potassium level (K)"
    if raw == "temperature":
        return "Field temperature (°C)"
    if raw == "humidity":
        return "Humidity (%)"
    if raw == "ph":
        return "Soil pH"
    if raw == "rainfall":
        return "Rainfall (mm)"
    if raw.startswith("prev_crop_"):
        return "Previous crop"
    if raw.startswith("state_"):
        return "State"
    if raw.startswith("district_"):
        return "District"
    return raw

def compute_top_n_crops(sample_df: pd.DataFrame, n: int = 5):
    probs = rf_pipe.predict_proba(sample_df)[0]
    indices = np.arange(len(probs), dtype=int)
    crops = le.inverse_transform(indices)
    crop_probs = (
        pd.DataFrame({"crop": crops, "probability": probs})
        .sort_values("probability", ascending=False)
        .reset_index(drop=True)
    )
    top = crop_probs.head(n)
    return [
        {"crop": str(row["crop"]), "probability": float(row["probability"])}
        for _, row in top.iterrows()
    ]

def compute_shap_for_crop(sample_df: pd.DataFrame, crop_name: str, top_k: int = 8):
    Xtr = preprocessor.transform(sample_df)
    if hasattr(Xtr, "toarray"):
        Xtr = Xtr.toarray()

    if FEATURE_NAMES is not None and len(FEATURE_NAMES) == Xtr.shape[1]:
        names = np.array(FEATURE_NAMES)
    else:
        names = np.array([f"f{i}" for i in range(Xtr.shape[1])])

    class_idx = int(le.transform([crop_name])[0])
    shap_vals_all = shap_explainer.shap_values(Xtr)

    if isinstance(shap_vals_all, list):
        shap_vec = np.array(shap_vals_all[class_idx][0])
    else:
        shap_vals_all = np.array(shap_vals_all)
        if shap_vals_all.ndim == 3:
            shap_vec = shap_vals_all[0, :, class_idx]
        else:
            shap_vec = shap_vals_all[0]

    values_vec = np.array(Xtr[0])

    df_imp = pd.DataFrame(
        {
            "raw": names,
            "shap": shap_vec,
            "abs": np.abs(shap_vec),
            "model_value": values_vec,
        }
    )
    df_imp["nice"] = df_imp["raw"].apply(friendly_feature_name)
    df_imp = df_imp.sort_values("abs", ascending=False).head(top_k)

    explanations = []
    for _, row in df_imp.iterrows():
        raw_name = str(row["raw"])
        nice_name = str(row["nice"])

        # Try to recover original value
        feature_value = None
        if raw_name in sample_df.columns:
            feature_value = sample_df[raw_name].iloc[0]
        elif raw_name.startswith("prev_crop_") and "prev_crop" in sample_df.columns:
            feature_value = sample_df["prev_crop"].iloc[0]
        elif raw_name.startswith("state_") and "state" in sample_df.columns:
            feature_value = sample_df["state"].iloc[0]
        elif raw_name.startswith("district_") and "district" in sample_df.columns:
            feature_value = sample_df["district"].iloc[0]
        else:
            feature_value = row["model_value"]

        direction = "supports" if row["shap"] > 0 else "pushes_against"

        explanations.append(
            {
                "raw_feature": raw_name,
                "feature_name": nice_name,
                "shap_value": float(row["shap"]),
                "direction": direction,
                "feature_value": (
                    float(feature_value)
                    if isinstance(feature_value, (int, float, np.floating))
                    else str(feature_value)
                ),
            }
        )

    return explanations

def fetch_price_forecast_series(
    commodity_name: str, state: str, district: str, months_ahead: int = 6
):
    payload = {
        "commodity": commodity_name,
        "state": state,
        "district": district,
        "months_ahead": months_ahead,
    }
    try:
        resp = requests.post(PRICE_SERIES_API_URL, json=payload, timeout=10)
        if not resp.ok:
            return {"error": f"HTTP {resp.status_code}"}
        data = resp.json()
        if "series" not in data:
            return {"error": "Invalid response from price service"}
        cleaned = []
        for item in data["series"]:
            cleaned.append(
                {
                    "year": int(item.get("year")),
                    "month": int(item.get("month")),
                    "price": float(item.get("price")),
                }
            )
        return cleaned
    except Exception as e:
        return {"error": str(e)}

def generate_counterfactuals(
    query_df: pd.DataFrame, desired_crop: str, total_cfs: int = 3
):
    if dice_exp is None:
        return {"target_crop": desired_crop, "error": "Counterfactual engine not available."}

    if desired_crop not in le.classes_:
        return {
            "target_crop": desired_crop,
            "error": f"{desired_crop} not found in label encoder.",
        }

    desired_idx = list(le.classes_).index(desired_crop)

    # 1) Start from query
    cf_query = query_df.copy()

    # 2) Drop any label column if present
    if "label" in cf_query.columns:
        cf_query = cf_query.drop(columns=["label"])

    # 3) Keep only features that DiCE was trained on
    #    (TRAIN_FEATURES_FOR_DICE was built from df_for_dice.columns)
    cf_query = cf_query[[c for c in TRAIN_FEATURES_FOR_DICE if c in cf_query.columns]]

    # 4) Sanitize prev_crop if its value was never seen in training
    if "prev_crop" in cf_query.columns and PREV_CROP_VALUES:
        current_prev = cf_query["prev_crop"].iloc[0]
        if current_prev not in PREV_CROP_VALUES:
            # Prefer an "unknown" class if it exists, else just pick the first training value
            if "unknown" in PREV_CROP_VALUES:
                safe_prev = "unknown"
            else:
                safe_prev = list(PREV_CROP_VALUES)[0]
            cf_query.loc[cf_query.index[0], "prev_crop"] = safe_prev

    try:
        result = dice_exp.generate_counterfactuals(
            cf_query, total_CFs=total_cfs, desired_class=desired_idx, verbose=False
        )
        cf_df = result.cf_examples_list[0].final_cfs_df.copy()
        if "label" in cf_df:
            cf_df["label"] = le.inverse_transform(cf_df["label"].astype(int))

        cols_to_keep = [
            c
            for c in [
                "N",
                "P",
                "K",
                "temperature",
                "humidity",
                "ph",
                "rainfall",
                "prev_crop",
                "label",
            ]
            if c in cf_df.columns
        ]

        cf_records = cf_df[cols_to_keep].round(2).to_dict(orient="records")
        return {
            "target_crop": desired_crop,
            "counterfactuals": cf_records,
        }
    except Exception as e:
        return {"target_crop": desired_crop, "error": str(e)}


def predict_crop_full(input_dict: dict):
    sample_df = pd.DataFrame([input_dict])

    top5 = compute_top_n_crops(sample_df, n=5)
    if not top5:
        return {"error": "Model did not return any crops."}

    best_crop = top5[0]["crop"]

    explanations_by_crop = {}
    for item in top5:
        crop_name = item["crop"]
        explanations_by_crop[crop_name] = compute_shap_for_crop(
            sample_df, crop_name, top_k=8
        )

    # Fetch price forecasts for each recommended crop
    price_forecasts = {}
    state = input_dict.get("state", "")
    district = input_dict.get("district", "")

    for item in top5:
        crop_name = item["crop"]
        commodity = map_crop_to_commodity(crop_name)
        try:
            forecast = fetch_price_forecast_series(commodity, state, district, months_ahead=6)
            if forecast and not isinstance(forecast, dict):
                price_forecasts[crop_name] = forecast
            elif isinstance(forecast, dict) and "error" not in forecast:
                price_forecasts[crop_name] = forecast
        except Exception:
            pass  # Skip crops without price models

    counterfactual_info = None
    if len(top5) > 1:
        target_crop = top5[1]["crop"]
        counterfactual_info = generate_counterfactuals(
            sample_df, desired_crop=target_crop, total_cfs=3
        )

    response = {
        "predicted_crop": best_crop,
        "top5": top5,
        "explanations_by_crop": explanations_by_crop,
    }
    if price_forecasts:
        response["price_forecasts"] = price_forecasts
    if counterfactual_info is not None:
        response["counterfactuals"] = counterfactual_info

    return response

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(title="Crop Recommendation API with Explainability")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CropInput(BaseModel):
    data: dict

@app.post("/predict/crop")
def crop_api(input_data: CropInput):
    try:
        return predict_crop_full(input_data.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run: uvicorn server_CR:app --reload --port 8002
