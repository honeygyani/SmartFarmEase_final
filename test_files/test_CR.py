# test_CR.py

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib
import shap
import dice_ml
from dice_ml.utils import helpers

# =========================================================
# PATHS
# =========================================================

MODEL_PATH = r"Z:\\Sem7MiniProject\\models\\Crop Recommendation\\crop_recommendation_rf.pkl"
ENCODER_PATH = r"Z:\\Sem7MiniProject\\models\\Crop Recommendation\\crop_label_encoder.pkl"
DATA_PATH = r"Z:\\Sem7MiniProject\\models\\Crop Recommendation\\CropRecommendation.csv"

# =========================================================
# 1) LOAD MODEL, ENCODER & DATA
# =========================================================

def load_model_and_encoder(model_path=MODEL_PATH, encoder_path=ENCODER_PATH):
    """Load trained RandomForest pipeline and label encoder."""
    rf_pipe = joblib.load(model_path)
    le = joblib.load(encoder_path)
    return rf_pipe, le

print("Loading model and dataset...")
rf_pipe, le = load_model_and_encoder()
df = pd.read_csv(DATA_PATH)
X = df.drop("label", axis=1)
y = df["label"]
y_encoded = le.transform(y)
print(f"Dataset shape: {df.shape}")

# =========================================================
# 2) USER INPUT
# =========================================================

def get_user_input():
    """Collect sample soil & weather inputs interactively."""
    print("\nProvide input values (press Enter to use default):")

    def ask_float(prompt, default):
        val = input(f"{prompt} [{default}]: ").strip()
        return float(val) if val else default

    def ask_str(prompt, default):
        val = input(f"{prompt} [{default}]: ").strip()
        return val if val else default

    sample = {
        "N": ask_float("Nitrogen (N)", 70),
        "P": ask_float("Phosphorus (P)", 45),
        "K": ask_float("Potassium (K)", 50),
        "temperature": ask_float("Temperature (°C)", 27.5),
        "humidity": ask_float("Humidity (%)", 70),
        "ph": ask_float("Soil pH", 6.5),
        "rainfall": ask_float("Rainfall (mm)", 200),
        "prev_crop": ask_str("Previous crop", "pigeonpeas"),
    }

    return pd.DataFrame([sample])

# =========================================================
# 3) PREDICTION LOGIC
# =========================================================

def predict_crops(rf_pipe, le, sample_df, top_n=5):
    """Predict crop probabilities and print top-N results."""
    probs = rf_pipe.predict_proba(sample_df)[0]
    crops = le.inverse_transform(np.arange(len(probs)))
    crop_probs = pd.DataFrame({"Crop": crops, "Probability": probs}).sort_values("Probability", ascending=False)

    print("\nTop recommended crops:")
    print(crop_probs.head(top_n).to_string(index=False))

    best = crop_probs.iloc[0]
    print(f"\nBest recommended crop: {best['Crop']} (prob = {best['Probability']:.3f})")

# =========================================================
# 4) COUNTERFACTUAL GENERATION (DiCE)
# =========================================================

def generate_counterfactuals(query_df, desired_label="banana", total_cfs=5):
    print("\nCOUNTERFACTUAL EXPLANATION")
    print("---------------------------------")

    pred_idx = rf_pipe.predict(query_df)[0]
    pred_crop = le.inverse_transform([pred_idx])[0]
    print(f"Model prediction: {pred_crop}")

    if desired_label not in le.classes_:
        raise ValueError(f"{desired_label} not found in label encoder!")

    desired_idx = list(le.classes_).index(desired_label)

    df_for_dice = X.copy()
    df_for_dice["label"] = y_encoded
    continuous = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

    d = dice_ml.Data(dataframe=df_for_dice, continuous_features=continuous, outcome_name="label")
    m = dice_ml.Model(model=rf_pipe, backend="sklearn")
    exp = dice_ml.Dice(d, m, method="genetic")

    result = exp.generate_counterfactuals(query_df, total_CFs=total_cfs, desired_class=desired_idx, verbose=False)

    cf_df = result.cf_examples_list[0].final_cfs_df.copy()
    if "label" in cf_df:
        cf_df["label"] = le.inverse_transform(cf_df["label"].astype(int))

    to_show = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "prev_crop", "label"]
    to_show = [c for c in to_show if c in cf_df.columns]

    print("\nGenerated Counterfactuals:\n")
    print(cf_df[to_show].round(2).to_string(index=False))
    return cf_df

# =========================================================
# 5) SHAP EXPLANATION
# =========================================================

def friendly(raw):
    if raw == "N": return "Nitrogen level (N)"
    if raw == "P": return "Phosphorus level (P)"
    if raw == "K": return "Potassium level (K)"
    if raw == "temperature": return "Field temperature (°C)"
    if raw == "humidity": return "Humidity (%)"
    if raw == "ph": return "Soil pH"
    if raw == "rainfall": return "Rainfall (mm)"
    if raw.startswith("prev_crop_"):
        return "Previous crop: " + raw.replace("prev_crop_", "")
    return raw

def explain_with_shap(sample_df, top_k=10):
    print("\nSHAP INTERPRETATION")
    print("---------------------------------")

    pre = rf_pipe.named_steps["preprocessor"]
    clf = rf_pipe.named_steps["classifier"]

    Xtr = pre.transform(sample_df)
    if hasattr(Xtr, "toarray"):
        Xtr = Xtr.toarray()

    try:
        names = pre.get_feature_names_out()
    except:
        names = [f"f{i}" for i in range(Xtr.shape[1])]

    pred_idx = rf_pipe.predict(sample_df)[0]
    pred_label = le.inverse_transform([pred_idx])[0]
    print(f"Model recommended: {pred_label}")

    explainer = shap.TreeExplainer(clf)
    shap_vals = explainer.shap_values(Xtr)

    if isinstance(shap_vals, list):
        shap_vec = shap_vals[pred_idx][0]
    else:
        shap_vals = np.array(shap_vals)
        if shap_vals.ndim == 3:
            shap_vec = shap_vals[0, :, pred_idx]
        else:
            shap_vec = shap_vals[0]

    df_imp = pd.DataFrame({"raw": names, "shap": shap_vec})
    df_imp["abs"] = df_imp["shap"].abs()
    df_imp["nice"] = df_imp["raw"].apply(friendly)
    df_imp = df_imp.sort_values("abs", ascending=False)

    print("\nWhy this crop was recommended:\n")
    for _, row in df_imp.head(top_k).iterrows():
        direction = "supports the recommendation" if row["shap"] > 0 else "pushes against the recommendation"
        print(f"- {row['nice']}: {direction} (impact={row['shap']:.3f})")
    print()

# =========================================================
# 6) MAIN
# =========================================================

def main():
    print("\n=== Crop Recommendation System ===")

    sample_df = get_user_input()
    print("\nInput provided:")
    print(sample_df)

    predict_crops(rf_pipe, le, sample_df, top_n=5)

    desired_crop = input("\nEnter desired crop for counterfactuals [lentil]: ").strip() or "lentil"
    generate_counterfactuals(sample_df, desired_label=desired_crop, total_cfs=5)

    explain_with_shap(sample_df, top_k=10)

if __name__ == "__main__":
    main()
