import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface SupplierFormProps {
  supplierId?: Id<'suppliers'>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SupplierFormData {
  name: string;
  number: string;
}

const SupplierForm = ({ supplierId, onSuccess, onCancel }: SupplierFormProps) => {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    number: '',
  });

  const supplier = useQuery(api.suppliers.getById, supplierId ? { id: supplierId } : 'skip');
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);

  // Cargar datos del proveedor si está editando
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        number: supplier.number,
      });
    }
  }, [supplier]);

  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (supplierId) {
        await updateSupplier({
          id: supplierId,
          name: formData.name,
          number: formData.number,
        });
      } else {
        await createSupplier({
          name: formData.name,
          number: formData.number,
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {supplierId ? 'Editar Proveedor' : 'Crear Proveedor'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del proveedor *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Distribuidora ABC, Importadora XYZ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: +51 999 999 999, 01-234-5678"
                required
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
              {supplierId ? 'Actualizar Proveedor' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
