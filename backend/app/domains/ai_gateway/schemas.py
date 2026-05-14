from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

class HealthLogBase(BaseModel):
    user_id: int
    service_type: str
    request_payload: Dict[str, Any]
    response_data: Dict[str, Any]
    latency_ms: float
    status_code: int

class HealthLogCreate(HealthLogBase):
    pass

class HealthLog(HealthLogBase):
    id: int

    class Config:
        from_attributes = True

# AI Service Specific Schemas
class DiseasePredictionRequest(BaseModel):
    pass # multipart/form-data handled in router

class DiseasePredictionResponse(BaseModel):
    disease: str
    confidence: float
    severity: str
    recommendations: Optional[str] = None

class CropRecRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    prev_crop: str
    state: str
    district: str

class FertilizerRequest(BaseModel):
    Temperature: float = Field(alias="Temparature")
    Humidity: float = Field(alias="Humidity ")
    Moisture: float
    Soil_Type: str = Field(alias="Soil Type")
    Crop_Type: str = Field(alias="Crop Type")
    Nitrogen: float
    Potassium: float
    Phosphorous: float

    class Config:
        populate_by_name = True
