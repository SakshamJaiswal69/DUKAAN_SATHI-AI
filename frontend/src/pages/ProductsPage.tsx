import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  IndianRupee,
  Layers
} from 'lucide-react';
import { Product, StoreSetting } from '../types';
import { api } from '../services/api';

interface ProductsPageProps {
  settings: StoreSetting | null;
  onNavigateToStock: (productId?: number) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ settings, onNavigateToStock }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: 'pcs',
    purchase_cost: 0,
    selling_price: 0,
    current_stock: 0,
    reorder_level: 10,
    supplier_name: '',
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const currency = settings?.currency_symbol || '₹';

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({
          search: search || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          low_stock_only: lowStockOnly
        }),
        api.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, lowStockOnly]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: categories[0] || 'Staples & Grains',
      unit: 'packet',
      purchase_cost: 0,
      selling_price: 0,
      current_stock: 0,
      reorder_level: 10,
      supplier_name: '',
      notes: ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      purchase_cost: p.purchase_cost,
      selling_price: p.selling_price,
      current_stock: p.current_stock,
      reorder_level: p.reorder_level,
      supplier_name: p.supplier_name || '',
      notes: p.notes || ''
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!editingProduct && !formData.sku.trim()) {
      setFormError('SKU code is required.');
      return;
    }
    if (formData.selling_price <= 0) {
      setFormError('Selling price must be greater than ₹0.');
      return;
    }
    if (formData.purchase_cost < 0) {
      setFormError('Purchase cost cannot be negative.');
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          purchase_cost: Number(formData.purchase_cost),
          selling_price: Number(formData.selling_price),
          reorder_level: Number(formData.reorder_level),
          supplier_name: formData.supplier_name,
          notes: formData.notes
        });
      } else {
        await api.createProduct({
          sku: formData.sku,
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          purchase_cost: Number(formData.purchase_cost),
          selling_price: Number(formData.selling_price),
          current_stock: Number(formData.current_stock),
          reorder_level: Number(formData.reorder_level),
          supplier_name: formData.supplier_name,
          notes: formData.notes
        });
      }
      setModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (productId: number) => {
    try {
      await api.toggleProductStatus(productId);
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage retail SKUs, pricing structures, and reorder thresholds
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, SKU, brand, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-emerald-500"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0 select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Product & SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search or category filter.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.current_stock <= 0;
                  const isCritical = p.current_stock > 0 && p.current_stock <= p.reorder_level / 2;
                  const isLow = p.current_stock > p.reorder_level / 2 && p.current_stock <= p.reorder_level;
                  const marginPct = p.purchase_cost > 0 ? Math.round(((p.selling_price - p.purchase_cost) / p.selling_price) * 100) : null;

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${!p.active_status ? 'opacity-50 bg-slate-50/50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {p.sku} {p.supplier_name && `• ${p.supplier_name}`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {p.category}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                        {currency}{p.purchase_cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-slate-900">{currency}{p.selling_price.toFixed(2)}</span>
                        {marginPct !== null && (
                          <div className="text-[10px] text-emerald-600 font-semibold">{marginPct}% margin</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center space-x-1.5 font-bold text-slate-900">
                          <span>{p.current_stock}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Reorder at {p.reorder_level}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isCritical ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                            Critical Low
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer inline-flex"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateToStock(p.id)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex"
                          title="Stock Adjustment / Inward"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer inline-flex ${
                            p.active_status ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                          title={p.active_status ? 'Deactivate SKU' : 'Activate SKU'}
                        >
                          {p.active_status ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product SKU' : 'Create New Product'}
              </h3>
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

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    placeholder="e.g. SKU-ATTA-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-emerald-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wires & Cables, Lighting, Staples"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Wires & Cables', 'Lighting & LED', 'Switches & Sockets', 'Circuit Protection & MCB', 'Fans & Appliances', 'Conduits & Piping', 'Electrical Accessories'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded text-slate-600 transition-colors cursor-pointer"
                      >
                        +{cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta 5kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Purchase Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="pcs">pcs</option>
                    <option value="coil">coil (Wires / Cables)</option>
                    <option value="meter">meter</option>
                    <option value="bundle">bundle (Pipes / Conduits)</option>
                    <option value="roll">roll (Tapes / Insulators)</option>
                    <option value="box">box / pack</option>
                    <option value="set">set</option>
                    <option value="packet">packet</option>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="pouch">pouch</option>
                    <option value="carton">carton</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Initial Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                    />
                  </div>
                )}
                <div className={editingProduct ? 'col-span-2' : ''}>
                  <label className="font-semibold text-slate-700 block mb-1">Reorder Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supplier / Distributor</label>
                <input
                  type="text"
                  placeholder="e.g. ITC Distribution Hub, Local Mandi"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
