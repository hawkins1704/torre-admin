import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import StoreForm from '../components/StoreForm';

const STORE_KEY = 'currentStoreId';

const StoreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const storeId = id as Id<'stores'>;
  const store = useQuery(api.stores.getById, { id: storeId });
  const deleteStore = useMutation(api.stores.remove);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleSelectAsCurrent = () => {
    localStorage.setItem(STORE_KEY, storeId);
    // Recargar la página para que se actualice el estado
    window.location.reload();
  };

  const confirmDelete = async () => {
    try {
      await deleteStore({ id: storeId });
      // Si la tienda eliminada era la actual, limpiar localStorage
      const currentStoreId = localStorage.getItem(STORE_KEY);
      if (currentStoreId === storeId) {
        localStorage.removeItem(STORE_KEY);
      }
      navigate('/tiendas');
    } catch (error) {
      console.error('Error deleting store:', error);
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
        <StoreForm 
          storeId={storeId} 
          onSuccess={handleFormSuccess} 
          onCancel={handleFormCancel} 
        />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">
          <p>Cargando tienda...</p>
        </div>
      </div>
    );
  }

  const isCurrentStore = localStorage.getItem(STORE_KEY) === storeId;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/tiendas')}
          className="text-green-600 hover:text-green-700 font-medium mb-4"
        >
          ← Volver
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
            {store.description && (
              <p className="text-gray-600 text-lg">{store.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Creada el {formatDate(store.createdAt)}
            </p>
            {isCurrentStore && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">
                Tienda Actual
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {!isCurrentStore && (
              <button
                onClick={handleSelectAsCurrent}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Seleccionar como Actual
              </button>
            )}
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

      {/* Información de la tienda */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Tienda</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Nombre</p>
            <p className="text-base text-gray-900 mt-1">{store.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Descripción</p>
            <p className="text-base text-gray-900 mt-1">
              {store.description || 'Sin descripción'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Fecha de Creación</p>
            <p className="text-base text-gray-900 mt-1">{formatDate(store.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Última Actualización</p>
            <p className="text-base text-gray-900 mt-1">{formatDate(store.updatedAt)}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar tienda</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar la tienda "{store.name}"? 
                  Esta acción no se puede deshacer.
                </p>
                {isCurrentStore && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Esta tienda está actualmente seleccionada como tu tienda actual.
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

export default StoreDetail;

