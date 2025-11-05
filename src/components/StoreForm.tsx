import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface StoreFormProps {
  storeId?: Id<'stores'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface StoreFormData {
  name: string;
  description: string;
}

const StoreForm = ({ storeId, onSuccess, onCancel }: StoreFormProps) => {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
  });

  const store = useQuery(api.stores.getById, storeId ? { id: storeId } : 'skip');
  const createStore = useMutation(api.stores.create);
  const updateStore = useMutation(api.stores.update);

  // Cargar datos de la tienda si está editando
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        description: store.description || '',
      });
    }
  }, [store]);

  const handleInputChange = (field: keyof StoreFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (storeId) {
        await updateStore({
          id: storeId,
          name: formData.name,
          description: formData.description || undefined,
        });
      } else {
        await createStore({
          name: formData.name,
          description: formData.description || undefined,
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {storeId ? 'Editar Tienda' : 'Crear Tienda'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la tienda *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Tienda Principal, Sucursal Centro, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Descripción opcional de la tienda..."
                rows={4}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 ">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              {storeId ? 'Actualizar Tienda' : 'Crear Tienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreForm;

