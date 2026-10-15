import random
import string
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from .. import models, schemas

class SalesService:
    @staticmethod
    def generate_invoice_number() -> str:
        timestamp_part = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"INV-{timestamp_part}-{random_suffix}"

    @staticmethod
    def create_sale(db: Session, sale_in: schemas.SaleCreate) -> models.Sale:
        if not sale_in.items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A sale must contain at least one item.")

        sold_at = sale_in.sold_at or datetime.utcnow()
        invoice_no = SalesService.generate_invoice_number()
        total_amount = 0.0

        sale = models.Sale(
            invoice_no=invoice_no,
            sold_at=sold_at,
            total_amount=0.0,
            source=sale_in.source,
            notes=sale_in.notes
        )
        db.add(sale)
        db.flush()

        for item_in in sale_in.items:
            if item_in.quantity <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sale quantity must be positive")

            product = db.query(models.Product).filter(models.Product.id == item_in.product_id).first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {item_in.product_id} not found")

            if not product.active_status:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {product.name} (SKU: {product.sku}) is deactivated.")

            # Strict stock availability check
            if product.current_stock < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.name}'. Available: {product.current_stock}, Requested: {item_in.quantity}"
                )

            unit_price = item_in.unit_selling_price if item_in.unit_selling_price is not None else product.selling_price
            line_total = round(unit_price * item_in.quantity, 2)
            total_amount += line_total

            # Snapshot current purchase cost for accurate historical profit computation
            cost_snapshot = product.purchase_cost

            # Deduct stock
            product.current_stock -= item_in.quantity

            # Create sale item
            sale_item = models.SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=item_in.quantity,
                unit_selling_price=unit_price,
                unit_cost_snapshot=cost_snapshot,
                line_total=line_total
            )
            db.add(sale_item)

            # Record stock movement audit trail
            movement = models.StockMovement(
                product_id=product.id,
                movement_type="out",
                quantity=-item_in.quantity,
                occurred_at=sold_at,
                reason="Sale Transaction",
                reference_id=invoice_no,
                notes=f"Sold via Invoice {invoice_no}"
            )
            db.add(movement)

        sale.total_amount = round(total_amount, 2)
        db.commit()
        db.refresh(sale)
        return sale

    @staticmethod
    def get_sales(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[dict]:
        query = db.query(models.Sale)
        if start_date:
            query = query.filter(models.Sale.sold_at >= start_date)
        if end_date:
            query = query.filter(models.Sale.sold_at <= end_date)

        sales = query.order_by(desc(models.Sale.sold_at)).offset(skip).limit(limit).all()
        
        result = []
        for s in sales:
            items_list = []
            for it in s.items:
                items_list.append({
                    "id": it.id,
                    "product_id": it.product_id,
                    "product_name": it.product.name if it.product else "Unknown",
                    "product_sku": it.product.sku if it.product else "Unknown",
                    "quantity": it.quantity,
                    "unit_selling_price": it.unit_selling_price,
                    "unit_cost_snapshot": it.unit_cost_snapshot,
                    "line_total": it.line_total
                })
            result.append({
                "id": s.id,
                "invoice_no": s.invoice_no,
                "sold_at": s.sold_at,
                "total_amount": s.total_amount,
                "source": s.source,
                "notes": s.notes,
                "items": items_list
            })
        return result

    @staticmethod
    def get_sale_by_invoice(db: Session, invoice_no: str) -> Optional[models.Sale]:
        return db.query(models.Sale).filter(models.Sale.invoice_no == invoice_no.strip()).first()
