import httpx
import time
from typing import Any, Dict, Optional
from fastapi import HTTPException, UploadFile
from prisma import Prisma, Json
from app.core.config import settings
from app.domains.ai_gateway.repository import HealthLogRepository

class AIService:
    def __init__(self, db: Prisma):
        self.log_repo = HealthLogRepository(db)

    async def _log_call(self, user_id: int, service: str, payload: Dict, response: Dict, latency: float, status: int):
        log_data = {
            "user_id": user_id,
            "service_type": service,
            "request_payload": Json(payload),
            "response_data": Json(response),
            "latency_ms": latency,
            "status_code": status
        }
        await self.log_repo.create(log_data)

    async def predict_disease(self, user_id: int, file: UploadFile) -> Dict[str, Any]:
        start_time = time.time()
        url = f"{settings.AI_DISEASE_URL}/predict/disease_severity"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            try:
                response = await client.post(url, files=files)
                latency = (time.time() - start_time) * 1000
                result = response.json()
                await self._log_call(user_id, "disease", {"filename": file.filename}, result, latency, response.status_code)
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="AI Service Error")
                return result
            except httpx.RequestError as exc:
                raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {exc}")

    async def predict_crop(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        url = f"{settings.AI_CROP_REC_URL}/predict/crop"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json={"data": data})
                latency = (time.time() - start_time) * 1000
                result = response.json()
                await self._log_call(user_id, "crop_rec", data, result, latency, response.status_code)
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="AI Service Error")
                return result
            except httpx.RequestError as exc:
                raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {exc}")

    async def predict_fertilizer(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        url = f"{settings.AI_FERTILIZER_URL}/predict/fertilizer"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, json={"data": data})
                latency = (time.time() - start_time) * 1000
                result = response.json()
                await self._log_call(user_id, "fertilizer", data, result, latency, response.status_code)
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="AI Service Error")
                return result
            except httpx.RequestError as exc:
                raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {exc}")

    # Mapping from crop names to price model commodity names
    # These MUST match the sanitized commodity in .pkl files under models/Price Forecasting/
    CROP_TO_COMMODITY = {
        "rice": "PaddyDhanCommon", "paddy": "PaddyDhanCommon",
        "pigeonpea": "Arhar_Tur_Red_GramWhole", "tur": "Arhar_Tur_Red_GramWhole", "arhar": "Arhar_Tur_Red_GramWhole",
        "blackgram": "Black_Gram_Urd_BeansWhole", "urad": "Black_Gram_Urd_BeansWhole",
        "greengram": "Green_Gram_MoongWhole", "moong": "Green_Gram_MoongWhole", "mungbean": "Green_Gram_MoongWhole",
        "lentil": "Lentil_MasurWhole", "masoor": "Lentil_MasurWhole",
        "gram": "Bengal_GramGramWhole", "chickpea": "Bengal_GramGramWhole",
        "maize": "Maize", "wheat": "Wheat", "cotton": "Cotton",
        "groundnut": "Groundnut", "soybean": "Soyabean", "sunflower": "Sunflower",
        "jowar": "JowarSorghum", "sorghum": "JowarSorghum",
        "turmeric": "Turmeric", "tomato": "Tomato", "potato": "Potato", "onion": "Onion",
    }

    async def predict_crop_with_forecast(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Chain crop recommendation with price forecasts for each recommended crop."""
        crop_result = await self.predict_crop(user_id, data)

        # server_CR may already include price_forecasts from its own call to the price service
        existing_forecasts = crop_result.get("price_forecasts", {})
        if existing_forecasts:
            # Already has forecasts from server_CR - just return as-is
            return crop_result

        # Fallback: fetch price series from the price service ourselves
        price_forecasts = {}
        top5 = crop_result.get("top5", [])
        state = data.get("state", "")
        district = data.get("district", "")

        for item in top5:
            crop_name = item.get("crop", "")
            if not crop_name:
                continue
            commodity = self.CROP_TO_COMMODITY.get(crop_name.lower().replace(" ", ""), crop_name)
            try:
                price_data = {"commodity": commodity, "state": state, "district": district, "months_ahead": 6}
                forecast = await self.predict_price(user_id, price_data, series=True)
                series = forecast.get("series", [])
                if series:
                    price_forecasts[crop_name] = series
            except Exception:
                pass

        if price_forecasts:
            crop_result["price_forecasts"] = price_forecasts
        return crop_result

    async def predict_price(self, user_id: int, data: Dict[str, Any], series: bool = False) -> Dict[str, Any]:
        start_time = time.time()
        endpoint = "price_series" if series else "price"
        url = f"{settings.AI_PRICE_URL}/predict/{endpoint}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, json=data)
                latency = (time.time() - start_time) * 1000
                result = response.json()
                await self._log_call(user_id, f"price_{endpoint}", data, result, latency, response.status_code)
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail="AI Service Error")
                return result
            except httpx.RequestError as exc:
                raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {exc}")
