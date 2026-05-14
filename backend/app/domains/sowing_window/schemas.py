from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class SowingWindowRequest(BaseModel):
    crop: str = Field(..., description="Name of the crop")
    state: str = Field(..., description="State or province name")
    season: str = Field(..., description="Farming season (kharif/rabi/summer/whole year)")

    # Optional fields (could be used if the model required them or for future usage)
    temperature: Optional[float] = None
    rainfall: Optional[float] = None
    soil_type: Optional[str] = None
    year: Optional[int] = Field(2026, description="Year for prediction")

class SowingWindowResponse(BaseModel):
    predicted_center_week: float
    sowing_week_start: int
    sowing_week_end: int
    date_start: str
    date_end: str
    confidence: str
    model_std: float
    model_predictions: Dict[str, float]
    crop: str
    state: str
    season: str
    year: int
    fao_reference: Optional[Dict[str, Any]] = None
