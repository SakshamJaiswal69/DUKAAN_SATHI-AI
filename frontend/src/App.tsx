import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockPage } from './pages/StockPage';
import { SalesPage } from './pages/SalesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ForecastPage } from './pages/ForecastPage';
import { ImportPage } from './pages/ImportPage';
import { SettingsHelpPage } from './pages/SettingsHelpPage';
import { StoreSetting } from './types';
import { api } from './services/api';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [settings, setSettings] = useState<StoreSetting | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [targetStockProductId, setTargetStockProductId] = useState<number | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadGlobalMeta = async () => {
    setIsRefreshing(true);
    try {
      const [settingsData, alertsData] = await Promise.all([
        api.getSettings(),
        api.getStockAlerts()
      ]);
      setSettings(settingsData);
      setLowStockCount(alertsData.length);
    } catch (err) {
      console.error('Failed to load store metadata', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadGlobalMeta();
  }, []);

  const handleNavigateToStock = (productId?: number) => {
    setTargetStockProductId(productId);
    setCurrentPage('stock');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        settings={settings}
        lowStockCount={lowStockCount}
        onNavigate={setCurrentPage}
        onRefresh={loadGlobalMeta}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <DashboardPage
              settings={settings}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'products' && (
            <ProductsPage
              settings={settings}
              onNavigateToStock={handleNavigateToStock}
            />
          )}

          {currentPage === 'stock' && (
            <StockPage
              settings={settings}
              initialProductId={targetStockProductId}
            />
          )}

          {currentPage === 'sales' && (
            <SalesPage
              settings={settings}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsPage
              settings={settings}
            />
          )}

          {currentPage === 'forecast' && (
            <ForecastPage
              settings={settings}
            />
          )}

          {currentPage === 'import' && (
            <ImportPage />
          )}

          {currentPage === 'settings' && (
            <SettingsHelpPage
              settings={settings}
              onRefreshSettings={loadGlobalMeta}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
