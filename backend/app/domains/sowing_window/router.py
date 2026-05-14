from fastapi import APIRouter, Depends, HTTPException
from typing import Any

from app.core.dependencies import get_farmer
from app.domains.sowing_window.schemas import SowingWindowRequest, SowingWindowResponse
from app.domains.sowing_window.service import SowingWindowService

router = APIRouter()

@router.post("", response_model=SowingWindowResponse)
async def predict_sowing_window(
    request: SowingWindowRequest,
    current_farmer: Any = Depends(get_farmer)
):
    try:
        service = SowingWindowService()
        result = await service.predict(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
