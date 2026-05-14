from predict import load_trained_pipeline, build_inference_features
import config as cfg
import numpy as np

def run_test():
    print("🔍 Loading pipeline...")
    OUTPUT_DIR = Path("D:\Honey\S8\sfee\sfee\outputss")
    
    encoders, base_models, wens, sens = load_trained_pipeline(cfg.OUTPUT_DIR)

    if not base_models:
        print("❌ No models loaded!")
        return
    
    print(f"✅ Loaded models: {list(base_models.keys())}")

    # Dummy test input
    crop = "rice"
    state = "Telangana"
    season = "kharif"
    year = 2026

    print("\n🔍 Building features...")
    features = build_inference_features(crop, state, season, year, encoders)
    print("✅ Features shape:", features.shape)

    print("\n🔍 Running predictions...")
    predictions = {}

    for name, model in base_models.items():
        try:
            pred = float(model.predict(features)[0])
            predictions[name] = pred
            print(f"✅ {name}: {pred:.2f}")
        except Exception as e:
            print(f"❌ {name} failed:", e)

    if not predictions:
        print("❌ All models failed")
        return

    print("\n🔍 Ensemble check...")
    try:
        avg_pred = np.mean(list(predictions.values()))
        print(f"✅ Ensemble (mean): {avg_pred:.2f}")
    except Exception as e:
        print("❌ Ensemble failed:", e)

    print("\n🎯 FINAL STATUS: MODEL WORKING ✅")

if __name__ == "__main__":
    run_test()