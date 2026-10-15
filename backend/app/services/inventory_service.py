from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status
from .. import models, schemas

class InventoryService:
    @staticmethod
    def get_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        active_only: bool = False,
        low_stock_only: bool = False,
        skip: int = 0,
        limit: int = 200
    ) -> List[models.Product]:
        query = db.query(models.Product)
        if active_only:
            query = query.filter(models.Product.active_status == True)
        if category and category.lower() != "all":
            query = query.filter(models.Product.category.ilike(f"%{category}%"))
        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.Product.name.ilike(search_clean),
                    models.Product.sku.ilike(search_clean),
                    models.Product.category.ilike(search_clean),
                    models.Product.supplier_name.ilike(search_clean)
                )
            )
        if low_stock_only:
            query = query.filter(models.Product.current_stock <= models.Product.reorder_level)
            
        return query.order_by(models.Product.name.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> models.Product:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {product_id} not found")
        return product

    @staticmethod
    def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
        return db.query(models.Product).filter(models.Product.sku == sku.strip().upper()).first()

    @staticmethod
    def create_product(db: Session, product_in: schemas.ProductCreate) -> models.Product:
        existing = db.query(models.Product).filter(models.Product.sku == product_in.sku.strip().upper()).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product with SKU '{product_in.sku}' already exists.")

        product = models.Product(
            sku=product_in.sku.strip().upper(),
            name=product_in.name.strip(),
            category=product_in.category.strip(),
            unit=product_in.unit.strip().lower(),
            purchase_cost=float(product_in.purchase_cost),
            selling_price=float(product_in.selling_price),
            current_stock=int(product_in.current_stock),
            reorder_level=int(product_in.reorder_level),
            supplier_name=product_in.supplier_name.strip() if product_in.supplier_name else None,
            notes=product_in.notes.strip() if product_in.notes else None,
            active_status=True
        )
        db.add(product)
        db.flush()

        # If initial stock > 0, record initial stock movement
        if product.current_stock > 0:
            movement = models.StockMovement(
                product_id=product.id,
                movement_type="in",
                quantity=product.current_stock,
                occurred_at=datetime.utcnow(),
                reason="Initial Stock Creation",
                reference_id=f"INIT-{product.sku}",
                notes="Automatic opening balance recorded during product onboarding"
            )
            db.add(movement)

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> models.Product:
        product = InventoryService.get_product_by_id(db, product_id)
        update_data = product_update.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            if key == "name" and value is not None:
                setattr(product, key, value.strip())
            elif key == "category" and value is not None:
                setattr(product, key, value.strip())
            elif key == "unit" and value is not None:
                setattr(product, key, value.strip().lower())
            elif value is not None:
                setattr(product, key, value)

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def record_stock_movement(db: Session, movement_in: schemas.StockMovementCreate) -> models.StockMovement:
        product = InventoryService.get_product_by_id(db, movement_in.product_id)
        
        m_type = movement_in.movement_type.lower()
        qty = movement_in.quantity

        if m_type == "in":
            if qty <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock-in quantity must be greater than 0")
            delta = qty
        elif m_type == "out":
            if qty <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock-out quantity must be greater than 0")
            if product.current_stock < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {product.name} (SKU: {product.sku}). Available: {product.current_stock}, Requested deduction: {qty}"
                )
            delta = -qty
        elif m_type == "adjustment":
            if product.current_stock + qty < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Adjustment of {qty} would result in negative stock ({product.current_stock + qty}). Current stock: {product.current_stock}"
                )
            delta = qty
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid movement type. Allowed: 'in', 'out', 'adjustment'")

        # Update product current stock
        product.current_stock += delta

        movement = models.StockMovement(
            product_id=product.id,
            movement_type=m_type,
            quantity=delta,
            occurred_at=datetime.utcnow(),
            reason=movement_in.reason.strip(),
            reference_id=movement_in.reference_id.strip() if movement_in.reference_id else None,
            notes=movement_in.notes.strip() if movement_in.notes else None
        )
        db.add(movement)
        db.commit()
        db.refresh(movement)
        return movement

    @staticmethod
    def get_stock_movements(
        db: Session,
        product_id: Optional[int] = None,
        movement_type: Optional[str] = None,
        limit: int = 100
    ) -> List[dict]:
        query = db.query(models.StockMovement, models.Product).join(models.Product, models.StockMovement.product_id == models.Product.id)
        if product_id:
            query = query.filter(models.StockMovement.product_id == product_id)
        if movement_type and movement_type.lower() != "all":
            query = query.filter(models.StockMovement.movement_type == movement_type.lower())
            
        results = query.order_by(desc(models.StockMovement.occurred_at)).limit(limit).all()
        
        movements_list = []
        for mv, prod in results:
            movements_list.append({
                "id": mv.id,
                "product_id": mv.product_id,
                "movement_type": mv.movement_type,
                "quantity": mv.quantity,
                "occurred_at": mv.occurred_at,
                "reason": mv.reason,
                "reference_id": mv.reference_id,
                "notes": mv.notes,
                "product_name": prod.name,
                "product_sku": prod.sku
            })
        return movements_list

    @staticmethod
    def get_low_stock_alerts(db: Session) -> List[dict]:
        products = db.query(models.Product).filter(
            models.Product.active_status == True,
            models.Product.current_stock <= models.Product.reorder_level
        ).order_by(models.Product.current_stock.asc()).all()

        alerts = []
        for p in products:
            if p.current_stock <= 0:
                severity = "OUT_OF_STOCK"
                label = "Out of Stock"
            elif p.current_stock <= (p.reorder_level / 2):
                severity = "CRITICAL"
                label = "Critical Low Stock"
            else:
                severity = "LOW"
                label = "Low Stock"

            alerts.append({
                "product_id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "unit": p.unit,
                "current_stock": p.current_stock,
                "reorder_level": p.reorder_level,
                "shortfall": max(0, p.reorder_level - p.current_stock),
                "severity": severity,
                "severity_label": label,
                "purchase_cost": p.purchase_cost,
                "selling_price": p.selling_price
            })
        return alerts
