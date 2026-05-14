# server_CD.py
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import io
import os
import cv2

# === Import severity module ===
from severity import estimate_severity_from_bgr   # 👈 new

# Use relative paths for portability
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "Disease Detection", "plant_disease_detection.h5")
CATEGORIES_PATH = os.path.join(BASE_DIR, "..", "models", "Disease Detection", "categories.json")

# ---------------- Model Load ----------------
print("Loading Disease Detection model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("Model loaded!")

with open(CATEGORIES_PATH, "r") as f:
    categories_dict = json.load(f)
CATEGORIES = [k for k, v in sorted(categories_dict.items(), key=lambda item: item[1])]

# ---------------- Preprocess ----------------
def preprocess(img_bytes):
    img = image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

def predict(img_bytes):
    img = preprocess(img_bytes)
    preds = model.predict(img)[0]
    idx = int(np.argmax(preds))
    confidence = float(preds[idx])
    disease = CATEGORIES[idx] if idx < len(CATEGORIES) else f"Class {idx}"
    return {"disease": disease, "confidence": confidence}

def bytes_to_bgr(img_bytes):
    npbuf = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(npbuf, cv2.IMREAD_COLOR)

# ---------------- FastAPI App ----------------
app = FastAPI(title="Disease + Severity Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Endpoints ----------------

# Existing = Disease Only
@app.post("/predict/disease")
async def disease_api(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        return predict(img_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NEW = Disease + Severity
@app.post("/predict/disease_severity")
async def disease_severity_api(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()

        # disease prediction
        disease_info = predict(img_bytes)

        # severity prediction
        bgr = bytes_to_bgr(img_bytes)
        severity_info = estimate_severity_from_bgr(bgr)

        # return merged result
        return {**disease_info, **severity_info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run with:
# uvicorn server_CD:app --reload --port 8001