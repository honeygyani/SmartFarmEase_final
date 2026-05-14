# server_FS.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
from treeinterpreter import treeinterpreter as ti
import os

# Use relative paths for portability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "Fertilizer Prediction", "fertilizer_model.pkl")

print(f"📂 Loading fertilizer model from: {MODEL_PATH}")
if not os.path.exists(MODEL_PATH):
    print("⚠️ WARNING: Model path does not exist. Check the path.")
model = joblib.load(MODEL_PATH)
print("✅ Fertilizer model loaded!")

# ---------------------------------------------------------
# PREDICTION + EXPLAINABILITY
# ---------------------------------------------------------
def predict_fertilizer(input_dict):
    """
    - Takes raw form JSON (Temparature, Humidity , Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous)
    - Returns:
        top3: list of {fertilizer, prob}
        explanations: list of {
            fertilizer,
            feature_contributions: {feature_name: contribution_value}
        }
    """
    df = pd.DataFrame([input_dict])

    # --- Top-3 predictions ---
    proba = model.predict_proba(df)[0]
    classes = model.classes_
    top3_idx = sorted(range(len(proba)), key=lambda i: proba[i], reverse=True)[:3]
    top3 = [{"fertilizer": classes[i], "prob": float(proba[i])} for i in top3_idx]

    # --- TreeInterpreter explainability ---
    rf = model.named_steps["classifier"]
    pre = model.named_steps["preprocessor"]
    X_trans = pre.transform(df)

    prediction, bias, contributions = ti.predict(rf, X_trans)
    feature_names = pre.get_feature_names_out()

    explanations = []
    for item in top3:
        fert_name = item["fertilizer"]
        # find class index for this fertilizer in the classifier's classes
        class_index = int((classes == fert_name).nonzero()[0][0])

        # contributions for this fertilizer class
        contribs = contributions[0][:, class_index]  # shape: (n_features,)

        explanations.append(
            {
                "fertilizer": fert_name,
                "feature_contributions": dict(
                    zip(feature_names, contribs.tolist())
                ),
            }
        )

    return {"top3": top3, "explanations": explanations}


# ---------------------------------------------------------
# FASTAPI APP
# ---------------------------------------------------------
app = FastAPI(title="Fertilizer Prediction API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FertInput(BaseModel):
    data: dict

@app.post("/predict/fertilizer")
def fertilizer_api(input_data: FertInput):
    try:
        return predict_fertilizer(input_data.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run: uvicorn server_FS:app --reload --port 8003
