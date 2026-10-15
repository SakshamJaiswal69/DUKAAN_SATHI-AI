import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Clock,
  Layers,
  IndianRupee,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SalesTrendPoint, CategoryPerformance, SlowMovingProduct, StoreSetting } from '../types';
import { api } from '../services/api';

interface AnalyticsPageProps {
  settings: StoreSetting | null;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ settings }) => {
  const [days, setDays] = useState<number>(30);
  const [threshold, setThreshold] = useState<number>(3);
  const [trends, setTrends] = useState<SalesTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [slowMoving, setSlowMoving] = useState<SlowMovingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const currency = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [trendData, catData, slowData] = await Promise.all([
        api.getSalesTrend(days),
        api.getCategoryPerformance(days),
        api.getSlowMovingProducts(days, threshold)
      ]);
      setTrends(trendData);
      setCategories(catData);
      setSlowMoving(slowData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days, threshold]);

  const totalCapitalLocked = slowMoving.reduce((sum, item) => sum + item.capital_locked, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exploratory Data Analytics (EDA)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Category sales mix, daily revenue volume, and dead stock capital identification
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Analysis Horizon:</span>
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                days === d
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 7 ? '7 Days' : `${d} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Contribution Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Category Sales Share (%)</h3>
              <PieIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Revenue distribution across retail product categories
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${currency}${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            {categories.slice(0, 5).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-slate-700">{cat.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{cat.revenue_share_percent}%</span>
                  <span className="text-slate-400">({currency}{cat.revenue.toLocaleString('en-IN')})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Units Sold vs Revenue Velocity */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daily Sales Volume (Units Sold)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Physical unit movement over the last {days} days</p>
            </div>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(5)}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Units`, 'Quantity Sold']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="units_sold" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Slow Moving & Dead Stock Section (FR-06) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Slow-Moving Inventory & Capital Lockup</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies sluggish items where working capital is tied up in stagnant retail stock
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-500">Threshold:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-emerald-500"
            >
              <option value="1">≤ 1 Unit Sold</option>
              <option value="3">≤ 3 Units Sold (Default)</option>
              <option value="5">≤ 5 Units Sold</option>
              <option value="10">≤ 10 Units Sold</option>
            </select>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold">
              {currency}{totalCapitalLocked.toLocaleString('en-IN')} Locked
            </div>
          </div>
        </div>

        {/* Explicit Rule Disclosure Banner as required by SRS FR-06 */}
        <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center space-x-2 text-slate-600">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>Disclosed Rule:</strong> A product is flagged as slow-moving if total units sold ≤ <strong>{threshold}</strong> over the past <strong>{days}</strong> days.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Units Sold ({days}d)</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-right">Capital Locked</th>
                <th className="px-5 py-3 text-right">Days Since Last Sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slowMoving.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">No slow-moving products under current threshold.</p>
                  </td>
                </tr>
              ) : (
                slowMoving.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600">{p.category}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md font-bold text-amber-800 bg-amber-100">
                        {p.units_sold} units
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                      {p.current_stock}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      {currency}{p.capital_locked.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                      {p.days_with_no_sales} days
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
