import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface CategoryFormProps {
  categoryId?: Id<'categories'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
}

const CategoryForm = ({ categoryId, onSuccess, onCancel }: CategoryFormProps) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  });

  const category = useQuery(api.categories.getById, categoryId ? { id: categoryId } : 'skip');
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);

  // Cargar datos de la categoría si está editando
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    }
  }, [category]);

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (categoryId) {
        await updateCategory({
          id: categoryId,
          name: formData.name,
          description: formData.description || undefined,
        });
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description || undefined,
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {categoryId ? 'Editar Categoría' : 'Crear Categoría'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Ropa de bebé, Juguetes, Accesorios"
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
                placeholder="Descripción opcional de la categoría..."
                rows={4}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
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
              {categoryId ? 'Actualizar Categoría' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
