from pydantic import BaseModel
from typing import Optional, Dict, Any

class SystemEventBase(BaseModel):
    event_type: str
    user_id: Optional[int] = None
    payload: Dict[str, Any]
    description: Optional[str] = None

class SystemEventCreate(SystemEventBase):
    pass

class SystemEvent(SystemEventBase):
    id: int

    class Config:
        from_attributes = True
