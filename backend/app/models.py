from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    unit = Column(String(30), default="pcs", nullable=False)  # pcs, kg, g, litre, packet, etc.
    purchase_cost = Column(Float, default=0.0, nullable=False)
    selling_price = Column(Float, default=0.0, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    active_status = Column(Boolean, default=True, nullable=False)
    supplier_name = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")
    sale_items = relationship("SaleItem", back_populates="product")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    movement_type = Column(String(20), nullable=False)  # 'in', 'out', 'adjustment'
    quantity = Column(Integer, nullable=False)  # positive for in/positive adjustment, negative for out
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reason = Column(String(150), nullable=False)  # 'Sale', 'Purchase Order', 'Damaged/Expired', 'Physical Count Correction', 'Initial Stock'
    reference_id = Column(String(100), nullable=True)  # invoice number or PO number
    notes = Column(Text, nullable=True)

    product = relationship("Product", back_populates="stock_movements")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, index=True, nullable=False)
    sold_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    source = Column(String(20), default="manual", nullable=False)  # 'manual', 'import', 'demo'
    notes = Column(Text, nullable=True)

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_selling_price = Column(Float, nullable=False)
    unit_cost_snapshot = Column(Float, default=0.0, nullable=False)  # snapshot of cost at sale time
    line_total = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")


class StoreSetting(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(150), default="Apna Kirana Store", nullable=False)
    currency_symbol = Column(String(10), default="₹", nullable=False)
    default_forecast_horizon_days = Column(Integer, default=7, nullable=False)
    default_safety_stock_percent = Column(Float, default=20.0, nullable=False)
    default_lead_time_days = Column(Integer, default=3, nullable=False)
    is_demo_data = Column(Boolean, default=True, nullable=False)
    store_type = Column(String(50), default="kirana", nullable=False)  # 'kirana', 'electricals'
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
