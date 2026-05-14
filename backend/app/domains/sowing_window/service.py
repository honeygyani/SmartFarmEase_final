import httpx
import time
from typing import Any, Dict
from fastapi import HTTPException
from app.core.config import settings
from app.domains.sowing_window.schemas import SowingWindowRequest, SowingWindowResponse


class SowingWindowService:
    """
    Proxies sowing-window prediction requests to the standalone
    Sowing Window microservice running on AI_SOWING_URL (port 8005).
    This mirrors the pattern used by all other AI services (disease,
    crop, fertilizer, price) in the AI Gateway.
    """

    async def predict(self, request: SowingWindowRequest) -> Dict[str, Any]:
        url = f"{settings.AI_SOWING_URL}/predict/sowing-window"
        payload = {
            "crop": request.crop,
            "state": request.state,
            "season": request.season,
            "year": request.year or 2026,
        }
        # Pass optional fields only if provided
        if request.temperature is not None:
            payload["temperature"] = request.temperature
        if request.rainfall is not None:
            payload["rainfall"] = request.rainfall
        if request.soil_type is not None:
            payload["soil_type"] = request.soil_type

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    detail = response.json().get("detail", "AI Service Error")
                    raise HTTPException(status_code=response.status_code, detail=detail)
                return response.json()
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=503,
                    detail=f"Sowing Window AI Service Unavailable: {exc}",
                )
