import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import SupplierForm from '../components/SupplierForm';

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supplierId = id as Id<'suppliers'>;
  const supplier = useQuery(api.suppliers.getById, { id: supplierId });
  const orders = useQuery(api.orders.getAll, { paginationOpts: { numItems: 100 } });
  const deleteSupplier = useMutation(api.suppliers.remove);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

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
      await deleteSupplier({ id: supplierId });
      navigate('/proveedores');
    } catch (error) {
      console.error('Error deleting supplier:', error);
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
        <SupplierForm 
          supplierId={supplierId} 
          onSuccess={handleFormSuccess} 
          onCancel={handleFormCancel} 
        />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">
          <p>Cargando proveedor...</p>
        </div>
      </div>
    );
  }

  // Filtrar órdenes de este proveedor
  const supplierOrders = orders?.orders?.filter(order => 
    order.supplier.toLowerCase() === supplier.name.toLowerCase()
  ) || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/proveedores')}
          className="text-green-600 hover:text-green-700 font-medium mb-4"
        >
          ← Volver
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{supplier.name}</h1>
            <p className="text-gray-600 text-lg">Número: {supplier.number}</p>
            <p className="text-sm text-gray-500 mt-2">
              Creado el {formatDate(supplier.createdAt)}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-gray-900">{supplierOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(supplierOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Orden</p>
              <p className="text-2xl font-bold text-gray-900">
                {supplierOrders.length > 0 
                  ? formatCurrency(supplierOrders.reduce((sum, order) => sum + order.totalAmount, 0) / supplierOrders.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Órdenes de este proveedor</h2>
        </div>
        
        {supplierOrders && supplierOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número de Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/ordenes/${order._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products.length} producto{order.products.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.products.map((p) => p.product?.name).filter(Boolean).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-emerald-500 hover:text-emerald-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ordenes/${order._id}`);
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">No hay órdenes de este proveedor</p>
              <p className="text-sm">Las órdenes que asignes a este proveedor aparecerán aquí</p>
            </div>
          </div>
        )}
      </div>

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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar proveedor</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar el proveedor "{supplier.name}"? 
                  Esta acción no se puede deshacer.
                </p>
                {supplierOrders && supplierOrders.length > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    Este proveedor tiene {supplierOrders.length} orden(es) asociada(s).
                  </p>
                )}
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

export default SupplierDetail;
