import joblib
import numpy as np

class WeightedEnsemble:
    @classmethod
    def load(cls, path):
        return joblib.load(path)
        
    def predict(self, model_preds):
        if hasattr(self, "weights") and hasattr(self, "model_names"):
            # Ensure order matches self.model_names
            w = self.weights
            return sum(model_preds.get(n, 0) * w[i] for i, n in enumerate(self.model_names))
        return np.mean(list(model_preds.values()))

class StackingEnsemble:
    @classmethod
    def load(cls, path):
        return joblib.load(path)
        
    def predict(self, model_preds):
        if hasattr(self, "meta_model") and hasattr(self, "model_names"):
            X = np.array([[model_preds.get(n, 0) for n in self.model_names]])
            res = self.meta_model.predict(X)
            return float(res[0]) if isinstance(res, (np.ndarray, list)) else res
        return np.mean(list(model_preds.values()))
