from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.ml_service import MLDemandForecastService

router = APIRouter(prefix="/forecast", tags=["Demand Forecasting & Reorder"])

@router.get("/product/{product_id}", response_model=schemas.ProductForecastResponse)
def get_product_forecast(
    product_id: int,
    horizon: int = Query(7, ge=1, le=30, description="Forecast horizon in days"),
    safety_buffer: float = Query(20.0, ge=0.0, le=100.0, description="Safety stock percentage"),
    lead_time: int = Query(3, ge=1, le=30, description="Supplier lead time in days"),
    db: Session = Depends(get_db)
):
    try:
        return MLDemandForecastService.forecast_product_demand(
            db,
            product_id=product_id,
            horizon_days=horizon,
            safety_buffer_percent=safety_buffer,
            lead_time_days=lead_time
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/summary", response_model=schemas.HoldoutEvaluationSummary)
def get_model_evaluation_summary(
    holdout_days: int = Query(7, ge=3, le=14, description="Chronological holdout test days"),
    db: Session = Depends(get_db)
):
    return MLDemandForecastService.get_overall_holdout_summary(db, holdout_days=holdout_days)

@router.get("/all-recommendations", response_model=List[schemas.ProductForecastResponse])
def get_all_product_forecasts(
    horizon: int = Query(7, ge=1, le=30),
    safety_buffer: float = Query(20.0, ge=0.0, le=100.0),
    lead_time: int = Query(3, ge=1, le=30),
    db: Session = Depends(get_db)
):
    products = db.query(models.Product).filter(models.Product.active_status == True).order_by(models.Product.name.asc()).all()
    recommendations = []
    for p in products:
        rec = MLDemandForecastService.forecast_product_demand(
            db,
            product_id=p.id,
            horizon_days=horizon,
            safety_buffer_percent=safety_buffer,
            lead_time_days=lead_time
        )
        recommendations.append(rec)
    
    # Sort with urgent reorders first
    priority_order = {"REORDER_NOW": 0, "REORDER_SOON": 1, "SUFFICIENT_STOCK": 2}
    recommendations.sort(key=lambda x: priority_order.get(x.recommendation_status, 3))
    return recommendations
