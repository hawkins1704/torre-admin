import { useState, useMemo } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import ProductImage from "./ProductImage";

interface Product {
    _id: Id<"products">;
    name: string;
    code: string;
    imageId?: Id<"_storage">;
}

interface ProductSelectorProps {
    products: Product[] | undefined;
    selectedProductId: Id<"products"> | "";
    onSelect: (productId: Id<"products">) => void;
    required?: boolean;
}

const ProductSelector = ({ products, selectedProductId, onSelect, required = false }: ProductSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const selectedProduct = products?.find(p => p._id === selectedProductId);

    // Filtrar productos basado en el término de búsqueda
    const filteredProducts = useMemo(() => {
        if (!products || !searchTerm.trim()) {
            return products || [];
        }
        
        const term = searchTerm.toLowerCase().trim();
        return products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.code.toLowerCase().includes(term)
        );
    }, [products, searchTerm]);

    const handleSelect = (productId: Id<"products">) => {
        onSelect(productId);
        setIsOpen(false);
        setSearchTerm(""); // Limpiar búsqueda al seleccionar
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm(""); // Limpiar búsqueda al cerrar
    };

    return (
        <div className="relative">
            {/* Trigger Button - Muestra el producto seleccionado */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-left flex items-center justify-between ${
                    !selectedProduct ? 'text-gray-500' : ''
                }`}
            >
                {selectedProduct ? (
                    <div className="flex items-center space-x-3">
                        <ProductImage
                            imageId={selectedProduct.imageId}
                            className="w-8 h-8 rounded border border-gray-200"
                            alt={selectedProduct.name}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {selectedProduct.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {selectedProduct.code}
                            </p>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-500">Seleccionar producto</span>
                )}
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={handleClose}
                    />
                    
                    {/* Panel */}
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                        {/* Search/Filter Header */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>

                        {/* Products List */}
                        <div className="max-h-64 overflow-y-auto">
                            {filteredProducts && filteredProducts.length > 0 ? (
                                <div className="p-2">
                                    {filteredProducts.map((product) => (
                                        <button
                                            key={product._id}
                                            type="button"
                                            onClick={() => handleSelect(product._id)}
                                            className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-gray-50 ${
                                                selectedProductId === product._id 
                                                    ? 'bg-green-50 border border-green-200' 
                                                    : 'border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <ProductImage
                                                    imageId={product.imageId}
                                                    className="w-12 h-12 rounded border border-gray-200 flex-shrink-0"
                                                    alt={product.name}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {product.code}
                                                    </p>
                                                </div>
                                                {selectedProductId === product._id && (
                                                    <svg
                                                        className="w-5 h-5 text-green-600 flex-shrink-0"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    <p className="text-sm">
                                        {searchTerm.trim() 
                                            ? `No se encontraron productos que coincidan con "${searchTerm}"`
                                            : "No hay productos disponibles"
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Hidden input for form validation */}
            {required && (
                <input
                    type="hidden"
                    value={selectedProductId}
                    required
                />
            )}
        </div>
    );
};

export default ProductSelector;
