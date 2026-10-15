import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.database import Base
from app import models, schemas
from app.services.inventory_service import InventoryService
from app.services.sales_service import SalesService
from app.services.analytics_service import AnalyticsService

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_sale_creation_and_stock_deduction(test_db):
    p1 = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="SALE-P1",
        name="Sunflower Oil 1L",
        category="Oils",
        purchase_cost=120.0,
        selling_price=150.0,
        current_stock=20
    ))
    p2 = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="SALE-P2",
        name="Biscuits 200g",
        category="Snacks",
        purchase_cost=25.0,
        selling_price=30.0,
        current_stock=50
    ))

    sale_in = schemas.SaleCreate(
        items=[
            schemas.SaleItemCreate(product_id=p1.id, quantity=3),
            schemas.SaleItemCreate(product_id=p2.id, quantity=5)
        ],
        source="manual"
    )

    sale = SalesService.create_sale(test_db, sale_in)
    assert sale.id is not None
    # 3 * 150 + 5 * 30 = 450 + 150 = 600.0
    assert sale.total_amount == 600.0

    # Verify inventory was deducted correctly
    test_db.refresh(p1)
    test_db.refresh(p2)
    assert p1.current_stock == 17
    assert p2.current_stock == 45

    # Check that unit_cost_snapshot was saved
    assert sale.items[0].unit_cost_snapshot == 120.0
    assert sale.items[1].unit_cost_snapshot == 25.0

def test_sale_insufficient_stock_rejection(test_db):
    p = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="LOW-STK-P",
        name="Coffee Jar",
        category="Beverages",
        selling_price=200.0,
        current_stock=2
    ))

    sale_in = schemas.SaleCreate(
        items=[
            schemas.SaleItemCreate(product_id=p.id, quantity=5)
        ]
    )

    with pytest.raises(HTTPException) as excinfo:
        SalesService.create_sale(test_db, sale_in)
    assert excinfo.value.status_code == 400
    assert "Insufficient stock" in excinfo.value.detail

    # Verify stock was NOT deducted
    test_db.refresh(p)
    assert p.current_stock == 2

def test_analytics_kpi_calculation(test_db):
    p = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="KPI-P",
        name="Atta 5kg",
        category="Staples",
        purchase_cost=200.0,
        selling_price=250.0,
        current_stock=100
    ))

    SalesService.create_sale(test_db, schemas.SaleCreate(
        items=[schemas.SaleItemCreate(product_id=p.id, quantity=10)]
    ))

    kpis = AnalyticsService.get_dashboard_kpis(test_db, days=7)
    # Revenue = 10 * 250 = 2500
    # Profit = 10 * (250 - 200) = 500
    # Margin = 500 / 2500 * 100 = 20.0%
    assert kpis.total_revenue == 2500.0
    assert kpis.total_units_sold == 10
    assert kpis.estimated_gross_profit == 500.0
    assert kpis.gross_margin_percent == 20.0
