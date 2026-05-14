from typing import Any, Dict, List
from fastapi import APIRouter, Depends, UploadFile, File
from prisma import Prisma

from app.db.session import get_db
from app.domains.ai_gateway.service import AIService
from app.domains.ai_gateway.schemas import CropRecRequest, FertilizerRequest
from app.core.dependencies import get_farmer, get_current_user

router = APIRouter()


@router.post("/disease_severity")
async def detect_disease(
    file: UploadFile = File(...),
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    ai_service = AIService(db)
    return await ai_service.predict_disease(current_farmer.id, file)


@router.post("/crop_recommendation")
async def recommend_crop(
    request: CropRecRequest,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    ai_service = AIService(db)
    return await ai_service.predict_crop_with_forecast(current_farmer.id, request.model_dump())


@router.post("/fertilizer_prediction")
async def predict_fertilizer(
    request: FertilizerRequest,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    ai_service = AIService(db)
    return await ai_service.predict_fertilizer(current_farmer.id, request.model_dump(by_alias=True))


@router.post("/price_forecast")
async def forecast_price(
    request: Dict[str, Any],
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    ai_service = AIService(db)
    return await ai_service.predict_price(current_farmer.id, request)


@router.post("/price_series")
async def forecast_price_series(
    request: Dict[str, Any],
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    ai_service = AIService(db)
    return await ai_service.predict_price(current_farmer.id, request, series=True)


@router.get("/health_scores")
async def get_health_scores(
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """
    Customer-accessible endpoint: returns average health scores per commodity
    from disease service HealthTrendLog entries.
    """
    logs = await db.healthtrendlog.find_many(
        where={"service_type": "disease"}
    )

    # Aggregate scores by commodity
    commodity_scores: Dict[str, List[float]] = {}
    for log in logs:
        resp = log.response_data
        if not isinstance(resp, dict):
            continue
        # Disease response may have a confidence/severity score
        commodity = resp.get("crop", resp.get("commodity", "unknown"))
        score = resp.get("confidence", resp.get("health_score", 0))
        if commodity not in commodity_scores:
            commodity_scores[commodity] = []
        commodity_scores[commodity].append(float(score))

    result = {}
    for commodity, scores in commodity_scores.items():
        result[commodity] = {
            "average_score": round(sum(scores) / len(scores), 2) if scores else 0,
            "sample_count": len(scores)
        }

    return result
