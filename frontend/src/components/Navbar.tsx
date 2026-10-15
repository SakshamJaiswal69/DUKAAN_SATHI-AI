import React from 'react';
import { Store, Database, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { StoreSetting } from '../types';

interface NavbarProps {
  settings: StoreSetting | null;
  lowStockCount: number;
  onNavigate: (page: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  lowStockCount,
  onNavigate,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">DukaanSaathi AI</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {settings?.shop_name || 'Smart Retail & Kirana Inventory System'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Demo Data Status Banner */}
          {settings?.is_demo_data ? (
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Database className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Realistic Kirana Demo Dataset Active</span>
              <button 
                onClick={() => onNavigate('settings')} 
                className="underline hover:text-amber-950 font-semibold ml-1"
              >
                Manage
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Store Data</span>
            </div>
          )}

          {/* Low Stock Warning Pill */}
          {lowStockCount > 0 && (
            <button
              onClick={() => onNavigate('stock')}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{lowStockCount} Low Stock Alert{lowStockCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Quick Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
