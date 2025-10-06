import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CategoryForm from '../components/CategoryForm';

const Categorias = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const categories = useQuery(api.categories.getAll, { limit: 100 });

  // Filtrar categorías por término de búsqueda
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleCreateCategory = () => {
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
        <CategoryForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Categorías</h1>
            <p className="text-gray-600">Gestiona las categorías de tus productos</p>
          </div>
          <button
            onClick={handleCreateCategory}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Categoría
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar categorías
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busca por nombre o descripción de la categoría..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredCategories && filteredCategories.length > 0 ? (
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
                  {filteredCategories.map((category) => (
                    <tr 
                      key={category._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/categorias/${category._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {category.description || 'Sin descripción'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(category.createdAt)}
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
                    <p className="text-lg font-medium mb-2">No se encontraron categorías</p>
                    <p className="text-sm">Intenta ajustar el término de búsqueda</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No hay categorías registradas</p>
                    <p className="text-sm">Crea tu primera categoría para comenzar</p>
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

export default Categorias;