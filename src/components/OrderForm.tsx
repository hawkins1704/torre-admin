import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import ProductSelector from './ProductSelector';
import { useCurrentStore } from '../hooks/useCurrentStore';

interface OrderFormProps {
  orderId?: Id<'orders'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface OrderProduct {
  productId: Id<'products'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variations?: Array<{
    name: string;
    value: string;
    quantity: number;
  }>;
}

interface OrderFormData {
  orderNumber: string;
  orderDate: number;
  supplier: string;
  products: OrderProduct[];
  totalAmount: number;
}

const OrderForm = ({ orderId, onSuccess, onCancel }: OrderFormProps) => {
  const [formData, setFormData] = useState<OrderFormData>({
    orderNumber: '',
    orderDate: Date.now(),
    supplier: '',
    products: [],
    totalAmount: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const currentStoreId = useCurrentStore();

  const productsData = useQuery(api.products.getAll, {
    storeId: currentStoreId || undefined,
  });
  const products = productsData?.products;
  const suppliers = useQuery(api.suppliers.getAll, { 
    limit: 100,
    storeId: currentStoreId || undefined,
  });
  const order = useQuery(api.orders.getById, orderId ? { id: orderId } : 'skip');
  const createOrder = useMutation(api.orders.create);
  const updateOrder = useMutation(api.orders.update);
  const generateOrderNumber = useMutation(api.orders.generateOrderNumber);

  // Cargar datos de la orden si está editando
  useEffect(() => {
    if (order) {
      setFormData({
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        supplier: order.supplier,
        products: order.products.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          totalPrice: p.totalPrice,
          variations: p.variations,
        })),
        totalAmount: order.totalAmount,
      });
    } else if (!orderId) {
      // Generar número de orden automático para nuevas órdenes
      generateOrderNumber().then(number => {
        setFormData(prev => ({ ...prev, orderNumber: number }));
      });
    }
  }, [order, orderId, generateOrderNumber]);

  // Calcular total automáticamente
  useEffect(() => {
    const total = formData.products.reduce((sum, product) => sum + product.totalPrice, 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.products]);

  const handleInputChange = (field: keyof OrderFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        productId: '' as Id<'products'>,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        variations: [],
      }],
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const updateProduct = (index: number, field: keyof OrderProduct, value: string | number | Array<{name: string, value: string, quantity: number}>) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => {
        if (i === index) {
          const updatedProduct = { ...product, [field]: value };
          
          // Si cambió el producto, resetear variaciones y recalcular precios
          if (field === 'productId') {
            const selectedProduct = products?.find(p => p._id === value);
            updatedProduct.unitPrice = selectedProduct?.cost || 0;
            updatedProduct.variations = [];
          }
          
          // Recalcular total del producto
          updatedProduct.totalPrice = updatedProduct.quantity * updatedProduct.unitPrice;
          
          return updatedProduct;
        }
        return product;
      }),
    }));
  };

  const addVariation = (productIndex: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => {
        if (i === productIndex) {
          const updatedProduct = {
            ...product,
            variations: [...(product.variations || []), { name: '', value: '', quantity: 1 }]
          };
          
          // Recalcular la cantidad total del producto solo si hay variaciones
          if (updatedProduct.variations && updatedProduct.variations.length > 0) {
            const totalVariationQuantity = updatedProduct.variations.reduce((sum, variation) => 
              sum + (variation.quantity || 0), 0
            );
            updatedProduct.quantity = totalVariationQuantity;
          }
          
          // Recalcular el total del producto
          updatedProduct.totalPrice = updatedProduct.quantity * updatedProduct.unitPrice;
          
          return updatedProduct;
        }
        return product;
      }),
    }));
  };

  const removeVariation = (productIndex: number, variationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => {
        if (i === productIndex) {
          const updatedProduct = {
            ...product,
            variations: product.variations?.filter((_, j) => j !== variationIndex) || []
          };
          
          // Recalcular la cantidad total del producto solo si hay variaciones
          if (updatedProduct.variations && updatedProduct.variations.length > 0) {
            const totalVariationQuantity = updatedProduct.variations.reduce((sum, variation) => 
              sum + (variation.quantity || 0), 0
            );
            updatedProduct.quantity = totalVariationQuantity;
          }
          
          // Recalcular el total del producto
          updatedProduct.totalPrice = updatedProduct.quantity * updatedProduct.unitPrice;
          
          return updatedProduct;
        }
        return product;
      }),
    }));
  };

  const updateVariation = (productIndex: number, variationIndex: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => {
        if (i === productIndex) {
          const updatedProduct = {
            ...product,
            variations: product.variations?.map((variation, j) => 
              j === variationIndex ? { ...variation, [field]: value } : variation
            ) || []
          };
          
          // Si cambió la cantidad de una variación, recalcular la cantidad total del producto
          if (field === 'quantity' && updatedProduct.variations && updatedProduct.variations.length > 0) {
            const totalVariationQuantity = updatedProduct.variations.reduce((sum, variation) => 
              sum + (variation.quantity || 0), 0
            );
            updatedProduct.quantity = totalVariationQuantity;
          }
          
          // Recalcular el total del producto
          updatedProduct.totalPrice = updatedProduct.quantity * updatedProduct.unitPrice;
          
          return updatedProduct;
        }
        return product;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    try {
      const orderData = {
        orderNumber: formData.orderNumber,
        orderDate: formData.orderDate,
        supplier: formData.supplier,
        products: formData.products,
        totalAmount: formData.totalAmount,
        storeId: currentStoreId || undefined,
      };

      if (orderId) {
        await updateOrder({
          id: orderId,
          ...orderData,
        });
      } else {
        await createOrder(orderData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error al guardar la orden. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
     
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {orderId ? 'Editar Orden' : 'Crear Orden'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Orden *
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Orden *
              </label>
              <input
                type="date"
                value={formatDate(formData.orderDate)}
                onChange={(e) => handleInputChange('orderDate', new Date(e.target.value).getTime())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier._id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Productos */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Productos</h3>
            </div>

            {formData.products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No hay productos agregados</p>
                <p className="text-sm">Agrega productos a esta orden</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.products.map((product, productIndex) => (
                  <div key={productIndex} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Producto *
                        </label>
                        <ProductSelector
                          products={products}
                          selectedProductId={product.productId}
                          onSelect={(productId) =>
                            updateProduct(productIndex, 'productId', productId)
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(productIndex, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                            product.variations && product.variations.length > 0
                              ? 'bg-gray-100 cursor-not-allowed' 
                              : ''
                          }`}
                          disabled={product.variations && product.variations.length > 0}
                          required
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeProduct(productIndex)}
                          className="w-full px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Información del producto seleccionado */}
                    {product.productId && (
                      <div className="mb-4 p-3 bg-white rounded shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Costo unitario:</span>
                            <span className="ml-2 font-medium">{formatCurrency(product.unitPrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-medium">{formatCurrency(product.totalPrice)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Producto:</span>
                            <span className="ml-2 font-medium">
                              {products?.find(p => p._id === product.productId)?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Variaciones del producto */}
                    {product.productId && products?.find(p => p._id === product.productId)?.variations && (products?.find(p => p._id === product.productId)?.variations?.length || 0) > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Variaciones</h4>
                          <button
                            type="button"
                            onClick={() => addVariation(productIndex)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Agregar Variación
                          </button>
                        </div>

                        {product.variations && product.variations.length > 0 && (
                          <div className="space-y-3">
                            {product.variations.map((variation, variationIndex) => (
                              <div key={variationIndex} className="p-3 bg-white rounded shadow-sm">
                                {/* Mobile layout */}
                                <div className="block md:hidden space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Variación {variationIndex + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeVariation(productIndex, variationIndex)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de variación</label>
                                    <select
                                      value={variation.name}
                                      onChange={(e) => updateVariation(productIndex, variationIndex, 'name', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                    >
                                      <option value="">Seleccionar variación</option>
                                      {products?.find(p => p._id === product.productId)?.variations?.map(v => (
                                        <option key={v.name} value={v.name}>{v.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                                    <select
                                      value={variation.value}
                                      onChange={(e) => updateVariation(productIndex, variationIndex, 'value', e.target.value)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                    >
                                      <option value="">Seleccionar valor</option>
                                      {variation.name && products?.find(p => p._id === product.productId)?.variations
                                        ?.find(v => v.name === variation.name)?.values.map(val => (
                                        <option key={val} value={val}>{val}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={variation.quantity}
                                      onChange={(e) => updateVariation(productIndex, variationIndex, 'quantity', parseInt(e.target.value) || 1)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      placeholder="Cantidad"
                                    />
                                  </div>
                                </div>

                                {/* Desktop layout */}
                                <div className="hidden md:flex items-center space-x-2">
                                  <select
                                    value={variation.name}
                                    onChange={(e) => updateVariation(productIndex, variationIndex, 'name', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">Seleccionar variación</option>
                                    {products?.find(p => p._id === product.productId)?.variations?.map(v => (
                                      <option key={v.name} value={v.name}>{v.name}</option>
                                    ))}
                                  </select>

                                  <select
                                    value={variation.value}
                                    onChange={(e) => updateVariation(productIndex, variationIndex, 'value', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">Seleccionar valor</option>
                                    {variation.name && products?.find(p => p._id === product.productId)?.variations
                                      ?.find(v => v.name === variation.name)?.values.map(val => (
                                      <option key={val} value={val}>{val}</option>
                                    ))}
                                  </select>

                                  <input
                                    type="number"
                                    min="1"
                                    value={variation.quantity}
                                    onChange={(e) => updateVariation(productIndex, variationIndex, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                    placeholder="Cant."
                                  />

                                  <button
                                    type="button"
                                    onClick={() => removeVariation(productIndex, variationIndex)}
                                    className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botón Agregar Producto - Siempre visible debajo de la lista */}
            <div className="mt-4">
              <button
                type="button"
                onClick={addProduct}
                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Producto</span>
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total de la Orden:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(formData.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>
                {isSaving ? 'Guardando...' : (orderId ? 'Actualizar Orden' : 'Crear Orden')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
