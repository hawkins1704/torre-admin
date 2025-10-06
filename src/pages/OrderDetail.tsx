import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import OrderForm from '../components/OrderForm';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const orderId = id as Id<'orders'>;
  const order = useQuery(api.orders.getById, { id: orderId });
  const removeOrder = useMutation(api.orders.remove);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
  };

  const handleFormCancel = () => {
    setShowEditForm(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await removeOrder({ id: orderId });
      navigate('/ordenes');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar la orden. Por favor intenta de nuevo.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (showEditForm) {
    return (
      <div>
        <div className="mb-8">
          <button
            onClick={handleFormCancel}
            className="text-green-600 hover:text-green-700 font-medium mb-4"
          >
            ← Volver
          </button>
        </div>
        <OrderForm 
          orderId={orderId} 
          onSuccess={handleFormSuccess} 
          onCancel={handleFormCancel} 
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">
          <p>Cargando orden...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/ordenes');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  

  if (!order) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="text-green-600 hover:text-green-700 font-medium mb-4"
          >
            ← Volver
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-gray-600">Detalle de la orden</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información principal */}
          <div className="space-y-6">
            {/* Información básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la Orden</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Orden</label>
                  <p className="text-lg font-medium text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Orden</label>
                  <p className="text-lg font-medium text-gray-900">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <p className="text-lg font-medium text-gray-900">{order.supplier}</p>
                </div>
               
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Productos</h2>
              <div className="space-y-4">
                {order.products.map((productOrder, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {productOrder.product?.name || 'Producto no encontrado'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Código: {productOrder.product?.code || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(productOrder.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {productOrder.quantity} × {formatCurrency(productOrder.unitPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Variaciones */}
                    {productOrder.variations && productOrder.variations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Variaciones:</h4>
                        <div className="space-y-1">
                          {productOrder.variations.map((variation, varIndex) => (
                            <div key={varIndex} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {variation.name}: {variation.value}
                              </span>
                              <span className="font-medium">
                                Cantidad: {variation.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Adicional</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Creada:</span>
                  <span className="ml-2 font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Última actualización:</span>
                  <span className="ml-2 font-medium">{formatDate(order.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total de productos:</span>
                  <span className="ml-2 font-medium">{order.products.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar orden</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar la orden "{order?.orderNumber}"? 
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
    </div>
  );
};

export default OrderDetail;
