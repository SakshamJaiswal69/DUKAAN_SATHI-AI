export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  purchase_cost: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  active_status: boolean;
  supplier_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  occurred_at: string;
  reason: string;
  reference_id?: string;
  notes?: string;
  product_name?: string;
  product_sku?: string;
}

export interface StockAlert {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  shortfall: number;
  severity: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW';
  severity_label: string;
  purchase_cost: number;
  selling_price: number;
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_selling_price: number;
  unit_cost_snapshot: number;
  line_total: number;
}

export interface Sale {
  id: number;
  invoice_no: string;
  sold_at: string;
  total_amount: number;
  source: string;
  notes?: string;
  items: SaleItem[];
}

export interface DashboardKpis {
  selected_period_days: number;
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_units_sold: number;
  estimated_gross_profit: number;
  gross_margin_percent: number;
  cost_data_coverage_percent: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_products_count: number;
  total_inventory_valuation_cost: number;
  total_inventory_valuation_retail: number;
  is_demo_data: boolean;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  units_sold: number;
  estimated_profit: number;
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  units_sold: number;
  product_count: number;
  revenue_share_percent: number;
}

export interface ProductPerformance {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
  current_stock: number;
  reorder_level: number;
  stock_status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'HEALTHY';
}

export interface SlowMovingProduct {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  units_sold: number;
  days_with_no_sales: number;
  current_stock: number;
  capital_locked: number;
  rule_disclosed: string;
}

export interface ForecastDataPoint {
  date: string;
  predicted_units: number;
  baseline_units: number;
}

export interface ProductForecast {
  product_id: number;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  horizon_days: number;
  model_name: string;
  data_quality_status: 'SUFFICIENT_DATA' | 'LIMITED_DATA' | 'INSUFFICIENT_DATA';
  data_points_count: number;
  forecast_values: ForecastDataPoint[];
  total_predicted_demand: number;
  baseline_predicted_demand: number;
  model_mae?: number;
  baseline_mae?: number;
  model_improvement_percent?: number;
  suggested_reorder_qty: number;
  safety_stock_buffer: number;
  lead_time_days: number;
  recommendation_status: 'REORDER_NOW' | 'REORDER_SOON' | 'SUFFICIENT_STOCK';
  calculation_breakdown: string;
  disclaimer: string;
}

export interface HoldoutEvaluationSummary {
  evaluation_period_days: number;
  total_skus_evaluated: number;
  overall_model_mae: number;
  overall_baseline_mae: number;
  mae_improvement_percent: number;
  evaluation_method: string;
  time_split_cutoff: string;
}

export interface StoreSetting {
  id: number;
  shop_name: string;
  currency_symbol: string;
  default_forecast_horizon_days: number;
  default_safety_stock_percent: number;
  default_lead_time_days: number;
  is_demo_data: boolean;
  store_type?: string;
  updated_at: string;
}

export interface CsvError {
  row_number: number;
  sku?: string;
  field: string;
  message: string;
}

export interface CsvPreview {
  file_type: 'products' | 'sales';
  total_rows: number;
  valid_rows_count: number;
  invalid_rows_count: number;
  preview_data: any[];
  errors: CsvError[];
}
