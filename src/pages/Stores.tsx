import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import StoreForm from '../components/StoreForm';
import type { Id } from '../../convex/_generated/dataModel';

const STORE_KEY = 'currentStoreId';

const Stores = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<Id<'stores'> | null>(null);

  const stores = useQuery(api.stores.getAll, { limit: 100 });
  const currentStore = useQuery(
    api.stores.getById,
    currentStoreId ? { id: currentStoreId } : 'skip'
  );

  // Cargar tienda actual desde localStorage al montar
  useEffect(() => {
    const savedStoreId = localStorage.getItem(STORE_KEY);
    if (savedStoreId) {
      try {
        setCurrentStoreId(savedStoreId as Id<'stores'>);
      } catch (error) {
        console.error('Error loading current store:', error);
      }
    }
  }, []);

  // Guardar tienda actual en localStorage cuando cambie
  useEffect(() => {
    if (currentStoreId) {
      localStorage.setItem(STORE_KEY, currentStoreId);
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  }, [currentStoreId]);

  // Filtrar tiendas por término de búsqueda
  const filteredStores = stores?.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleCreateStore = () => {
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
  };


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showCreateForm) {
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
        <StoreForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tiendas</h1>
            <p className="text-gray-600">Gestiona tus tiendas y selecciona la tienda actual</p>
          </div>
          <button
            onClick={handleCreateStore}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Tienda
          </button>
        </div>

        {/* Tienda actual */}
        {currentStore && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Tienda actual</p>
                <p className="text-lg font-semibold text-green-900">{currentStore.name}</p>
                {currentStore.description && (
                  <p className="text-sm text-green-700 mt-1">{currentStore.description}</p>
                )}
              </div>
              <button
                onClick={() => setCurrentStoreId(null)}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Cambiar
              </button>
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar tiendas
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busca por nombre o descripción de la tienda..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Lista de tiendas */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredStores && filteredStores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStores.map((store) => (
                    <tr 
                      key={store._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/tiendas/${store._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {store.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {store.description || 'Sin descripción'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(store.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm ? (
                  <>
                    <p className="text-lg font-medium mb-2">No se encontraron tiendas</p>
                    <p className="text-sm">Intenta ajustar el término de búsqueda</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No hay tiendas registradas</p>
                    <p className="text-sm">Crea tu primera tienda para comenzar</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stores;

