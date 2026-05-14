import os
import json
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

# ============================================
# CONFIG PATHS
# ============================================
MODEL_PATH = r"Z:\\Sem7MiniProject\\models\\Disease Detection\\plant_disease_detection.h5"
CATEGORIES_PATH = r"Z:\\Sem7MiniProject\\models\\Disease Detection\\categories.json"

# ============================================
# LOAD MODEL
# ============================================
print("\nLoading model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
print("Model loaded successfully!")

# ============================================
# LOAD CATEGORIES
# ============================================
with open(CATEGORIES_PATH, "r") as f:
    categories_dict = json.load(f)

# Convert dict to list ordered by index
CATEGORIES = [k for k, v in sorted(categories_dict.items(), key=lambda item: item[1])]
print(f"Loaded {len(CATEGORIES)} labels from categories.json")

# ============================================
# IMAGE PREPROCESSING
# ============================================
def load_and_preprocess(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

# ============================================
# PREDICTION FUNCTION
# ============================================
def predict_disease(img_path):
    img = load_and_preprocess(img_path)
    preds = model.predict(img)
    preds = np.array(preds)  # ensure numpy array

    # Get predicted index and confidence
    probs = preds[0]
    class_idx = np.argmax(probs)
    confidence = float(probs[class_idx])

    disease_name = CATEGORIES[class_idx] if class_idx < len(CATEGORIES) else f"Class {class_idx}"

    return disease_name, confidence

# ============================================
# MAIN TEST
# ============================================
if __name__ == "__main__":
    sample_image = r"Z:\\Sem7MiniProject\\test_files\\diseasetest2.jpg"
    print("\n=====================================")
    print(f"Testing image: {sample_image}")
    print("=====================================")

    disease, conf = predict_disease(sample_image)

    print("\n================= RESULT =================")
    print(f"Disease Prediction : {disease}")
    print(f"Confidence         : {conf*100:.2f}%")
    print("==========================================\n")
