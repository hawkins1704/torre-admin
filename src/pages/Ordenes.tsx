import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import OrderForm from "../components/OrderForm";
import { useCurrentStore } from "../hooks/useCurrentStore";

const Ordenes = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [editingOrderId, setEditingOrderId] = useState<
        Id<"orders"> | undefined
    >(undefined);
    const [searchTerm, setSearchTerm] = useState("");

    const currentStoreId = useCurrentStore();

    const ordersData = useQuery(api.orders.search, {
        searchTerm: searchTerm.trim() || undefined,
        limit: 50,
        storeId: currentStoreId || undefined,
    });

    const orders = ordersData;

    const handleCreateOrder = () => {
        setEditingOrderId(undefined);
        setShowForm(true);
    };

    const handleViewOrder = (orderId: Id<"orders">) => {
        navigate(`/ordenes/${orderId}`);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingOrderId(undefined);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingOrderId(undefined);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(value);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    // Si se está mostrando el formulario
    if (showForm) {
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
                <OrderForm
                    orderId={editingOrderId}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            Órdenes
                        </h1>
                        <p className="text-gray-600">
                            Gestiona las órdenes de compra a proveedores
                        </p>
                    </div>
                    <button
                        onClick={handleCreateOrder}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Crear Orden
                    </button>
                </div>

                {/* Barra de búsqueda */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar órdenes
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Busca por nombre del proveedor..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de órdenes */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Número de Orden
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Proveedor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Productos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders?.map((order) => (
                                <tr
                                    key={order._id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleViewOrder(order._id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.orderNumber}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(order.orderDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {order.supplier}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {order.products.length} producto
                                            {order.products.length !== 1
                                                ? "s"
                                                : ""}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {order.products
                                                .map((p) => p.product?.name)
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(order.totalAmount)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!orders || orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500">
                            {searchTerm ? (
                                <>
                                    <p className="text-lg font-medium mb-2">
                                        No se encontraron órdenes
                                    </p>
                                    <p className="text-sm">
                                        Intenta ajustar el término de búsqueda
                                    </p>
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-12 h-12 mx-auto text-gray-400 mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        No hay órdenes
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Comienza creando tu primera orden
                                    </p>
                                    <button
                                        onClick={handleCreateOrder}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Crear Orden
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Ordenes;
