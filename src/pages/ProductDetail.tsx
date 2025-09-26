import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import ProductForm from '../components/ProductForm';
import WholesaleModal from '../components/WholesaleModal';
import ProductImage from '../components/ProductImage';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const product = useQuery(api.products.getById, id ? { id: id as Id<'products'> } : 'skip');
  const deleteProduct = useMutation(api.products.remove);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (id) {
      try {
        await deleteProduct({ id: id as Id<'products'> });
        navigate('/productos');
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando producto...</div>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div>
        <div className="mb-8">
          <button
            onClick={handleEditCancel}
            className="text-green-600 hover:text-green-700 font-medium mb-4"
          >
            ← Volver
          </button>
        </div>
        <ProductForm 
          productId={id as Id<'products'>} 
          onSuccess={handleEditSuccess} 
          onCancel={handleEditCancel} 
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header con botones */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => navigate('/productos')}
              className="text-green-600 hover:text-green-700 font-medium mb-4"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-gray-600">Detalle del producto</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowWholesaleModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              X MAYOR
            </button>
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              Editar
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Primera fila: Imagen e Información básica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Imagen del producto */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Producto</h2>
            <div className="flex justify-center">
              {product.imageId ? (
                <div 
                  onClick={() => setShowImageModal(true)}
                  className="cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <ProductImage 
                    imageId={product.imageId} 
                    className="w-full max-w-sm h-64 object-cover rounded-lg shadow-lg border border-gray-200"
                    alt={product.name}
                  />
                </div>
              ) : (
                <div className="w-full max-w-sm h-64 bg-gray-100 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Sin imagen</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información básica */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <p className="text-gray-900">{product.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <p className="text-gray-900">{product.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <p className="text-gray-900">{product.age}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {product.category?.name || 'Sin categoría'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    product.stock === 0 
                      ? 'bg-red-100 text-red-800' 
                      : product.stock < 10 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.stock} unidades
                  </span>
                  {product.stock === 0 && (
                    <span className="text-xs text-red-600 font-medium">Sin stock</span>
                  )}
                  {product.stock > 0 && product.stock < 10 && (
                    <span className="text-xs text-yellow-600 font-medium">Stock bajo</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Stock por Variaciones (si aplica) */}
      {product.variations && product.variations.length > 0 && product.stockByVariation && (
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock por Variaciones</h2>
            <div className="space-y-4">
              {product.variations.map((variation) => (
                <div key={variation.name}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{variation.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {variation.values.map((value) => {
                      const stock = product.stockByVariation?.[variation.name]?.[value] || 0;
                      return (
                        <span
                          key={value}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            stock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : stock < 5 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {value}: {stock}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Segunda fila: Costos, Porcentajes y Precios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Costos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Costos</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo del producto</label>
              <p className="text-gray-900">{formatCurrency(product.cost)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Packaging</label>
              <p className="text-gray-900">{formatCurrency(product.packaging)}</p>
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total</label>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(product.totalCost)}</p>
            </div>
          </div>
        </div>

        {/* Porcentajes y comisiones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Porcentajes y Comisiones</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia (%)</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.profitPercentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comisión pasarela (%)</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {product.gatewayCommission.toFixed(1)}%
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IGV</label>
              <p className="text-gray-900">{formatCurrency(product.igv)}</p>
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ganancia en soles</label>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(product.profitAmount)}</p>
            </div>
          </div>
        </div>

        {/* Precios calculados */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios Calculados</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingreso neto deseado</label>
              <p className="text-gray-900">{formatCurrency(product.desiredNetIncome)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio sin IGV</label>
              <p className="text-gray-900">{formatCurrency(product.priceWithoutIgv)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio con IGV</label>
              <p className="text-gray-900">{formatCurrency(product.priceWithIgv)}</p>
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">PRECIO FINAL</label>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(product.finalPrice)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Sin Pasarela</label>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(product.finalPriceWithoutGateway)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de imagen en tamaño completo */}
      {showImageModal && product.imageId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
            >
              ×
            </button>
            <ProductImage 
              imageId={product.imageId} 
              className="max-w-full max-h-full object-contain rounded-lg"
              alt={product.name}
            />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm opacity-75">{product.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar el producto "{product.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar producto</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar el producto "{product?.name}"? 
                  Esta acción no se puede deshacer.
                </p>
            
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal X MAYOR */}
      <WholesaleModal
        product={product}
        isOpen={showWholesaleModal}
        onClose={() => setShowWholesaleModal(false)}
      />
    </div>
  );
};

export default ProductDetail;
