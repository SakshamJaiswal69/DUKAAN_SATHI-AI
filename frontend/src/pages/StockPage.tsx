import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Package,
  CheckCircle,
  X,
  AlertOctagon
} from 'lucide-react';
import { Product, StockMovement, StockAlert, StoreSetting } from '../types';
import { api } from '../services/api';

interface StockPageProps {
  settings: StoreSetting | null;
  initialProductId?: number;
}

export const StockPage: React.FC<StockPageProps> = ({ settings, initialProductId }) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<number>(initialProductId || 0);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Fresh Supplier Purchase');
  const [refId, setRefId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const currency = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, movementsData, prodsData] = await Promise.all([
        api.getStockAlerts(),
        api.getStockMovements({ movement_type: filterType === 'all' ? undefined : filterType, limit: 150 }),
        api.getProducts()
      ]);
      setAlerts(alertsData);
      setMovements(movementsData);
      setProducts(prodsData);
      if (initialProductId && !selectedProductId) {
        setSelectedProductId(initialProductId);
      } else if (!selectedProductId && prodsData.length > 0) {
        setSelectedProductId(prodsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load stock data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const handleOpenQuickInward = (alert: StockAlert) => {
    setSelectedProductId(alert.product_id);
    setMovementType('in');
    setQuantity(Math.max(10, alert.shortfall + 10));
    setReason('Restock replenishment against alert');
    setRefId(`PO-RESTOCK-${alert.sku}`);
    setNotes(`Replenishing ${alert.shortfall} shortfall units`);
    setFormError(null);
    setModalOpen(true);
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (quantity <= 0 && movementType !== 'adjustment') {
      setFormError('Quantity must be greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Reason is required for audit trail compliance.');
      return;
    }

    try {
      await api.recordStockMovement({
        product_id: selectedProductId,
        movement_type: movementType,
        quantity: Number(quantity),
        reason: reason.trim(),
        reference_id: refId.trim() || undefined,
        notes: notes.trim() || undefined
      });
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Stock movement failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Management & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor low-stock thresholds, record inward supplies, and view historical inventory movements
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Stock Movement</span>
        </button>
      </div>

      {/* Active Threshold Alerts Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Low-Stock & Out-of-Stock Alerts ({alerts.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated threshold monitoring based on configured reorder levels
              </p>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-700">All products have sufficient stock levels</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No products require urgent reorder attention right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.product_id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === 'OUT_OF_STOCK'
                    ? 'bg-rose-50/50 border-rose-200'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-orange-50/30 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                    alert.severity === 'OUT_OF_STOCK'
                      ? 'bg-rose-200 text-rose-800'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-orange-200 text-orange-900'
                  }`}>
                    {alert.severity_label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{alert.sku}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 mt-2">{alert.name}</h4>
                <p className="text-[11px] text-slate-500">{alert.category}</p>

                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Stock</span>
                    <span className="font-bold text-slate-900">
                      {alert.current_stock} {alert.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Reorder Level</span>
                    <span className="font-semibold text-slate-700">
                      {alert.reorder_level} {alert.unit}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenQuickInward(alert)}
                  className="w-full mt-3 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Inward Restock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock Movement History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Stock Movement Audit Trail</h3>
            <p className="text-[11px] text-slate-500">Complete immutable record of all inventory changes</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Filter Type:</span>
            {['all', 'in', 'out', 'adjustment'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                  filterType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3 text-center">Movement Type</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Reason / Description</th>
                <th className="px-5 py-3 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No stock movements recorded</p>
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isIn = m.movement_type === 'in' || m.quantity > 0;
                  const isOut = m.movement_type === 'out' || m.quantity < 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(m.occurred_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{m.product_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{m.product_sku}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOut
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{m.movement_type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span className={isIn ? 'text-emerald-600' : 'text-rose-600'}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{m.reason}</div>
                        {m.notes && <div className="text-[10px] text-slate-400 italic">{m.notes}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-500">
                        {m.reference_id || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Movement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Stock Movement</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRecordMovement} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Product SKU *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Stock: {p.current_stock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Movement Type</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="in">Inward / Supplier Delivery (+)</option>
                    <option value="out">Outward / Removal (-)</option>
                    <option value="adjustment">Stock Adjustment (Audit)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Movement *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inward Restock PO, Damaged Box, Expiry Write-off"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reference / Invoice No (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-004, SUP-BILL-912"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional audit notes or delivery remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold cursor-pointer shadow-sm"
                >
                  Commit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
