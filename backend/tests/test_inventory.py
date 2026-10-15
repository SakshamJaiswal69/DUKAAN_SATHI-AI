import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.database import Base
from app import models, schemas
from app.services.inventory_service import InventoryService

# In-memory SQLite for testing
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

def test_create_product(test_db):
    product_in = schemas.ProductCreate(
        sku="TEST-SKU-01",
        name="Test Basmati Rice 1kg",
        category="Staples",
        unit="packet",
        purchase_cost=80.0,
        selling_price=100.0,
        current_stock=10,
        reorder_level=5
    )
    product = InventoryService.create_product(test_db, product_in)
    assert product.id is not None
    assert product.sku == "TEST-SKU-01"
    assert product.current_stock == 10
    
    # Check that initial stock movement was automatically recorded
    movements = InventoryService.get_stock_movements(test_db, product_id=product.id)
    assert len(movements) == 1
    assert movements[0]["movement_type"] == "in"
    assert movements[0]["quantity"] == 10

def test_prevent_duplicate_sku(test_db):
    product_in = schemas.ProductCreate(
        sku="DUP-SKU-01",
        name="Product 1",
        category="Staples",
        selling_price=50.0,
        current_stock=5
    )
    InventoryService.create_product(test_db, product_in)

    with pytest.raises(HTTPException) as excinfo:
        InventoryService.create_product(test_db, product_in)
    assert excinfo.value.status_code == 400
    assert "already exists" in excinfo.value.detail

def test_stock_in_movement(test_db):
    product = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="STK-IN-01",
        name="Milk Carton",
        category="Dairy",
        selling_price=30.0,
        current_stock=10
    ))

    # Add 15 units
    InventoryService.record_stock_movement(test_db, schemas.StockMovementCreate(
        product_id=product.id,
        movement_type="in",
        quantity=15,
        reason="Fresh Delivery"
    ))

    updated = InventoryService.get_product_by_id(test_db, product.id)
    assert updated.current_stock == 25

def test_prevent_negative_stock(test_db):
    product = InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="NEG-TEST-01",
        name="Sugar 1kg",
        category="Staples",
        selling_price=45.0,
        current_stock=5
    ))

    # Attempt to deduct 10 units when only 5 exist
    with pytest.raises(HTTPException) as excinfo:
        InventoryService.record_stock_movement(test_db, schemas.StockMovementCreate(
            product_id=product.id,
            movement_type="out",
            quantity=10,
            reason="Bulk removal"
        ))
    assert excinfo.value.status_code == 400
    assert "Insufficient stock" in excinfo.value.detail

    # Verify stock remained untouched
    test_db.refresh(product)
    assert product.current_stock == 5

def test_low_stock_alerts(test_db):
    # Create an out-of-stock product
    InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="ALERT-01",
        name="Detergent",
        category="Household",
        selling_price=100.0,
        current_stock=0,
        reorder_level=10
    ))
    # Create a critical low-stock product
    InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="ALERT-02",
        name="Butter",
        category="Dairy",
        selling_price=50.0,
        current_stock=3,
        reorder_level=10
    ))
    # Create a healthy product
    InventoryService.create_product(test_db, schemas.ProductCreate(
        sku="ALERT-03",
        name="Salt",
        category="Staples",
        selling_price=20.0,
        current_stock=50,
        reorder_level=10
    ))

    alerts = InventoryService.get_low_stock_alerts(test_db)
    assert len(alerts) == 2
    assert alerts[0]["severity"] == "OUT_OF_STOCK"
    assert alerts[1]["severity"] == "CRITICAL"
