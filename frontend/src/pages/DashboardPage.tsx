import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Boxes,
  AlertOctagon,
  ArrowUpRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { DashboardKpis, SalesTrendPoint, ProductPerformance, StockAlert, StoreSetting } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  settings: StoreSetting | null;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ settings, onNavigate }) => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const currency = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpisData, trendData, topData, alertsData] = await Promise.all([
        api.getDashboardKpis(periodDays),
        api.getSalesTrend(periodDays),
        api.getTopProducts(periodDays, 5),
        api.getStockAlerts()
      ]);
      setKpis(kpisData);
      setTrend(trendData);
      setTopProducts(topData);
      setAlerts(alertsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodDays]);

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time retail sales performance, gross margins, and stock intelligence
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Period:</span>
          {[7, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodDays === days
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {days === 7 ? 'Last 7 Days' : days === 30 ? 'Last 30 Days' : `${days} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Sales Revenue"
          value={`${currency}${(kpis?.total_revenue || 0).toLocaleString('en-IN')}`}
          subtitle={`${kpis?.total_units_sold || 0} units sold in ${periodDays} days`}
          icon={IndianRupee}
          variant="emerald"
        />

        <MetricCard
          title="Estimated Gross Profit"
          value={`${currency}${(kpis?.estimated_gross_profit || 0).toLocaleString('en-IN')}`}
          subtitle={`Cost coverage: ${kpis?.cost_data_coverage_percent || 100}% of sales`}
          icon={TrendingUp}
          variant="blue"
          badge={{
            text: `${kpis?.gross_margin_percent || 0}% Margin`,
            variant: (kpis?.gross_margin_percent || 0) >= 15 ? 'positive' : 'warning'
          }}
        />

        <MetricCard
          title="Inventory Valuation"
          value={`${currency}${(kpis?.total_inventory_valuation_cost || 0).toLocaleString('en-IN')}`}
          subtitle={`Retail Value: ${currency}${(kpis?.total_inventory_valuation_retail || 0).toLocaleString('en-IN')}`}
          icon={Boxes}
          variant="indigo"
          badge={{
            text: `${kpis?.total_products_count || 0} SKUs`,
            variant: 'neutral'
          }}
        />

        <MetricCard
          title="Inventory Health"
          value={kpis?.low_stock_count || 0}
          subtitle={`${kpis?.out_of_stock_count || 0} completely out of stock`}
          icon={AlertOctagon}
          variant={kpis?.low_stock_count ? 'rose' : 'emerald'}
          badge={{
            text: kpis?.low_stock_count ? 'Needs Attention' : 'Healthy',
            variant: kpis?.low_stock_count ? 'negative' : 'positive'
          }}
        />
      </div>

      {/* Main Revenue & Demand Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Profit Trajectory</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily sales velocity and estimated gross profit over the last {periodDays} days
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Revenue ({currency})</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Gross Profit ({currency})</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => val.slice(5)}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${currency}${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                formatter={(value: any, name: any) => [
                  `${currency}${Number(value || 0).toLocaleString('en-IN')}`,
                  name === 'revenue' ? 'Sales Revenue' : 'Est. Gross Profit'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
              <Area
                type="monotone"
                dataKey="estimated_profit"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Low Stock Alerts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low Stock Watchlist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Immediate Reorder Watchlist</h3>
                <p className="text-[11px] text-slate-500">Products at or below configured threshold</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All Alerts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">All inventory levels are healthy</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No products currently breach reorder thresholds.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((item) => (
                <div key={item.product_id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      SKU: {item.sku} • {item.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {item.current_stock} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Min: {item.reorder_level}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      item.severity === 'OUT_OF_STOCK'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : item.severity === 'CRITICAL'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {item.severity_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Revenue Generators</h3>
                <p className="text-[11px] text-slate-500">Fastest selling items in the selected period</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>Full EDA</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.map((p, idx) => (
              <div key={p.product_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {p.category} • {p.units_sold} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">
                    {currency}{p.revenue.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-400">Stock: {p.current_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('sales')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold">New Sale Transaction</h4>
            <p className="text-xs text-emerald-100 mt-0.5">Record customer walk-in bill & deduct stock</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-white/80" />
        </div>

        <div 
          onClick={() => onNavigate('forecast')}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-4 rounded-xl cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold">AI Demand Prediction</h4>
            <p className="text-xs text-indigo-100 mt-0.5">Calculate 7-day replenishment recommendations</p>
          </div>
          <Sparkles className="w-5 h-5 text-white/80" />
        </div>

        <div 
          onClick={() => onNavigate('import')}
          className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 rounded-xl cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <h4 className="text-sm font-bold">CSV Data Import</h4>
            <p className="text-xs text-slate-300 mt-0.5">Upload products or bulk sales history</p>
          </div>
          <Layers className="w-5 h-5 text-white/80" />
        </div>
      </div>
    </div>
  );
};
