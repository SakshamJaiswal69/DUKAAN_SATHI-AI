import React, { useState, useEffect } from 'react';
import {
  Settings,
  HelpCircle,
  Database,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Presentation,
  Save,
  Sparkles,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { StoreSetting } from '../types';
import { api } from '../services/api';

interface SettingsHelpPageProps {
  settings: StoreSetting | null;
  onRefreshSettings: () => void;
}

export const SettingsHelpPage: React.FC<SettingsHelpPageProps> = ({ settings, onRefreshSettings }) => {
  const [formData, setFormData] = useState({
    shop_name: '',
    currency_symbol: '₹',
    default_forecast_horizon_days: 7,
    default_safety_stock_percent: 20,
    default_lead_time_days: 3,
    store_type: 'kirana'
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        shop_name: settings.shop_name,
        currency_symbol: settings.currency_symbol,
        default_forecast_horizon_days: settings.default_forecast_horizon_days,
        default_safety_stock_percent: settings.default_safety_stock_percent,
        default_lead_time_days: settings.default_lead_time_days,
        store_type: settings.store_type || 'kirana'
      });
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.updateSettings(formData);
      setStatusMsg({ type: 'success', text: 'Store settings saved successfully.' });
      onRefreshSettings();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async (storeType: 'kirana' | 'electricals') => {
    const label = storeType === 'electricals' ? 'Electricals & Hardware Shop' : 'Kirana & Grocery Store';
    if (!window.confirm(`Reset database to the 20 standard ${label} products and 60 days of realistic sales history?`)) return;
    try {
      const res = await api.resetDemoData(storeType);
      setStatusMsg({ type: 'success', text: res.message });
      onRefreshSettings();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Reset failed.' });
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL inventory, stock movements, and sales history? This will give you an empty shop for custom data.')) return;
    try {
      const res = await api.clearAllData();
      setStatusMsg({ type: 'success', text: res.message });
      onRefreshSettings();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Clear failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Store Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business details, switch between Electricals and Kirana presets, and manage datasets
        </p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Store Configuration Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Settings className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Retailer Store Profile</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shop / Retailer Trade Name</label>
              <input
                type="text"
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Store Business Type</label>
                <select
                  value={formData.store_type}
                  onChange={(e) => setFormData({ ...formData, store_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500 font-semibold text-slate-800"
                >
                  <option value="kirana">Grocery / Kirana Store</option>
                  <option value="electricals">Electricals & Hardware Shop</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Forecast Horizon</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.default_forecast_horizon_days}
                  onChange={(e) => setFormData({ ...formData, default_forecast_horizon_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Safety Buffer (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.default_safety_stock_percent}
                  onChange={(e) => setFormData({ ...formData, default_safety_stock_percent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.default_lead_time_days}
                  onChange={(e) => setFormData({ ...formData, default_lead_time_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </form>

          {/* Dataset Management Actions */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1-Click Industry Demo Presets
            </h4>

            {/* Electricals Preset Button */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <h5 className="text-xs font-bold text-indigo-950">Switch to Electricals Shop Preset</h5>
                </div>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Loads 20 electrical SKUs (Polycab wires, Philips LEDs, Anchor switches, MCBs, fans) & 60 days of sales
                </p>
              </div>
              <button
                onClick={() => handleResetDemoData('electricals')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Load Electricals</span>
              </button>
            </div>

            {/* Kirana Preset Button */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <h5 className="text-xs font-bold text-amber-950">Switch to Kirana / Grocery Preset</h5>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Restores 20 authentic Indian grocery SKUs (Atta, Dal, Oil, Milk, Biscuits, Spices) with 60 days of sales
                </p>
              </div>
              <button
                onClick={() => handleResetDemoData('kirana')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Kirana</span>
              </button>
            </div>

            {/* Wipe Data */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-rose-950">Wipe All Store Data</h5>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Deletes all products, sales, and audit movements for an empty shop
                </p>
              </div>
              <button
                onClick={handleClearAllData}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Viva Demo Notes & Metrics Guide */}
        <div className="lg:col-span-6 space-y-6">
          {/* Viva Walkthrough Guide */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Presentation className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Academic Demonstration Script (Viva Guide)</h3>
            </div>
            <p className="text-xs text-slate-500">
              Step-by-step walkthrough script for showcasing the system to college evaluators:
            </p>

            <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
              <li className="pl-1">
                <strong>Load Seed Dataset:</strong> Show the persistent demo banner and explain the 20 retail SKUs (supporting Kirana grocery or Electrical hardware).
              </li>
              <li className="pl-1">
                <strong>Inspect EDA & Trends:</strong> Navigate to <em>Analytics & EDA</em> to review the 30-day sales volume, category breakdown, and slow-moving items with disclosed rules.
              </li>
              <li className="pl-1">
                <strong>Demonstrate Low-Stock Alert:</strong> Show out-of-stock items (e.g., <em>Legrand RCCB</em> or <em>Surf Excel</em>), then trigger a Quick Inward Restock.
              </li>
              <li className="pl-1">
                <strong>Examine ML Demand Forecasting:</strong> Open <em>Demand & Reorder</em>. Highlight the <strong>Time-Ordered Holdout MAE</strong> compared against the 7-day Naive baseline.
              </li>
              <li className="pl-1">
                <strong>Mathematical Explainability:</strong> Inspect the formula card showing how Suggested Order = max(0, (Forecast Demand + Safety Buffer) - Current Stock) dynamically adapts to lead time and buffers.
              </li>
            </ol>
          </div>

          {/* Metric Glossary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-600">
              <BookOpen className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Core Metric Dictionary & Definitions</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 divide-y divide-slate-100">
              <div className="pt-2">
                <span className="font-bold text-slate-900 block">Sales Revenue</span>
                Sum of sale line totals (Selling Price × Quantity) for transactions recorded within selected date filters.
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-900 block">Estimated Gross Profit & Margin (%)</span>
                Computed strictly using snapshot purchase costs (∑ [Selling Price - Snapshot Cost] × Quantity). Honest coverage % is disclosed if cost records are missing.
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-900 block">Chronological Holdout Validation (MAE)</span>
                Mean Absolute Error measured strictly on unseen future days. Preserves temporal causality with zero data leakage.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
