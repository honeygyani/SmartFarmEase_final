import joblib

class FeatureEncoders:
    @classmethod
    def load(cls, path):
        return joblib.load(path)
