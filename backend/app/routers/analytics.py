from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])

@router.get("/kpis", response_model=schemas.DashboardKpiResponse)
def get_kpis(
    days: int = Query(30, ge=1, le=365, description="Period days"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_dashboard_kpis(
        db,
        days=days,
        start_date_str=start_date,
        end_date_str=end_date
    )

@router.get("/trend", response_model=List[schemas.SalesTrendPoint])
def get_sales_trend(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_sales_trend(db, days=days)

@router.get("/categories", response_model=List[schemas.CategoryPerformance])
def get_category_performance(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_category_performance(db, days=days)

@router.get("/top-products", response_model=List[schemas.ProductPerformance])
def get_top_products(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_product_rankings(db, days=days, limit=limit)

@router.get("/slow-moving", response_model=List[schemas.SlowMovingProduct])
def get_slow_moving_products(
    days: int = Query(30, ge=1, le=180),
    threshold: int = Query(3, ge=0, le=50, description="Max units sold threshold"),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_slow_moving_products(db, days=days, max_sales_threshold=threshold)
