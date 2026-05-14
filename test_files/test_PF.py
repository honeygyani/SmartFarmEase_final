import os
import joblib
import pandas as pd


# ---------------------------------------------
# Dynamic prophet import (like train.py)
# ---------------------------------------------
def import_prophet():
    try:
        from prophet import Prophet
        return Prophet
    except ImportError:
        from fbprophet import Prophet
        return Prophet


# ---------------------------------------------
# Sanitization to match train.py
# ---------------------------------------------
def sanitize(name):
    return (
        name.replace(" ", "_")
            .replace("/", "_")
            .replace("(", "")
            .replace(")", "")
            .replace("-", "_")
    )


# ---------------------------------------------
# Load all 3 models for a crop-location
# ---------------------------------------------
def load_models(commodity, state, district):
    base = "Z:\\Sem7MiniProject\\models\\Price Forecasting"
    tags = ["prophet", "rf", "xgb"]
    loaded = {}

    for tag in tags:
        fname = f"{tag}_{sanitize(commodity)}_{sanitize(state)}_{sanitize(district)}.pkl"
        path = os.path.join(base, fname)

        if not os.path.exists(path):
            return None

        loaded[tag] = joblib.load(path)

    return loaded


# ---------------------------------------------
# Main prediction function
# ---------------------------------------------
def predict(commodity, state, district, year=2025, month=1):

    models = load_models(commodity, state, district)

    if models is None:
        return "Model not found for this crop-state-district."

    Prophet = import_prophet()

    p_model = models["prophet"]
    rf_model = models["rf"]
    xgb_model = models["xgb"]

    # Prophet forecast
    future = p_model.make_future_dataframe(periods=1, freq="MS")
    p_pred = p_model.predict(future)["yhat"].iloc[-1]

    # RF forecast
    rf_pred = rf_model.predict([[year, month]])[0]

    # XGB forecast
    xgb_pred = xgb_model.predict([[year, month]])[0]

    # Final ensemble (simple mean)
    final = round((p_pred + rf_pred + xgb_pred) / 3, 2)

    return final


# ---------------------------------------------
# Execute when running: python predict.py
# ---------------------------------------------
if __name__ == "__main__":
    out = predict("Yam", "Kerala", "Kollam")
    print(f"Prediction for Yam in Kerala, Kollam: {out}\n")