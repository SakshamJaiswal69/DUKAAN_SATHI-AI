from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..services.inventory_service import InventoryService

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductResponse])
def list_products(
    search: Optional[str] = Query(None, description="Search name, SKU, category, supplier"),
    category: Optional[str] = Query(None, description="Filter by category"),
    active_only: bool = Query(False, description="Filter only active products"),
    low_stock_only: bool = Query(False, description="Filter products at or below reorder level"),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    return InventoryService.get_products(
        db,
        search=search,
        category=category,
        active_only=active_only,
        low_stock_only=low_stock_only,
        skip=skip,
        limit=limit
    )

@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    results = db.query(models.Product.category).distinct().all()
    categories = sorted(list({r[0] for r in results if r[0]}))
    return categories

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return InventoryService.get_product_by_id(db, product_id)

@router.post("", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    return InventoryService.create_product(db, product_in)

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return InventoryService.update_product(db, product_id, product_update)

@router.patch("/{product_id}/toggle-status", response_model=schemas.ProductResponse)
def toggle_product_status(product_id: int, db: Session = Depends(get_db)):
    product = InventoryService.get_product_by_id(db, product_id)
    product.active_status = not product.active_status
    db.commit()
    db.refresh(product)
    return product
