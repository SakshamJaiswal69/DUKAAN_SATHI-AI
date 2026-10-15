import {
  Product,
  StockMovement,
  StockAlert,
  Sale,
  DashboardKpis,
  SalesTrendPoint,
  CategoryPerformance,
  ProductPerformance,
  SlowMovingProduct,
  ProductForecast,
  HoldoutEvaluationSummary,
  StoreSetting,
  CsvPreview
} from '../types';

const BASE_URL = '/api';

export const api = {
  // Products
  async getProducts(params?: { search?: string; category?: string; active_only?: boolean; low_stock_only?: boolean }): Promise<Product[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.active_only) q.append('active_only', 'true');
    if (params?.low_stock_only) q.append('low_stock_only', 'true');
    const res = await fetch(`${BASE_URL}/products?${q.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/products/categories`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update product');
    }
    return res.json();
  },

  async toggleProductStatus(id: number): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products/${id}/toggle-status`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Stock
  async getStockAlerts(): Promise<StockAlert[]> {
    const res = await fetch(`${BASE_URL}/stock/alerts`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getStockMovements(params?: { product_id?: number; movement_type?: string; limit?: number }): Promise<StockMovement[]> {
    const q = new URLSearchParams();
    if (params?.product_id) q.append('product_id', params.product_id.toString());
    if (params?.movement_type) q.append('movement_type', params.movement_type);
    if (params?.limit) q.append('limit', params.limit.toString());
    const res = await fetch(`${BASE_URL}/stock/movements?${q.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async recordStockMovement(data: { product_id: number; movement_type: string; quantity: number; reason: string; reference_id?: string; notes?: string }): Promise<StockMovement> {
    const res = await fetch(`${BASE_URL}/stock/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to record stock movement');
    }
    return res.json();
  },

  // Sales
  async getSales(params?: { start_date?: string; end_date?: string; limit?: number }): Promise<Sale[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date) q.append('end_date', params.end_date);
    if (params?.limit) q.append('limit', params.limit.toString());
    const res = await fetch(`${BASE_URL}/sales?${q.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createSale(data: { items: { product_id: number; quantity: number; unit_selling_price?: number }[]; notes?: string }): Promise<Sale> {
    const res = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to record sale');
    }
    return res.json();
  },

  // Analytics
  async getDashboardKpis(days: number = 30, startDate?: string, endDate?: string): Promise<DashboardKpis> {
    const q = new URLSearchParams({ days: days.toString() });
    if (startDate) q.append('start_date', startDate);
    if (endDate) q.append('end_date', endDate);
    const res = await fetch(`${BASE_URL}/analytics/kpis?${q.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSalesTrend(days: number = 30): Promise<SalesTrendPoint[]> {
    const res = await fetch(`${BASE_URL}/analytics/trend?days=${days}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getCategoryPerformance(days: number = 30): Promise<CategoryPerformance[]> {
    const res = await fetch(`${BASE_URL}/analytics/categories?days=${days}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getTopProducts(days: number = 30, limit: number = 10): Promise<ProductPerformance[]> {
    const res = await fetch(`${BASE_URL}/analytics/top-products?days=${days}&limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSlowMovingProducts(days: number = 30, threshold: number = 3): Promise<SlowMovingProduct[]> {
    const res = await fetch(`${BASE_URL}/analytics/slow-moving?days=${days}&threshold=${threshold}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Forecast & Reorder
  async getProductForecast(productId: number, horizon: number = 7, safetyBuffer: number = 20, leadTime: number = 3): Promise<ProductForecast> {
    const res = await fetch(`${BASE_URL}/forecast/product/${productId}?horizon=${horizon}&safety_buffer=${safetyBuffer}&lead_time=${leadTime}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getModelEvaluationSummary(holdoutDays: number = 7): Promise<HoldoutEvaluationSummary> {
    const res = await fetch(`${BASE_URL}/forecast/summary?holdout_days=${holdoutDays}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAllForecastRecommendations(horizon: number = 7, safetyBuffer: number = 20, leadTime: number = 3): Promise<ProductForecast[]> {
    const res = await fetch(`${BASE_URL}/forecast/all-recommendations?horizon=${horizon}&safety_buffer=${safetyBuffer}&lead_time=${leadTime}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // CSV Import
  async previewCsv(file: File, type: 'products' | 'sales'): Promise<CsvPreview> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/import/preview/${type}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'CSV preview failed');
    }
    return res.json();
  },

  async commitCsv(file: File, type: 'products' | 'sales'): Promise<{ success: boolean; imported_count: number; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/import/commit/${type}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'CSV import failed');
    }
    return res.json();
  },

  // Settings
  async getSettings(): Promise<StoreSetting> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSettings(data: Partial<StoreSetting>): Promise<StoreSetting> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resetDemoData(storeType: string = 'kirana'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/settings/reset-demo?store_type=${storeType}`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async clearAllData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/settings/clear-all`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
