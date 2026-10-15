from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..services.inventory_service import InventoryService

router = APIRouter(prefix="/stock", tags=["Stock Management"])

@router.get("/alerts")
def get_stock_alerts(db: Session = Depends(get_db)):
    return InventoryService.get_low_stock_alerts(db)

@router.get("/movements")
def list_stock_movements(
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    movement_type: Optional[str] = Query(None, description="Filter by type ('in', 'out', 'adjustment')"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return InventoryService.get_stock_movements(
        db,
        product_id=product_id,
        movement_type=movement_type,
        limit=limit
    )

@router.post("/movement", response_model=schemas.StockMovementResponse, status_code=status.HTTP_201_CREATED)
def record_stock_movement(
    movement_in: schemas.StockMovementCreate,
    db: Session = Depends(get_db)
):
    movement = InventoryService.record_stock_movement(db, movement_in)
    return schemas.StockMovementResponse(
        id=movement.id,
        product_id=movement.product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        occurred_at=movement.occurred_at,
        reason=movement.reason,
        reference_id=movement.reference_id,
        notes=movement.notes,
        product_name=movement.product.name if movement.product else None,
        product_sku=movement.product.sku if movement.product else None
    )
