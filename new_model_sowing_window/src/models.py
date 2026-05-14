import joblib

class BaseModel:
    @classmethod
    def load(cls, path):
        return joblib.load(path)
        
    def predict(self, X):
        # Dynamically hunt for the underlying scikit-learn / xgboost model and invoke it.
        for attr in ['model', 'estimator', 'regressor', 'pipeline']:
            if hasattr(self, attr):
                val = getattr(self, attr)
                if hasattr(val, 'predict'):
                    return val.predict(X)
        
        # Fallback: iterate over all attributes looking for a predict method
        for attr in dir(self):
            if attr.startswith('_'): continue
            val = getattr(self, attr)
            if hasattr(val, 'predict') and not isinstance(val, type) and val is not self.predict:
                return val.predict(X)
                
        raise RuntimeError(f"Could not find an internal model to call .predict(X) on {self.__class__.__name__}")

# These subclasses are required because the .joblib model files were pickled
# with these class names. joblib.load() reconstructs the original class, so
# these must exist in this module for deserialization to succeed.
class CatBoostModel(BaseModel):
    pass

class LightGBMModel(BaseModel):
    pass

class RandomForestModel(BaseModel):
    pass

class XGBoostModel(BaseModel):
    pass

class MLPModel:
    @classmethod
    def load(cls, path):
        # Safely ignore pytorch models if this fails
        raise NotImplementedError("MLP Loading intentionally stubbed in forged module")

