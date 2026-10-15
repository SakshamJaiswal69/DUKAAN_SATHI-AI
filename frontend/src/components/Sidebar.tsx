import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  lowStockCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products Catalog', icon: Package },
    { id: 'stock', label: 'Stock & Alerts', icon: Layers, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'sales', label: 'POS Sales Entry', icon: ShoppingCart },
    { id: 'analytics', label: 'Analytics & EDA', icon: BarChart3 },
    { id: 'forecast', label: 'Demand & Reorder', icon: TrendingUp },
    { id: 'import', label: 'CSV Import / Data', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings & Guide', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Retail Operations
        </div>
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-5 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Intelligence & Setup
        </div>
        {navItems.slice(4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academic Project MVP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Time-series ML demand forecasting with transparent safety buffers for Indian Kirana retailers.
          </p>
        </div>
      </div>
    </aside>
  );
};
