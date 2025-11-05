/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import ImageUpload from './ImageUpload';
import { useCurrentStore } from '../hooks/useCurrentStore';

interface ProductFormProps {
  productId?: Id<'products'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ProductVariation {
  name: string;
  values: string[];
}

interface ProductFormData {
  code: string;
  name: string;
  age: string;
  categoryId: string;
  cost: number;
  packaging: number;
  advertisingPercentage: number;
  profitPercentage: number;
  gatewayCommission: number;
  igvPercentage: number;
  imageId?: Id<'_storage'>;
  variations: ProductVariation[];
  stock: number;
  stockByVariation: any;
}


const ProductForm = ({ productId, onSuccess, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    age: '',
    categoryId: '',
    cost: 0,
    packaging: 2.40,
    advertisingPercentage: 0,
    profitPercentage: 0,
    gatewayCommission: 7.50,
    igvPercentage: 18,
    variations: [],
    stock: 0,
    stockByVariation: {},
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [calculations, setCalculations] = useState({
    totalCost: 0,
    advertisingAmount: 0,
    profitAmount: 0,
    desiredNetIncome: 0,
    priceWithoutIgv: 0,
    priceWithIgv: 0,
    finalPrice: 0,
    priceWithoutGateway: 0,
  });

  const currentStoreId = useCurrentStore();

  const categories = useQuery(api.categories.getAll, {
    storeId: currentStoreId || undefined,
  });
  const product = useQuery(api.products.getById, productId ? { id: productId } : 'skip');
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  // Cargar datos del producto si está editando
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        age: product.age,
        categoryId: product.categoryId,
        cost: product.cost,
        packaging: product.packaging,
        advertisingPercentage: product.advertisingPercentage || 0,
        profitPercentage: product.profitPercentage,
        gatewayCommission: product.gatewayCommission,
        igvPercentage: product.igvPercentage ?? 0,
        imageId: product.imageId,
        variations: product.variations || [],
        stock: product.stock || 0,
        stockByVariation: product.stockByVariation || {},
      });
    }
  }, [product]);

  // Calcular valores automáticamente
  useEffect(() => {
    const { cost, packaging, advertisingPercentage, profitPercentage, gatewayCommission, igvPercentage } = formData;
    
    const baseCost = cost + packaging;
    const advertisingAmount = baseCost * (advertisingPercentage / 100);
    const totalCost = baseCost + advertisingAmount;
    const profitAmount = totalCost * (profitPercentage / 100);
    const desiredNetIncome = totalCost + profitAmount;
    
    // Precio con pasarela
    const priceWithoutIgv = gatewayCommission > 0 ? desiredNetIncome / (1 - gatewayCommission / 100) : desiredNetIncome;
    const igvAmount = priceWithoutIgv * (igvPercentage / 100);
    const priceWithIgv = priceWithoutIgv + igvAmount;
    const finalPrice = Math.ceil(priceWithIgv);
    
    // Precio sin pasarela
    const priceWithoutGateway = desiredNetIncome + igvAmount;
    
    setCalculations({
      totalCost,
      advertisingAmount,
      profitAmount,
      desiredNetIncome,
      priceWithoutIgv,
      priceWithIgv,
      finalPrice,
      priceWithoutGateway,
    });
  }, [formData]);

  // Calcular stock total automáticamente cuando cambien las variaciones
  useEffect(() => {
    // Si hay variaciones, calcular automáticamente el stock total
    if (formData.stockByVariation && Object.keys(formData.stockByVariation).length > 0) {
      let totalStock = 0;
      for (const variationName in formData.stockByVariation) {
        const variation = formData.stockByVariation[variationName];
        for (const value in variation) {
          totalStock += variation[value] || 0;
        }
      }
      setFormData(prev => ({
        ...prev,
        stock: totalStock,
      }));
    }
  }, [formData.stockByVariation]);

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función helper para manejar inputs numéricos
  const handleNumericInputChange = (field: keyof ProductFormData, value: string) => {
    // Si el campo está vacío, establecer como 0
    if (value === '' || value === '-') {
      setFormData(prev => ({
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

    setFormData(prev => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Función específica para manejar el cambio manual del stock
  const handleStockChange = (value: string) => {
    handleNumericInputChange('stock', value);
  };

  // Funciones para manejar variaciones
  const addVariation = () => {
    setFormData(prev => ({
      ...prev,
      variations: [...prev.variations, { name: '', values: [''] }],
    }));
  };

  const removeVariation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const updateVariationName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) => 
        i === index ? { ...variation, name } : variation
      ),
    }));
  };

  const addVariationValue = (variationIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) => 
        i === variationIndex 
          ? { ...variation, values: [...variation.values, ''] }
          : variation
      ),
    }));
  };

  const removeVariationValue = (variationIndex: number, valueIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) => 
        i === variationIndex 
          ? { 
              ...variation, 
              values: variation.values.filter((_, j) => j !== valueIndex) 
            }
          : variation
      ),
    }));
  };

  const updateVariationValue = (variationIndex: number, valueIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map((variation, i) => 
        i === variationIndex 
          ? { 
              ...variation, 
              values: variation.values.map((v, j) => j === valueIndex ? value : v)
            }
          : variation
      ),
    }));
  };


  const handleImageSelected = (file: File) => {
    setSelectedImageFile(file);
  };

  const handleImageRemoved = () => {
    setSelectedImageFile(null);
    setFormData(prev => ({
      ...prev,
      imageId: undefined,
    }));
  };

  // Función para subir imagen y obtener storageId
  const uploadImage = async (file: File): Promise<Id<'_storage'>> => {
    // Paso 1: Generar URL de upload
    const postUrl = await generateUploadUrl();
    
    // Paso 2: Subir archivo
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    
    const { storageId } = await result.json();
    return storageId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    try {
      let imageId = formData.imageId;

      // Si hay una imagen seleccionada, subirla primero
      if (selectedImageFile) {
        imageId = await uploadImage(selectedImageFile);
      }

      const productData = {
        ...formData,
        categoryId: formData.categoryId as Id<'categories'>,
        imageId: imageId,
        storeId: currentStoreId || undefined,
      };

      if (productId) {
        await updateProduct({
          id: productId,
          ...productData,
        });
      } else {
        await createProduct(productData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto. Por favor intenta de nuevo.');
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {productId ? 'Editar Producto' : 'Crear Producto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Producto *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad *
              </label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Imagen del producto */}
          <div className="border-t pt-6">
            <ImageUpload
              currentImageId={formData.imageId}
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
            />
          </div>

          {/* Variaciones del producto */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Variaciones del Producto</h3>
              <button
                type="button"
                onClick={addVariation}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Variación</span>
              </button>
            </div>

            {formData.variations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No hay variaciones agregadas</p>
                <p className="text-sm">Agrega variaciones como Color, Talla, Material, etc.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.variations.map((variation, variationIndex) => (
                  <div key={variationIndex} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 mr-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la variación
                        </label>
                        <input
                          type="text"
                          value={variation.name}
                          onChange={(e) => updateVariationName(variationIndex, e.target.value)}
                          placeholder="Ej: Color, Talla, Material"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariation(variationIndex)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar variación"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Valores de la variación
                        </label>
                        <button
                          type="button"
                          onClick={() => addVariationValue(variationIndex)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Agregar valor</span>
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {variation.values.map((value, valueIndex) => (
                          <div key={valueIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateVariationValue(variationIndex, valueIndex, e.target.value)}
                              placeholder={`Valor ${valueIndex + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariationValue(variationIndex, valueIndex)}
                              className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar valor"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Costos */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Costos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo del producto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleNumericInputChange('cost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Packaging *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.packaging}
                  onChange={(e) => handleNumericInputChange('packaging', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publicidad (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.advertisingPercentage}
                      onChange={(e) => handleNumericInputChange('advertisingPercentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publicidad (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={Number.isFinite(calculations.advertisingAmount) ? Number(calculations.advertisingAmount.toFixed(2)) : 0}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Porcentajes y comisiones */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Porcentajes y Comisiones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ganancia (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profitPercentage}
                  onChange={(e) => handleNumericInputChange('profitPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión pasarela (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gatewayCommission}
                  onChange={(e) => handleNumericInputChange('gatewayCommission', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IGV (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.igvPercentage}
                  onChange={(e) => handleNumericInputChange('igvPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cálculos automáticos */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cálculos Automáticos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo Total:</span>
                    <span className="font-medium">{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ganancia en soles:</span>
                    <span className="font-medium">{formatCurrency(calculations.profitAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingreso neto deseado:</span>
                    <span className="font-medium">{formatCurrency(calculations.desiredNetIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio sin IGV:</span>
                    <span className="font-medium">{formatCurrency(calculations.priceWithoutIgv)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio con IGV:</span>
                    <span className="font-medium">{formatCurrency(calculations.priceWithIgv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">PRECIO FINAL:</span>
                    <span className="font-bold text-emerald-600 text-lg">{formatCurrency(calculations.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Precio sin pasarela:</span>
                    <span className="font-medium">{formatCurrency(calculations.priceWithoutGateway)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Total
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleStockChange(e.target.value)}
                  disabled={formData.variations && formData.variations.length > 0}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    formData.variations && formData.variations.length > 0
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300'
                  }`}
                  placeholder="Cantidad en stock"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.variations && formData.variations.length > 0
                    ? 'Stock total se calcula automáticamente desde las variaciones'
                    : 'Stock total del producto (se actualiza automáticamente con órdenes y ventas)'
                  }
                </p>
              </div>
              
              {formData.variations && formData.variations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock por Variaciones
                  </label>
                  <div className="space-y-3">
                    {formData.variations.map((variation, variationIndex) => (
                      <div key={variationIndex} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{variation.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {variation.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600 w-16 truncate">{value}:</span>
                              <input
                                type="number"
                                min="0"
                                value={formData.stockByVariation?.[variation.name]?.[value] || 0}
                                onChange={(e) => {
                                  const newStockByVariation = { ...formData.stockByVariation };
                                  if (!newStockByVariation[variation.name]) {
                                    newStockByVariation[variation.name] = {};
                                  }
                                  newStockByVariation[variation.name][value] = parseInt(e.target.value) || 0;
                                  setFormData(prev => ({
                                    ...prev,
                                    stockByVariation: newStockByVariation,
                                  }));
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    El stock total se calcula automáticamente como la suma de todas las variaciones
                  </p>
                </div>
              )}
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
                {isSaving 
                  ? (selectedImageFile ? 'Subiendo imagen...' : 'Guardando...') 
                  : (productId ? 'Actualizar Producto' : 'Crear Producto')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
