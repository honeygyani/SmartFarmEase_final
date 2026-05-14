# server_SW.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Use relative paths to import predict.py from new_model_sowing_window
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "new_model_sowing_window")

if MODEL_DIR not in sys.path:
    sys.path.insert(0, MODEL_DIR)

try:
    from predict import predict_sowing_window
except ImportError as e:
    print(f"Failed to import predict module from {MODEL_DIR}: {e}")
    predict_sowing_window = None

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(title="Sowing Window Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SowingWindowInput(BaseModel):
    crop: str
    state: str
    season: str
    year: Optional[int] = 2026
    temperature: Optional[float] = None
    rainfall: Optional[float] = None
    soil_type: Optional[str] = None

@app.post("/predict/sowing-window")
def sowing_window_api(input_data: SowingWindowInput):
    if not predict_sowing_window:
        raise HTTPException(status_code=500, detail="Model could not be loaded on the server.")
    
    try:
        # Pass parameters to the loaded model
        result = predict_sowing_window(
            crop=input_data.crop,
            state=input_data.state,
            season=input_data.season,
            year=input_data.year,
            verbose=False
        )
        if not result:
            raise HTTPException(status_code=500, detail="Model returned empty prediction.")
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# TERMINAL COMMAND TO RUN THIS SERVER
# =========================================================
# Activate the appropriate virtual environment first (e.g., venv_SW)
# Then run the following command from the server_files directory:
# Run: uvicorn server_SW:app --reload --port 8005
