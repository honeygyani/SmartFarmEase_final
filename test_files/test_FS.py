import pandas as pd
import numpy as np
import joblib
from treeinterpreter import treeinterpreter as ti
import warnings
warnings.filterwarnings("ignore")

# ----------------------------
# Load model
# ----------------------------
print("📂 Loading model...")
model = joblib.load("Z:\\Sem7MiniProject\\models\\Fertilizer Prediction\\fertilizer_model.pkl")
print("✅ Model loaded!")

# ----------------------------
# Example test input
# ----------------------------
test_data = pd.DataFrame([{
    "Temparature": 26,
    "Humidity ": 70,
    "Moisture": 45,
    "Soil Type": "Sandy",
    "Crop Type": "Maize",
    "Nitrogen": 50,
    "Potassium": 40,
    "Phosphorous": 60
}])

print("\n🧪 Test Input:")
print(test_data)

# ----------------------------
# Predict Probabilities
# ----------------------------
proba = model.predict_proba(test_data)[0]
classes = model.classes_

# Get top 3
top3_idx = np.argsort(proba)[::-1][:3]
top3 = [(classes[i], proba[i]) for i in top3_idx]

print("\n🎯 TOP-3 FERTILIZER RECOMMENDATIONS:")
for name, score in top3:
    print(f"→ {name}: {score:.3f}")

# --------------------------------------------------------
# TreeInterpreter Explainability for ALL TOP-3 predictions
# --------------------------------------------------------
print("\n🔍 Generating TreeInterpreter Explainability...")

# Extract components from pipeline
rf = model.named_steps["classifier"]
preprocessor = model.named_steps["preprocessor"]

# Transform input for the RF model
X_trans = preprocessor.transform(test_data)

# Run TreeInterpreter
prediction, bias, contributions = ti.predict(rf, X_trans)

feature_names = preprocessor.get_feature_names_out()

# Explain each of the top-3 suggested fertilizers
for idx, (fert, prob) in enumerate(top3):
    class_index = np.where(classes == fert)[0][0]

    print(f"\n📘 Explanation for: {fert}")
    print(f"Base value (bias): {bias[0][class_index]:.4f}")

    # Feature contributions to this fertilizer class
    contribs = contributions[0][:, class_index]

    # Pair feature → contribution
    feature_contrib_list = list(zip(feature_names, contribs))

    # Sort by absolute contribution
    feature_contrib_list.sort(key=lambda x: abs(x[1]), reverse=True)

    # Display top contributing features
    print("Feature contributions:")
    for feat, val in feature_contrib_list:
        print(f"   {feat}: {val:.4f}")

print("\n📁 Explanation complete.")
