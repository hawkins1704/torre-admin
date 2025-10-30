/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';

const numericFields = new Set([
  'totalCost',
  'profitPercentage',
  'finalPrice',
  'finalPriceWithoutGateway',
  'stock',
]);
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import ProductForm from '../components/ProductForm';
import WholesaleModal from '../components/WholesaleModal';
import ProductImage from '../components/ProductImage';

const Productos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = useQuery(api.categories.getAll, {});
  const products = useQuery(api.products.search, {
    searchTerm: searchTerm.trim() || undefined,
    categoryId: selectedCategory ? (selectedCategory as Id<'categories'>) : undefined,
    limit: 100,
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    // First click default: numeric -> desc, text -> asc
    const isNumeric = numericFields.has(field);
    setSortField(field);
    setSortOrder(isNumeric ? 'desc' : 'asc');
  };

  const sortedProducts = useMemo(() => {
    if (!products) return [] as any[];
    if (!sortField) return products;

    const getValue = (p: any) => {
      switch (sortField) {
        case 'name':
          return p.name ?? '';
        case 'category':
          return p.category?.name ?? '';
        case 'totalCost':
          return Number(p.totalCost ?? 0);
        case 'profitPercentage':
          return Number(p.profitPercentage ?? 0);
        case 'finalPrice':
          return Number(p.finalPrice ?? 0);
        case 'finalPriceWithoutGateway':
          return Number(p.finalPriceWithoutGateway ?? 0);
        case 'stock':
          return Number(p.stock ?? 0);
        default:
          return p[sortField];
      }
    };

    const copy = [...products];
    copy.sort((a: any, b: any) => {
      const va = getValue(a);
      const vb = getValue(b);

      if (numericFields.has(sortField)) {
        const diff = (va as number) - (vb as number);
        return sortOrder === 'asc' ? diff : -diff;
      }

      const sa = String(va).toLocaleLowerCase();
      const sb = String(vb).toLocaleLowerCase();
      const cmp = sa.localeCompare(sb);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [products, sortField, sortOrder]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  const handleCreateProduct = () => {
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
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
        <ProductForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Productos</h1>
            <p className="text-gray-600">Gestiona tu inventario de productos</p>
          </div>
          <button
            onClick={handleCreateProduct}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Producto
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nombre o código
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por nombre o código del producto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todas las categorías</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {sortedProducts && sortedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imagen
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Producto{sortField === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('category')}
                    >
                      Categoría{sortField === 'category' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('totalCost')}
                    >
                      Costo Total{sortField === 'totalCost' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('profitPercentage')}
                    >
                      Ganancia %{sortField === 'profitPercentage' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('finalPrice')}
                    >
                      Precio Final{sortField === 'finalPrice' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('finalPriceWithoutGateway')}
                    >
                      Final Sin Pasarela{sortField === 'finalPriceWithoutGateway' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => handleSort('stock')}
                    >
                      Stock{sortField === 'stock' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.map((product) => (
                    <tr 
                      key={product._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/productos/${product._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProductImage 
                          imageId={product.imageId} 
                          className="w-12 h-12"
                          alt={product.name}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Código: {product.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {product.category?.name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.profitPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {formatCurrency(product.finalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.finalPriceWithoutGateway)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock === 0 
                            ? 'bg-red-100 text-red-800' 
                            : product.stock < 10 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-emerald-500 hover:text-emerald-600 mr-3 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/productos/${product._id}`);
                          }}
                        >
                          Ver
                        </button>
                        <button 
                          className="text-slate-600 hover:text-slate-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setShowWholesaleModal(true);
                          }}
                        >
                          X MAYOR
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
                {searchTerm || selectedCategory ? (
                  <>
                    <p className="text-lg font-medium mb-2">No se encontraron productos</p>
                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No hay productos registrados</p>
                    <p className="text-sm">Crea tu primer producto para comenzar</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal X MAYOR */}
      <WholesaleModal
        product={selectedProduct}
        isOpen={showWholesaleModal}
        onClose={() => {
          setShowWholesaleModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default Productos;
