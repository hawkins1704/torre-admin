import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const Finanzas = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | ''>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{ _id: Id<'financial_transactions'>; type: 'income' | 'expense'; description: string; amount: number; date: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{ _id: Id<'financial_transactions'>; description: string } | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const transactions = useQuery(api.financial_transactions.search, {
    searchTerm: searchTerm.trim() || undefined,
    type: selectedType || undefined,
    limit: 100,
  });

  const createTransaction = useMutation(api.financial_transactions.create);
  const updateTransaction = useMutation(api.financial_transactions.update);
  const deleteTransaction = useMutation(api.financial_transactions.remove);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateTransaction = () => {
    setFormData({
      type: 'income',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
    setShowCreateForm(true);
  };

  const handleEditTransaction = (transaction: { _id: Id<'financial_transactions'>; type: 'income' | 'expense'; description: string; amount: number; date: number }) => {
    setFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    setEditingTransaction(transaction);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const transactionDate = new Date(formData.date).getTime();
      
      if (editingTransaction) {
        await updateTransaction({
          id: editingTransaction._id,
          type: formData.type,
          description: formData.description,
          amount: formData.amount,
          date: transactionDate,
        });
      } else {
        await createTransaction({
          type: formData.type,
          description: formData.description,
          amount: formData.amount,
          date: transactionDate,
        });
      }
      
      setShowCreateForm(false);
      setEditingTransaction(null);
      setFormData({
        type: 'income',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error al guardar transacción:', error);
    }
  };

  // const handleDeleteTransaction = (transaction: { _id: Id<'financial_transactions'>; description: string }) => {
  //   setTransactionToDelete(transaction);
  //   setShowDeleteConfirm(true);
  // };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction({ id: transactionToDelete._id });
        setShowDeleteConfirm(false);
        setTransactionToDelete(null);
      } catch (error) {
        console.error('Error al eliminar transacción:', error);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTransaction(null);
    setFormData({
      type: 'income',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleViewTransaction = (transactionId: Id<'financial_transactions'>) => {
    navigate(`/finanzas/${transactionId}`);
  };

  if (showCreateForm) {
    return (
      <div>
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="text-green-600 hover:text-green-700 font-medium mb-4"
          >
            ← Volver
          </button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
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
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                {editingTransaction ? 'Actualizar' : 'Crear'} Transacción
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Finanzas</h1>
            <p className="text-gray-600">Gestiona ingresos y gastos adicionales</p>
          </div>
          <button
            onClick={handleCreateTransaction}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Nueva Transacción
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por descripción
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar transacciones..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'income' | 'expense' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todos los tipos</option>
                <option value="income">Solo Ingresos</option>
                <option value="expense">Solo Gastos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de transacciones */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction: { _id: Id<'financial_transactions'>; type: 'income' | 'expense'; description: string; amount: number; date: number; transactionNumber: string }) => (
                    <tr 
                      key={transaction._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewTransaction(transaction._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.transactionNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTransaction(transaction._id);
                            }}
                            className="text-emerald-500 hover:text-emerald-600 mr-3 transition-colors"
                          >
                            Ver
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTransaction(transaction);
                            }}
                            className="text-slate-500 hover:text-slate-600 mr-3 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {searchTerm || selectedType ? (
                  <>
                    <p className="text-lg font-medium mb-2">No se encontraron transacciones</p>
                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No hay transacciones registradas</p>
                    <p className="text-sm">Crea tu primera transacción para comenzar</p>
                  </>
                )}
              </div>
            </div>
          )}
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
                  ¿Estás seguro de que quieres eliminar la transacción "{transactionToDelete?.description}"? 
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

export default Finanzas;
