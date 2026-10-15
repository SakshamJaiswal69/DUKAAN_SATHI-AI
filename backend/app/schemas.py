from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator

# ----------------- Product Schemas -----------------
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50, description="Unique SKU code")
    name: str = Field(..., min_length=1, max_length=200, description="Product Name")
    category: str = Field(..., min_length=1, max_length=100, description="Product Category")
    unit: str = Field(default="pcs", max_length=30, description="Unit e.g. pcs, kg, litre")
    purchase_cost: float = Field(default=0.0, ge=0.0, description="Purchase cost in ₹")
    selling_price: float = Field(..., gt=0.0, description="Selling price in ₹")
    current_stock: int = Field(default=0, ge=0, description="Initial stock")
    reorder_level: int = Field(default=10, ge=0, description="Reorder threshold")
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    purchase_cost: Optional[float] = Field(None, ge=0.0)
    selling_price: Optional[float] = Field(None, gt=0.0)
    reorder_level: Optional[int] = Field(None, ge=0)
    active_status: Optional[bool] = None
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    active_status: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Stock Movement Schemas -----------------
class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: str = Field(..., description="'in', 'out', or 'adjustment'")
    quantity: int = Field(..., description="Quantity changed. Positive for 'in', positive or negative for adjustment, positive for 'out' in UI (will be negated)")
    reason: str = Field(..., min_length=1, max_length=150)
    reference_id: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("movement_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v.lower() not in ["in", "out", "adjustment"]:
            raise ValueError("Movement type must be 'in', 'out', or 'adjustment'")
        return v.lower()

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    occurred_at: datetime
    reason: str
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------- Sales Schemas -----------------
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Units to sell")
    unit_selling_price: Optional[float] = Field(None, gt=0.0, description="Override price or leave None for product price")

class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1, description="List of items in sale")
    sold_at: Optional[datetime] = None
    notes: Optional[str] = None
    source: str = Field(default="manual", description="'manual', 'import', 'demo'")

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_selling_price: float
    unit_cost_snapshot: float
    line_total: float

    model_config = ConfigDict(from_attributes=True)

class SaleResponse(BaseModel):
    id: int
    invoice_no: str
    sold_at: datetime
    total_amount: float
    source: str
    notes: Optional[str] = None
    items: List[SaleItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ----------------- Dashboard & Analytics Schemas -----------------
class DashboardKpiResponse(BaseModel):
    selected_period_days: int
    start_date: str
    end_date: str
    total_revenue: float
    total_units_sold: int
    estimated_gross_profit: float
    gross_margin_percent: float
    cost_data_coverage_percent: float
    low_stock_count: int
    out_of_stock_count: int
    total_products_count: int
    total_inventory_valuation_cost: float
    total_inventory_valuation_retail: float
    is_demo_data: bool

class SalesTrendPoint(BaseModel):
    date: str
    revenue: float
    units_sold: int
    estimated_profit: float

class CategoryPerformance(BaseModel):
    category: str
    revenue: float
    units_sold: int
    product_count: int
    revenue_share_percent: float

class ProductPerformance(BaseModel):
    product_id: int
    sku: str
    name: str
    category: str
    units_sold: int
    revenue: float
    current_stock: int
    reorder_level: int
    stock_status: str  # 'OUT_OF_STOCK', 'CRITICAL', 'LOW', 'HEALTHY'

class SlowMovingProduct(BaseModel):
    product_id: int
    sku: str
    name: str
    category: str
    units_sold: int
    days_with_no_sales: int
    current_stock: int
    capital_locked: float
    rule_disclosed: str


# ----------------- Forecasting & Reorder Schemas -----------------
class ForecastDataPoint(BaseModel):
    date: str
    predicted_units: float
    baseline_units: float

class ProductForecastResponse(BaseModel):
    product_id: int
    sku: str
    name: str
    category: str
    current_stock: int
    reorder_level: int
    horizon_days: int
    model_name: str
    data_quality_status: str  # 'SUFFICIENT_DATA', 'LIMITED_DATA', 'INSUFFICIENT_DATA'
    data_points_count: int
    forecast_values: List[ForecastDataPoint]
    total_predicted_demand: float
    baseline_predicted_demand: float
    model_mae: Optional[float] = None
    baseline_mae: Optional[float] = None
    model_improvement_percent: Optional[float] = None
    
    # Reorder Recommendation
    suggested_reorder_qty: int
    safety_stock_buffer: int
    lead_time_days: int
    recommendation_status: str  # 'REORDER_NOW', 'REORDER_SOON', 'SUFFICIENT_STOCK'
    calculation_breakdown: str
    disclaimer: str

class HoldoutEvaluationSummary(BaseModel):
    evaluation_period_days: int
    total_skus_evaluated: int
    overall_model_mae: float
    overall_baseline_mae: float
    mae_improvement_percent: float
    evaluation_method: str
    time_split_cutoff: str


# ----------------- Settings Schemas -----------------
class StoreSettingUpdate(BaseModel):
    shop_name: Optional[str] = None
    currency_symbol: Optional[str] = None
    default_forecast_horizon_days: Optional[int] = Field(None, ge=1, le=90)
    default_safety_stock_percent: Optional[float] = Field(None, ge=0.0, le=200.0)
    default_lead_time_days: Optional[int] = Field(None, ge=1, le=30)
    store_type: Optional[str] = None

class StoreSettingResponse(BaseModel):
    id: int
    shop_name: str
    currency_symbol: str
    default_forecast_horizon_days: int
    default_safety_stock_percent: float
    default_lead_time_days: int
    is_demo_data: bool
    store_type: str = "kirana"
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- CSV Import Schemas -----------------
class CsvRowError(BaseModel):
    row_number: int
    sku: Optional[str] = None
    field: str
    message: str

class CsvPreviewResponse(BaseModel):
    file_type: str  # 'products' or 'sales'
    total_rows: int
    valid_rows_count: int
    invalid_rows_count: int
    preview_data: List[dict]
    errors: List[CsvRowError]

class CsvImportCommitResponse(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    message: str
