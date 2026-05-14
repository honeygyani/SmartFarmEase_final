"""
config.py — Configuration for Sowing Window Predictor
"""
import os
from pathlib import Path

# ── Base Paths ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent          # final_year folder
OUTPUT_DIR = BASE_DIR
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Data File Paths ─────────────────────────────────────────────────────────
ICRISAT_PRODUCTION = DATA_DIR / "ICRISAT-District Level Data on area production.csv"
ICRISAT_FERTILIZER = DATA_DIR / "ICRISAT-District Level Data on fertlizer consumption.csv"
ICRISAT_IRRIGATION = DATA_DIR / "ICRISAT-District Level Data on irrigation .csv"
ICRISAT_RAINFALL   = DATA_DIR / "ICRISAT-District Level Data on rain fall.csv"
ICRISAT_SOIL       = DATA_DIR / "ICRISAT-District Level Data on soil type.csv"
CROP_YIELD         = DATA_DIR / "crop_yield.csv"
DAILY_RAINFALL     = DATA_DIR / "daily-rainfall-at-state-level.csv"
DAILY_WEATHER      = DATA_DIR / "india_2000_2024_daily_weather.csv"
SOIL_CLIMATE       = DATA_DIR / "Soil-Climate-data.csv"
IMDAA_NC           = DATA_DIR / "IMDAA_merged_1.08_1990_2020.nc"

# ── Crop Lists ──────────────────────────────────────────────────────────────
ICRISAT_CROPS = [
    "RICE", "WHEAT", "KHARIF SORGHUM", "RABI SORGHUM", "SORGHUM",
    "PEARL MILLET", "MAIZE", "FINGER MILLET", "BARLEY",
    "CHICKPEA", "PIGEONPEA", "MINOR PULSES",
    "GROUNDNUT", "SESAMUM", "RAPESEED AND MUSTARD",
    "SAFFLOWER", "CASTOR", "LINSEED", "SUNFLOWER", "SOYABEAN",
    "SUGARCANE", "COTTON"
]

# ── Temporal Split ──────────────────────────────────────────────────────────
RANDOM_STATE   = 42
TEST_YEARS     = [2015, 2016, 2017]
VAL_YEARS      = [2013, 2014]
TRAIN_YEARS_MAX = 2012

# ── Optuna ──────────────────────────────────────────────────────────────────
OPTUNA_TRIALS = 50

# ── XGBoost ─────────────────────────────────────────────────────────────────
XGB_PARAMS = {
    "n_estimators": 500, "max_depth": 6, "learning_rate": 0.05,
    "subsample": 0.8, "colsample_bytree": 0.8,
    "reg_alpha": 0.1, "reg_lambda": 1.0,
    "random_state": RANDOM_STATE, "n_jobs": -1,
}

# ── LightGBM ─────────────────────────────────────────────────────────────────
LGBM_PARAMS = {
    "n_estimators": 500, "max_depth": 6, "learning_rate": 0.05,
    "subsample": 0.8, "colsample_bytree": 0.8,
    "reg_alpha": 0.1, "reg_lambda": 1.0,
    "random_state": RANDOM_STATE, "verbose": -1, "n_jobs": -1,
}

# ── CatBoost ─────────────────────────────────────────────────────────────────
CATBOOST_PARAMS = {
    "iterations": 500, "depth": 6, "learning_rate": 0.05,
    "l2_leaf_reg": 3.0, "random_seed": RANDOM_STATE, "verbose": 0,
}

# ── Random Forest ─────────────────────────────────────────────────────────────
RF_PARAMS = {
    "n_estimators": 300, "max_depth": 12,
    "min_samples_split": 5, "min_samples_leaf": 2,
    "random_state": RANDOM_STATE, "n_jobs": -1,
}

# ── MLP ───────────────────────────────────────────────────────────────────────
# FIX: target is normalized to [0,1] during training; MLP trains on that scale.
# The model output is de-normalized back to weeks (1–52) at prediction time.
NN_PARAMS = {
    "hidden_dims": [256, 128, 64],
    "dropout": 0.3,
    "lr": 1e-3,
    "batch_size": 64,
    "epochs": 150,
    "patience": 20,       # increased patience
    "normalize_target": True,   # KEY FIX: normalize sowing week to [0,1]
}

# ── CNN-LSTM ──────────────────────────────────────────────────────────────────
# FIX: CNN-LSTM is ONLY used when temporal sequences are available.
# It is NEVER included in the static-feature ensemble.
CNN_LSTM_PARAMS = {
    "cnn_channels": [16, 32, 64],
    "lstm_hidden": 128,
    "lstm_layers": 2,
    "dropout": 0.3,
    "lr": 5e-4,
    "batch_size": 32,
    "epochs": 80,
    "patience": 15,
    "seq_len_weeks": 12,
    "normalize_target": True,   # same normalization as MLP
}

# ── Feature Groups ────────────────────────────────────────────────────────────
CATEGORICAL_FEATURES = ["crop_encoded", "season_encoded", "state_encoded"]
RAINFALL_MONTHS = [
    "jan_rain", "feb_rain", "mar_rain", "apr_rain", "may_rain", "jun_rain",
    "jul_rain", "aug_rain", "sep_rain", "oct_rain", "nov_rain", "dec_rain",
    "annual_rain",
]
WEATHER_FEATURES  = ["temp_max_mean", "temp_min_mean", "precip_sum", "rain_days", "wind_max_mean"]
SOIL_FEATURES_PREFIX = "soil_"
FERT_FEATURES     = ["n_per_ha", "p_per_ha", "k_per_ha", "total_fert_per_ha"]

# ── Sowing Window ─────────────────────────────────────────────────────────────
SOWING_WINDOW_HALF_WIDTH  = 3   # predicted_center ± 3 weeks = 6-week window
ACCURACY_TOLERANCE_WEEKS  = 1   # ±1 week counts as correct

# ── Confidence thresholds (in weeks std) ─────────────────────────────────────
# FIX: thresholds now relative to the 1-52 week scale.
CONFIDENCE_HIGH_STD   = 2.0   # std < 2 weeks  → HIGH
CONFIDENCE_MEDIUM_STD = 4.0   # std < 4 weeks  → MEDIUM
                               # else           → LOW

# ── IMDAA Grid ───────────────────────────────────────────────────────────────
IMDAA_GRID_RES   = 1.08
IMDAA_TIME_EPOCH = "1970-01-01"
IMDAA_LAT_RANGE  = (5.0, 40.0)
IMDAA_LON_RANGE  = (65.0, 100.0)

SURFACE_VARS_DIR = DATA_DIR / "Surface_variables"
ATMO_VARS_DIR    = DATA_DIR / "Atmospheric_variable"
CONSTANTS_DIR    = DATA_DIR / "Constants"

# ── State Centroids ───────────────────────────────────────────────────────────
STATE_CENTROIDS = {
    "Andhra Pradesh":      (15.9, 79.7),  "Arunachal Pradesh": (28.2, 94.7),
    "Assam":               (26.2, 92.9),  "Bihar":             (25.1, 85.3),
    "Chhattisgarh":        (21.3, 81.6),  "Delhi":             (28.7, 77.1),
    "Goa":                 (15.3, 74.0),  "Gujarat":           (22.3, 71.2),
    "Haryana":             (29.1, 76.1),  "Himachal Pradesh":  (31.1, 77.2),
    "Jharkhand":           (23.6, 85.3),  "Karnataka":         (15.3, 75.7),
    "Kerala":              (10.9, 76.3),  "Madhya Pradesh":    (22.9, 78.7),
    "Maharashtra":         (19.8, 75.3),  "Manipur":           (24.7, 93.9),
    "Meghalaya":           (25.5, 91.4),  "Mizoram":           (23.2, 92.9),
    "Nagaland":            (26.2, 94.6),  "Odisha":            (20.9, 84.0),
    "Punjab":              (31.1, 75.3),  "Rajasthan":         (27.0, 74.2),
    "Sikkim":              (27.5, 88.5),  "Tamil Nadu":        (11.1, 78.7),
    "Telangana":           (18.1, 79.0),  "Tripura":           (23.9, 91.9),
    "Uttar Pradesh":       (26.8, 80.9),  "Uttarakhand":       (30.1, 79.0),
    "West Bengal":         (22.9, 87.9),  "Jammu and Kashmir": (33.8, 76.6),
    "Puducherry":          (11.9, 79.8),
}

# ── Crop Season Calendar (FAO/ICAR reference) ─────────────────────────────────
# (week_start, week_end) = typical sowing window ISO weeks
CROP_CALENDAR = {
    # Kharif crops  (sown Jun–Jul, harvested Oct–Nov)
    ("rice",          "kharif"):   {"week_start": 22, "week_end": 28, "description": "June–July"},
    ("wheat",         "rabi"):     {"week_start": 44, "week_end": 48, "description": "Nov–Dec"},
    ("maize",         "kharif"):   {"week_start": 22, "week_end": 26, "description": "June–July"},
    ("sorghum",       "kharif"):   {"week_start": 22, "week_end": 27, "description": "June–July"},
    ("sorghum",       "rabi"):     {"week_start": 40, "week_end": 44, "description": "Oct–Nov"},
    ("pearl millet",  "kharif"):   {"week_start": 22, "week_end": 26, "description": "June–July"},
    ("groundnut",     "kharif"):   {"week_start": 22, "week_end": 26, "description": "June–July"},
    ("soyabean",      "kharif"):   {"week_start": 23, "week_end": 27, "description": "June–July"},
    ("cotton",        "kharif"):   {"week_start": 20, "week_end": 25, "description": "May–June"},
    ("sugarcane",     "whole year"):{"week_start": 5,  "week_end": 14, "description": "Feb–Apr"},
    ("chickpea",      "rabi"):     {"week_start": 41, "week_end": 46, "description": "Oct–Nov"},
    ("pigeonpea",     "kharif"):   {"week_start": 22, "week_end": 27, "description": "June–July"},
    ("mustard",       "rabi"):     {"week_start": 41, "week_end": 45, "description": "Oct–Nov"},
    ("sunflower",     "rabi"):     {"week_start": 41, "week_end": 45, "description": "Oct–Nov"},
    ("barley",        "rabi"):     {"week_start": 44, "week_end": 48, "description": "Nov–Dec"},
}