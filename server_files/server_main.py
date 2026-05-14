# test_all_apis.py
import requests
import json
import os
# -----------------------------
# 1️⃣ Disease Detection API
# -----------------------------
# 1️⃣ Disease-only endpoint
CD_API_URL_DISEASE = "http://127.0.0.1:8001/predict/disease"

# 2️⃣ Disease + Severity endpoint (from the updated server)
CD_API_URL_DISEASE_SEV = "http://127.0.0.1:8001/predict/disease_severity"

# Local image path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
img_path = os.path.join(BASE_DIR, "..", "test_files", "diseasetest.jpeg")

if not os.path.exists(img_path):
    print("Image not found:", img_path)
else:
    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/jpeg")}

        # -----------------------------
        # 1️⃣ Test Disease Detection API
        # -----------------------------
        try:
            cd_resp = requests.post(CD_API_URL_DISEASE, files=files)
            cd_resp.raise_for_status()
            print("\n=== Disease Detection ===")
            print(json.dumps(cd_resp.json(), indent=2))
        except Exception as e:
            print("Disease Detection API Error:", e)

    # Need to reopen the file for the next request
    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/jpeg")}

        # -----------------------------------------
        # 2️⃣ Test Disease + Severity API (NEW)
        # -----------------------------------------
        try:
            cds_resp = requests.post(CD_API_URL_DISEASE_SEV, files=files)
            cds_resp.raise_for_status()
            print("\n=== Disease + Severity Detection ===")
            print(json.dumps(cds_resp.json(), indent=2))
        except Exception as e:
            print("Disease + Severity API Error:", e)

# -----------------------------
# 2️⃣ Fertilizer Prediction API
# -----------------------------
FS_API_URL = "http://127.0.0.1:8003/predict/fertilizer"
fs_input = {
    "data": {
        "Temparature": 26,
        "Humidity ": 70,
        "Moisture": 45,
        "Soil Type": "Sandy",
        "Crop Type": "Maize",
        "Nitrogen": 50,
        "Potassium": 40,
        "Phosphorous": 60
    }
}

try:
    fs_resp = requests.post(FS_API_URL, json=fs_input).json()
    print("\n=== Fertilizer Prediction ===")
    print(json.dumps(fs_resp, indent=2))
except Exception as e:
    print("Fertilizer API Error:", e)

# -----------------------------
# 3️⃣ Price Forecasting API
# -----------------------------
PF_API_URL = "http://127.0.0.1:8004/predict/price"
pf_input = {
    "commodity": "Maize",
    "state": "Kerala",
    "district": "Kollam",
    "year": 2025,
    "month": 1
}

try:
    pf_resp = requests.post(PF_API_URL, json=pf_input).json()
    print("\n=== Price Forecasting ===")
    print(json.dumps(pf_resp, indent=2))
except Exception as e:
    print("Price API Error:", e)

# -----------------------------
# 4️⃣ Crop Recommendation API
# -----------------------------
CR_API_URL = "http://127.0.0.1:8002/predict/crop"
cr_input = {
    "data": {
        "N": 70,
        "P": 45,
        "K": 50,
        "temperature": 27.5,
        "humidity": 70,
        "ph": 6.5,
        "rainfall": 200,
        "prev_crop": "pigeonpeas",
        "state": "Kerala",
        "district": "Kollam"
    }
}

try:
    cr_resp = requests.post(CR_API_URL, json=cr_input).json()
    print("\n=== Crop Recommendation ===")
    print(json.dumps(cr_resp, indent=2))
except Exception as e:
    print("Crop Recommendation API Error:", e)
