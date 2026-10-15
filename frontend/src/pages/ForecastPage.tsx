import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sparkles,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  BarChart2,
  Calendar,
  Layers,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ProductForecast, HoldoutEvaluationSummary, StoreSetting, Product } from '../types';
import { api } from '../services/api';

interface ForecastPageProps {
  settings: StoreSetting | null;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({ settings }) => {
  const [horizon, setHorizon] = useState<number>(7);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(20);
  const [leadTime, setLeadTime] = useState<number>(3);
  const [evaluation, setEvaluation] = useState<HoldoutEvaluationSummary | null>(null);
  const [recommendations, setRecommendations] = useState<ProductForecast[]>([]);
  const [selectedProductForecast, setSelectedProductForecast] = useState<ProductForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currency = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [evalData, recsData] = await Promise.all([
        api.getModelEvaluationSummary(7),
        api.getAllForecastRecommendations(horizon, safetyBuffer, leadTime)
      ]);
      setEvaluation(evalData);
      setRecommendations(recsData);
      if (recsData.length > 0) {
        setSelectedProductForecast(recsData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [horizon, safetyBuffer, leadTime]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Machine Learning Demand Prediction & Reorder Guidance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical lag regression model with time-ordered holdout validation and explainable replenishment buffers
          </p>
        </div>

        {/* Global Horizon & Parameters */}
        <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 pl-2">Horizon:</span>
          {[7, 14, 30].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                horizon === h
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Model Evaluation & Holdout Performance Banner (FR-10) */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                Academic Model Evaluation (FR-10)
              </span>
              <span className="text-xs text-slate-400">Zero Data Leakage Time-Split</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Time-Ordered Holdout Validation vs Moving Average Baseline
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Models are evaluated chronologically by training strictly on sales prior to cutoff date (
              <strong>{evaluation?.time_split_cutoff || 'T-7d'}</strong>) and predicting the unseen holdout window.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-xl border border-white/10 shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Ridge ML MAE</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {evaluation?.overall_model_mae || 0} <span className="text-xs text-slate-300">units/day</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Naive 7d MAE</div>
              <div className="text-xl font-bold text-slate-300 font-mono">
                {evaluation?.overall_baseline_mae || 0} <span className="text-xs text-slate-400">units/day</span>
              </div>
            </div>
            {evaluation?.mae_improvement_percent !== undefined && (
              <>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Improvement</div>
                  <div className="text-xl font-bold text-indigo-300 font-mono">
                    +{evaluation.mae_improvement_percent}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar: Safety Buffer and Lead Time */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-6 w-full md:w-auto">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-700">Safety Buffer:</span>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(Number(e.target.value))}
              className="w-28 accent-indigo-600"
            />
            <span className="font-bold text-indigo-600 font-mono">{safetyBuffer}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Lead Time:</span>
            <select
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-indigo-500"
            >
              <option value="1">1 Day</option>
              <option value="2">2 Days</option>
              <option value="3">3 Days (Default)</option>
              <option value="5">5 Days</option>
              <option value="7">7 Days</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 text-[11px] italic">
          Formula: Suggested Order = max(0, (Forecast Demand + Safety Buffer) - Current Stock)
        </div>
      </div>

      {/* Selected Product Forecast Deep-Dive */}
      {selectedProductForecast && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200">
                  {selectedProductForecast.sku}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedProductForecast.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Category: {selectedProductForecast.category} • Model: {selectedProductForecast.model_name}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                selectedProductForecast.recommendation_status === 'REORDER_NOW'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : selectedProductForecast.recommendation_status === 'REORDER_SOON'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {selectedProductForecast.recommendation_status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                {horizon}-Day Future Demand Projection (Units Sold)
              </h4>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>ML Predicted Units</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Baseline Moving Avg</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedProductForecast.forecast_values}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                    labelFormatter={(lbl) => `Forecast Date: ${lbl}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_units"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline_units"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mathematical Explainability Breakdown Card (FR-09) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Transparent Reorder Calculation Breakdown</span>
            </div>
            <p className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
              {selectedProductForecast.calculation_breakdown}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Stock</span>
                <span className="text-base font-bold text-slate-900">{selectedProductForecast.current_stock}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Forecast Demand ({horizon}d)</span>
                <span className="text-base font-bold text-indigo-600">{Math.ceil(selectedProductForecast.total_predicted_demand)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Safety Buffer ({safetyBuffer}%)</span>
                <span className="text-base font-bold text-slate-700">+{selectedProductForecast.safety_stock_buffer}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg">
                <span className="text-[10px] text-indigo-700 block font-semibold uppercase">Suggested Order</span>
                <span className="text-base font-bold text-indigo-900">{selectedProductForecast.suggested_reorder_qty} units</span>
              </div>
            </div>
          </div>

          {/* Academic Disclaimer Notice (FR-08) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Caution:</strong> {selectedProductForecast.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Catalog Reorder Suggestions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Procurement Guidance Across All Active SKUs ({recommendations.length})
            </h3>
            <p className="text-xs text-slate-500">
              Sorted by replenishment urgency: immediate reorders prioritized
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Product Name & SKU</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-center">Predicted Demand ({horizon}d)</th>
                <th className="px-4 py-3 text-center">Safety Buffer</th>
                <th className="px-4 py-3 text-center">Suggested Order</th>
                <th className="px-4 py-3 text-center">Urgency</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recommendations.map((item) => (
                <tr
                  key={item.product_id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    selectedProductForecast?.product_id === item.product_id ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{item.sku} • {item.category}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                    {item.current_stock}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-indigo-700">
                    {Math.ceil(item.total_predicted_demand)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-500 font-medium">
                    +{item.safety_stock_buffer}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg font-bold font-mono ${
                      item.suggested_reorder_qty > 0
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.suggested_reorder_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      item.recommendation_status === 'REORDER_NOW'
                        ? 'bg-rose-100 text-rose-800'
                        : item.recommendation_status === 'REORDER_SOON'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.recommendation_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedProductForecast(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
