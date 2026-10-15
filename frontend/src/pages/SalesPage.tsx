import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Search,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Product, Sale, StoreSetting } from '../types';
import { api } from '../services/api';

interface CartItem {
  product: Product;
  quantity: number;
  unit_selling_price: number;
}

interface SalesPageProps {
  settings: StoreSetting | null;
}

export const SalesPage: React.FC<SalesPageProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  const currency = settings?.currency_symbol || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, salesData] = await Promise.all([
        api.getProducts({ active_only: true }),
        api.getSales({ limit: 20 })
      ]);
      setProducts(prodsData);
      setRecentSales(salesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleAddToCart = (product: Product) => {
    setErrorMsg(null);
    if (product.current_stock <= 0) {
      setErrorMsg(`Cannot add '${product.name}' — out of stock.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex >= 0) {
      const item = cart[existingIndex];
      if (item.quantity + 1 > product.current_stock) {
        setErrorMsg(`Cannot add more: only ${product.current_stock} ${product.unit} available in stock.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1, unit_selling_price: product.selling_price }]);
    }
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setErrorMsg(null);
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.current_stock) {
            setErrorMsg(`Available stock ceiling is ${item.product.current_stock} ${item.product.unit}.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    setCart(updated);
  };

  const handleRemoveItem = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_selling_price, 0);
  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_selling_price: item.unit_selling_price
        })),
        notes: 'Walk-in Kirana retail counter transaction'
      };

      const sale = await api.createSale(payload);
      setLastCompletedSale(sale);
      setCart([]);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Sale transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Point of Sale (POS) Counter</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record retail customer billing transactions with real-time stock deduction
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* POS Grid: Catalog on Left, Active Bill on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection Catalog */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Select Item to Add to Bill</h3>
            <span className="text-xs text-slate-500 font-medium">{filteredProducts.length} items available</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search by product name, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.current_stock <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && handleAddToCart(p)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white hover:bg-emerald-50/50 hover:border-emerald-300 border-slate-200 cursor-pointer shadow-2xs hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.current_stock} {p.unit} in stock
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{p.name}</h4>
                  <p className="text-[10px] text-slate-500">{p.category}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">
                      {currency}{p.selling_price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-0.5">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart / Bill Summary */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Sale Invoice</h3>
                <p className="text-[11px] text-slate-500">{cart.length} unique items</p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click any product from the catalog to start billing.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.product.id} className="pt-2.5 flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</h5>
                    <p className="text-[10px] text-slate-400">
                      {currency}{item.unit_selling_price} × {item.quantity} = {currency}{(item.quantity * item.unit_selling_price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-white rounded text-slate-600 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-white rounded text-slate-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals & Checkout */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Total Units</span>
              <span className="font-semibold">{cartUnits}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Total Bill Amount</span>
              <span className="text-xl text-emerald-700 tracking-tight">
                {currency}{cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Complete Sale & Deduct Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Last Transaction Receipt Banner */}
      {lastCompletedSale && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Sale Transaction Completed Successfully</h4>
                <p className="text-xs text-emerald-700 font-mono mt-0.5">
                  Invoice No: {lastCompletedSale.invoice_no} • Total: {currency}{lastCompletedSale.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastCompletedSale(null)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Recent Sales History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Sales Transactions</h3>
            <p className="text-[11px] text-slate-500">Historical sales transactions and itemized customer bills</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Last {recentSales.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Invoice No</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Items Sold</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-5 py-3 text-center">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                    {s.invoice_no}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                    {new Date(s.sold_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    <div className="line-clamp-1">
                      {s.items.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    {currency}{s.total_amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      s.source === 'demo'
                        ? 'bg-amber-100 text-amber-800'
                        : s.source === 'import'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {s.source}
                    </span>
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
