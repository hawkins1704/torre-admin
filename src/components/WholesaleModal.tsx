import { useState, useEffect } from 'react';


interface Product {
  _id: string;
  code: string;
  name: string;
  cost: number;
  packaging: number;
  profitPercentage: number;
  gatewayCommission: number;
  igv: number;
  finalPrice: number;
  finalPriceWithoutGateway: number;
}

interface WholesaleModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface WholesaleData {
  packaging: number;
  profitPercentage: number;
  quantity: number;
}

interface RecommendedProfit {
  percentage: number;
  reason: string;
  description: string;
}

const WholesaleModal = ({ product, isOpen, onClose }: WholesaleModalProps) => {
  const [wholesaleData, setWholesaleData] = useState<WholesaleData>({
    packaging: product?.packaging || 0,
    profitPercentage: product?.profitPercentage || 0,
    quantity: 1,
  });

  const [calculations, setCalculations] = useState({
    totalCost: 0,
    profitAmount: 0,
    desiredNetIncome: 0,
    priceWithoutIgv: 0,
    priceWithIgv: 0,
    finalPrice: 0,
    totalProfit: 0,
    totalRevenue: 0,
    profitMargin: 0,
  });

  const [recommendedProfit, setRecommendedProfit] = useState<RecommendedProfit | null>(null);

  // Función para calcular ganancia recomendada basada en volumen
  const calculateRecommendedProfit = (product: Product, quantity: number): RecommendedProfit => {
    // Estrategia por volumen (descuento por cantidad)
    let volumeBasedProfit = product.profitPercentage;
    let discountPercentage = 0;
    
    if (quantity >= 100) {
      volumeBasedProfit = product.profitPercentage * 0.6; // 40% descuento
      discountPercentage = 40;
    } else if (quantity >= 50) {
      volumeBasedProfit = product.profitPercentage * 0.7; // 30% descuento
      discountPercentage = 30;
    } else if (quantity >= 20) {
      volumeBasedProfit = product.profitPercentage * 0.8; // 20% descuento
      discountPercentage = 20;
    } else if (quantity >= 10) {
      volumeBasedProfit = product.profitPercentage * 0.9; // 10% descuento
      discountPercentage = 10;
    }

    return {
      percentage: Math.round(volumeBasedProfit * 10) / 10, // Redondear a 1 decimal
      reason: "Por Volumen",
      description: discountPercentage > 0 
        ? `Descuento del ${discountPercentage}% por compra de ${quantity} unidades`
        : `Sin descuento por volumen (menos de 10 unidades)`
    };
  };

  // Cargar datos iniciales del producto
  useEffect(() => {
    if (product) {
      setWholesaleData({
        packaging: product.packaging,
        profitPercentage: product.profitPercentage,
        quantity: 1,
      });
    }
  }, [product]);

  // Calcular valores automáticamente
  useEffect(() => {
    if (!product) return;

    const { cost, igv } = product;
    const { packaging, profitPercentage, quantity } = wholesaleData;
    
    // Costo total con packaging modificado
    const totalCost = cost + packaging;
    const profitAmount = totalCost * (profitPercentage / 100);
    const desiredNetIncome = totalCost + profitAmount;
    
    // Precio sin pasarela (comisión = 0%)
    const priceWithoutIgv = desiredNetIncome; // Sin división por comisión
    const priceWithIgv = priceWithoutIgv + igv;
    const finalPrice = Math.ceil(priceWithIgv);
    
    // Cálculos por cantidad
    const totalRevenue = finalPrice * quantity;
    const totalCostForQuantity = totalCost * quantity;
    const totalProfit = totalRevenue - totalCostForQuantity;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    setCalculations({
      totalCost,
      profitAmount,
      desiredNetIncome,
      priceWithoutIgv,
      priceWithIgv,
      finalPrice,
      totalProfit,
      totalRevenue,
      profitMargin,
    });

    // Calcular ganancia recomendada
    const recommendation = calculateRecommendedProfit(product, quantity);
    setRecommendedProfit(recommendation);
  }, [wholesaleData, product]);

  // Función helper para manejar inputs numéricos
  const handleNumericInputChange = (field: keyof WholesaleData, value: string) => {
    // Si el campo está vacío, establecer como 0
    if (value === '' || value === '-') {
      setWholesaleData(prev => ({
        ...prev,
        [field]: 0,
      }));
      return;
    }

    // Convertir a número y validar
    const numericValue = parseFloat(value);
    
    // Si no es un número válido, mantener el valor anterior
    if (isNaN(numericValue)) {
      return;
    }

    // Prevenir valores negativos
    const finalValue = Math.max(0, numericValue);

    setWholesaleData(prev => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Función específica para cantidad (solo enteros positivos)
  const handleQuantityInputChange = (value: string) => {
    // Si el campo está vacío, establecer como 1
    if (value === '' || value === '-') {
      setWholesaleData(prev => ({
        ...prev,
        quantity: 1,
      }));
      return;
    }

    // Convertir a entero y validar
    const intValue = parseInt(value);
    
    // Si no es un número válido, mantener el valor anterior
    if (isNaN(intValue)) {
      return;
    }

    // Prevenir valores negativos o cero
    const finalValue = Math.max(1, intValue);

    setWholesaleData(prev => ({
      ...prev,
      quantity: finalValue,
    }));
  };

  const applyRecommendedProfit = () => {
    if (recommendedProfit) {
      setWholesaleData(prev => ({
        ...prev,
        profitPercentage: recommendedProfit.percentage,
      }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Simulación X MAYOR - {product.name}
            </h2>
            <p className="text-gray-600">Código: {product.code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Campos editables */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Parámetros de Simulación</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Packaging (modificable)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={wholesaleData.packaging}
                      onChange={(e) => handleNumericInputChange('packaging', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Original: {formatCurrency(product.packaging)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ganancia % (modificable)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={wholesaleData.profitPercentage}
                      onChange={(e) => handleNumericInputChange('profitPercentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Original: {product.profitPercentage.toFixed(1)}%
                    </p>
                    
                    {/* Recomendación de ganancia */}
                    {recommendedProfit && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-blue-900">
                                💡 Recomendado: {recommendedProfit.percentage}%
                              </span>
                              <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                {recommendedProfit.reason}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 mb-2">
                              {recommendedProfit.description}
                            </p>
                          </div>
                          <button
                            onClick={applyRecommendedProfit}
                            className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad de unidades *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={wholesaleData.quantity}
                      onChange={(e) => handleQuantityInputChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Valores fijos */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Valores Fijos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo del producto:</span>
                    <span className="text-sm font-medium">{formatCurrency(product.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IGV:</span>
                    <span className="text-sm font-medium">{formatCurrency(product.igv)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cálculos */}
            <div className="space-y-6">
              {/* Cálculos por unidad */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cálculos por Unidad</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo total:</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ganancia por unidad:</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.profitAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio sin IGV:</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.priceWithoutIgv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio con IGV:</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.priceWithIgv)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Precio final:</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrency(calculations.finalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análisis de la venta */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis de la Venta</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingresos totales:</span>
                    <span className="text-lg font-semibold text-slate-600">{formatCurrency(calculations.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ganancia total:</span>
                    <span className="text-lg font-semibold text-emerald-600">{formatCurrency(calculations.totalProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">Margen de ganancia:</span>
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v1a1 1 0 001 1h1a1 1 0 100-2h-1a1.001 1.001 0 01-.968-1.243A1 1 0 0110 10a1 1 0 100-2 1 1 0 000-2z" clipRule="evenodd" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Porcentaje de ganancia sobre el precio de venta total
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-purple-600">{calculations.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ganancia promedio por unidad:</span>
                      <span className="text-sm font-medium">{formatCurrency(calculations.profitAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparación con precio original */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Comparación</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio original (sin pasarela):</span>
                    <span className="text-sm font-medium">{formatCurrency(product.finalPriceWithoutGateway)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio X MAYOR:</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Diferencia:</span>
                    <span className={`text-sm font-medium ${calculations.finalPrice - product.finalPriceWithoutGateway >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {calculations.finalPrice - product.finalPriceWithoutGateway >= 0 ? '+' : ''}{formatCurrency(calculations.finalPrice - product.finalPriceWithoutGateway)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                // TODO: Implementar funcionalidad de crear orden/venta
                console.log('Crear orden X MAYOR con:', {
                  productId: product._id,
                  quantity: wholesaleData.quantity,
                  unitPrice: calculations.finalPrice,
                  totalAmount: calculations.totalRevenue,
                });
              }}
              className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              Crear Orden X MAYOR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleModal;
