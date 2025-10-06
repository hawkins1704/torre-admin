import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const FinancialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados del formulario de edición
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const transaction = useQuery(api.financial_transactions.getById, id ? { id: id as Id<'financial_transactions'> } : 'skip');
  const updateTransaction = useMutation(api.financial_transactions.update);
  const deleteTransaction = useMutation(api.financial_transactions.remove);

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

  const handleEdit = () => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    }
    setShowEditForm(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (id) {
      try {
        await deleteTransaction({ id: id as Id<'financial_transactions'> });
        navigate('/finanzas');
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      const transactionDate = new Date(formData.date).getTime();
      
      await updateTransaction({
        id: id as Id<'financial_transactions'>,
        type: formData.type,
        description: formData.description,
        amount: formData.amount,
        date: transactionDate,
      });
      
      setShowEditForm(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  if (!transaction) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando transacción...</div>
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
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Editar Transacción
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Transacción
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Publicidad en Facebook, Capital para compras, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Actualizar Transacción
              </button>
            </div>
          </form>
          </div>
        </div>
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
              onClick={() => navigate('/finanzas')}
              className="text-green-600 hover:text-green-700 font-medium mb-4"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {transaction.description}
            </h1>
            <p className="text-gray-600">Detalle de la transacción financiera</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
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

      {/* Información de la transacción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información básica */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Transacción</label>
              <p className="text-gray-900">{transaction.transactionNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                transaction.type === 'income' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <p className="text-gray-900">{transaction.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <p className="text-gray-900">{formatDate(transaction.date)}</p>
            </div>
          </div>
        </div>

        {/* Información financiera */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <p className={`text-2xl font-bold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
              <p className="text-gray-900">
                {transaction.type === 'income' ? 'Entrada de dinero' : 'Salida de dinero'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
              <p className="text-gray-900">{formatDate(transaction.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
              <p className="text-gray-900">{formatDate(transaction.updatedAt)}</p>
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Eliminar transacción</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar la transacción "{transaction.description}"? 
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

export default FinancialDetail;
