import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Obtener métricas del dashboard
  const dashboardMetrics = useQuery(api.sales.getDashboardMetrics, {
    month: selectedMonth,
    year: selectedYear,
  });

  // Obtener top productos más vendidos
  const topSellingProducts = useQuery(api.sales.getTopSellingProducts, {
    month: selectedMonth,
    year: selectedYear,
    limit: 3,
  });

  // Obtener top productos más rentables
  const topProfitableProducts = useQuery(api.sales.getTopProfitableProducts, {
    limit: 3,
  });

  // Obtener ventas por canal
  const salesByChannel = useQuery(api.sales.getSalesByChannel, {
    month: selectedMonth,
    year: selectedYear,
  });

  // Obtener estado del inventario
  const inventoryStatus = useQuery(api.products.getInventoryStatus, {});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const handlePreviousMonth = () => {
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    } else {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
    } else {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    }
  };

  if (!dashboardMetrics || !topSellingProducts || !topProfitableProducts || !salesByChannel || !inventoryStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Resumen financiero y métricas del negocio</p>
          </div>
          
          {/* Selector de mes */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mes anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {getMonthName(selectedMonth)} {selectedYear}
              </div>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Mes siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Ingresos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(dashboardMetrics.totalIncome)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Ventas: {formatCurrency(dashboardMetrics.salesIncome)} | 
                Adicionales: {formatCurrency(dashboardMetrics.additionalIncome)}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gastos</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(dashboardMetrics.totalExpenses)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Productos: {formatCurrency(dashboardMetrics.productCosts)} | 
                Envíos: {formatCurrency(dashboardMetrics.shippingCosts)} | 
                Otros: {formatCurrency(dashboardMetrics.additionalExpenses)}
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ganancia Neta</p>
              <p className={`text-2xl font-semibold ${dashboardMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashboardMetrics.netProfit)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Margen: {formatPercentage(dashboardMetrics.profitMargin)}
              </div>
            </div>
            <div className={`p-3 rounded-full ${dashboardMetrics.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${dashboardMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Productos Más Vendidos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Productos Más Vendidos</h3>
          {topSellingProducts.length > 0 ? (
            <div className="space-y-3">
              {topSellingProducts.map((product: any, index: number) => (
                <div key={product.productId} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{product.quantity} unidades</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de ventas para este mes</p>
          )}
        </div>

        {/* Top Productos Más Rentables */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💎 Top Productos Más Rentables</h3>
          {topProfitableProducts && topProfitableProducts.length > 0 ? (
            <div className="space-y-3">
              {topProfitableProducts.map((product: any, index: number) => (
                <div key={product.productId} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(product.profitAmount)}</p>
                    <p className="text-xs text-gray-500">{formatPercentage(product.profitPercentage)} margen</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay productos registrados</p>
          )}
        </div>

        {/* Ventas por Canal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Ventas por Canal</h3>
          {salesByChannel.length > 0 ? (
            <div className="space-y-3">
              {salesByChannel.map((channel: any) => (
                <div key={channel.channel} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{channel.channel}</p>
                    <p className="text-xs text-gray-500">{channel.count} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(channel.amount)}</p>
                    <p className="text-xs text-gray-500">{formatPercentage(channel.percentage)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de ventas para este mes</p>
          )}
        </div>
      </div>

      {/* Estado del Inventario */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📦 Estado del Inventario</h3>
          <button
            onClick={() => navigate('/productos')}
            className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
          >
            VER MÁS →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{inventoryStatus.totalProducts}</p>
            <p className="text-sm text-gray-500">Total Productos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(inventoryStatus.totalInventoryValue)}</p>
            <p className="text-sm text-gray-500">Valor Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-yellow-600">{inventoryStatus.lowStockCount}</p>
            <p className="text-sm text-gray-500">Stock Bajo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600">{inventoryStatus.outOfStockCount}</p>
            <p className="text-sm text-gray-500">Sin Stock</p>
          </div>
        </div>
        
        {/* Productos con stock bajo */}
        {(inventoryStatus.lowStockProducts.length > 0 || inventoryStatus.outOfStockProducts.length > 0) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">Productos que requieren atención</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryStatus.lowStockProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-2">Stock Bajo (&lt; 10 unidades)</p>
                  <div className="space-y-1">
                    {inventoryStatus.lowStockProducts.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span className="text-gray-900">{product.name}</span>
                        <span className="text-yellow-600 font-medium">{product.stock} unidades</span>
                      </div>
                    ))}
                    {inventoryStatus.lowStockProducts.length > 5 && (
                      <div className="text-xs text-gray-500 mt-2">
                        ... y {inventoryStatus.lowStockProducts.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {inventoryStatus.outOfStockProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2">Sin Stock</p>
                  <div className="space-y-1">
                    {inventoryStatus.outOfStockProducts.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="flex justify-between text-sm">
                        <span className="text-gray-900">{product.name}</span>
                        <span className="text-red-600 font-medium">0 unidades</span>
                      </div>
                    ))}
                    {inventoryStatus.outOfStockProducts.length > 5 && (
                      <div className="text-xs text-gray-500 mt-2">
                        ... y {inventoryStatus.outOfStockProducts.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
