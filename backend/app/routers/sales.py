from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..services.sales_service import SalesService

router = APIRouter(prefix="/sales", tags=["Sales Management"])

@router.get("", response_model=List[schemas.SaleResponse])
def list_sales(
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = 0,
    db: Session = Depends(get_db)
):
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    return SalesService.get_sales(db, start_date=start_dt, end_date=end_dt, limit=limit, skip=skip)

@router.get("/{invoice_no}", response_model=schemas.SaleResponse)
def get_sale_by_invoice(invoice_no: str, db: Session = Depends(get_db)):
    sale = SalesService.get_sale_by_invoice(db, invoice_no)
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Invoice '{invoice_no}' not found")
    
    items_list = []
    for it in sale.items:
        items_list.append(schemas.SaleItemResponse(
            id=it.id,
            product_id=it.product_id,
            product_name=it.product.name if it.product else None,
            product_sku=it.product.sku if it.product else None,
            quantity=it.quantity,
            unit_selling_price=it.unit_selling_price,
            unit_cost_snapshot=it.unit_cost_snapshot,
            line_total=it.line_total
        ))

    return schemas.SaleResponse(
        id=sale.id,
        invoice_no=sale.invoice_no,
        sold_at=sale.sold_at,
        total_amount=sale.total_amount,
        source=sale.source,
        notes=sale.notes,
        items=items_list
    )

@router.post("", response_model=schemas.SaleResponse, status_code=status.HTTP_201_CREATED)
def record_sale(sale_in: schemas.SaleCreate, db: Session = Depends(get_db)):
    sale = SalesService.create_sale(db, sale_in)
    
    items_list = []
    for it in sale.items:
        items_list.append(schemas.SaleItemResponse(
            id=it.id,
            product_id=it.product_id,
            product_name=it.product.name if it.product else None,
            product_sku=it.product.sku if it.product else None,
            quantity=it.quantity,
            unit_selling_price=it.unit_selling_price,
            unit_cost_snapshot=it.unit_cost_snapshot,
            line_total=it.line_total
        ))

    return schemas.SaleResponse(
        id=sale.id,
        invoice_no=sale.invoice_no,
        sold_at=sale.sold_at,
        total_amount=sale.total_amount,
        source=sale.source,
        notes=sale.notes,
        items=items_list
    )
