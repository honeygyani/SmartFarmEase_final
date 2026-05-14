# server_PF.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import joblib

# Use relative paths for portability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = os.path.join(BASE_DIR, "..", "models", "Price Forecasting")


def sanitize(name):
    return (
        name.replace(" ", "_")
        .replace("/", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("-", "_")
    )


def load_models(commodity, state, district):
    tags = ["prophet", "rf", "xgb"]
    loaded = {}
    for tag in tags:
        fname = f"{tag}_{sanitize(commodity)}_{sanitize(state)}_{sanitize(district)}.pkl"
        path = os.path.join(BASE_PATH, fname)
        if not os.path.exists(path):
            return None
        loaded[tag] = joblib.load(path)
    return loaded


def import_prophet():
    try:
        from prophet import Prophet  # type: ignore

        return Prophet
    except ImportError:
        from fbprophet import Prophet  # type: ignore

        return Prophet


def predict_price(commodity, state, district, year=2025, month=1):
    """Single month price (used by existing frontend)."""
    models = load_models(commodity, state, district)
    if models is None:
        return {"error": "Model not found."}

    Prophet = import_prophet()
    p_model = models["prophet"]
    rf_model = models["rf"]
    xgb_model = models["xgb"]

    # Prophet forecast: one extra month ahead from training end
    future = p_model.make_future_dataframe(periods=1, freq="MS")
    forecast = p_model.predict(future)
    p_pred = float(forecast["yhat"].iloc[-1])

    rf_pred = float(rf_model.predict([[year, month]])[0])
    xgb_pred = float(xgb_model.predict([[year, month]])[0])

    final = round((p_pred + rf_pred + xgb_pred) / 3, 2)
    return {"price": final}


def predict_price_series(commodity, state, district, months_ahead=6):
    """
    Price forecast for the next `months_ahead` months.

    Used by crop recommendation service for top-5 crops.
    """
    if months_ahead < 1 or months_ahead > 12:
        months_ahead = 6  # simple guard

    models = load_models(commodity, state, district)
    if models is None:
        return {"error": "Model not found."}

    Prophet = import_prophet()
    p_model = models["prophet"]
    rf_model = models["rf"]
    xgb_model = models["xgb"]

    # Prophet future dataframe for the next N months starting from training end
    future = p_model.make_future_dataframe(periods=months_ahead, freq="MS")
    forecast = p_model.predict(future)

    # Take only the last N rows (future months)
    tail = forecast.tail(months_ahead)

    series = []
    for row in tail.itertuples():
        ds = row.ds  # pandas Timestamp
        year = int(ds.year)
        month = int(ds.month)
        p_pred = float(row.yhat)

        rf_pred = float(rf_model.predict([[year, month]])[0])
        xgb_pred = float(xgb_model.predict([[year, month]])[0])

        final = round((p_pred + rf_pred + xgb_pred) / 3, 2)
        series.append(
            {
                "year": year,
                "month": month,
                "price": final,
            }
        )

    return {"series": series}


app = FastAPI(title="Price Forecasting API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PFInput(BaseModel):
    commodity: str
    state: str
    district: str
    year: int = 2025
    month: int = 1


class PriceSeriesInput(BaseModel):
    commodity: str
    state: str
    district: str
    months_ahead: int = 6


@app.post("/predict/price")
def price_api(input_data: PFInput):
    try:
        return predict_price(
            input_data.commodity,
            input_data.state,
            input_data.district,
            input_data.year,
            input_data.month,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/price_series")
def price_series_api(input_data: PriceSeriesInput):
    try:
        return predict_price_series(
            input_data.commodity,
            input_data.state,
            input_data.district,
            input_data.months_ahead,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run: uvicorn server_PF:app --reload --port 8004
