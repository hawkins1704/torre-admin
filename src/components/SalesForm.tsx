import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import ProductSelector from "./ProductSelector";
import { useCurrentStore } from "../hooks/useCurrentStore";

interface SalesFormProps {
    saleId?: Id<"sales">;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface SaleProduct {
    productId: Id<"products">;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variations?: Array<{
        name: string;
        value: string;
        quantity: number;
    }>;
}

interface SalesFormData {
    saleNumber: string;
    saleDate: number;
    customerName: string;
    customerNumber: string;
    customerAddress: string;
    district: string;
    googleMapsUrl: string;
    shippingCost: number;
    salesChannel: string;
    products: SaleProduct[];
    subtotalAmount: number;
    discountAmount: number;
    advancePayment: number;
    saleStatus: "REGISTRADO" | "PREPARADO" | "COMPLETADO";
    totalAmount: number;
}

const SalesForm = ({ saleId, onSuccess, onCancel }: SalesFormProps) => {
    const [formData, setFormData] = useState<SalesFormData>({
        saleNumber: "",
        saleDate: Date.now(),
        customerName: "Clientes Varios",
        customerNumber: "",
        customerAddress: "",
        district: "",
        googleMapsUrl: "",
        shippingCost: 0,
        salesChannel: "TIKTOK",
        products: [],
        subtotalAmount: 0,
        discountAmount: 0,
        advancePayment: 0,
        saleStatus: "REGISTRADO",
        totalAmount: 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    const currentStoreId = useCurrentStore();

    const productsData = useQuery(api.products.getAll, {
        storeId: currentStoreId || undefined,
    });
    const products = productsData?.products;
    const sale = useQuery(api.sales.getById, saleId ? { id: saleId } : "skip");
    const createSale = useMutation(api.sales.create);
    const updateSale = useMutation(api.sales.update);
    const generateSaleNumber = useMutation(api.sales.generateSaleNumber);

    // Cargar datos de la venta si está editando
    useEffect(() => {
        if (sale) {
            setFormData({
                saleNumber: sale.saleNumber,
                saleDate: sale.saleDate,
                customerName: sale.customerName,
                customerNumber: sale.customerNumber,
                customerAddress: sale.customerAddress,
                district: sale.district || "",
                googleMapsUrl: sale.googleMapsUrl || "",
                shippingCost: sale.shippingCost,
                salesChannel: sale.salesChannel,
                products: sale.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    totalPrice: p.totalPrice,
                    variations: p.variations,
                })),
                subtotalAmount: sale.subtotalAmount,
                discountAmount: sale.discountAmount,
                advancePayment: sale.advancePayment || 0,
                saleStatus: sale.saleStatus || "REGISTRADO",
                totalAmount: sale.totalAmount,
            });
        } else if (!saleId) {
            // Generar número de venta automático para nuevas ventas
            generateSaleNumber().then((number) => {
                setFormData((prev) => ({ ...prev, saleNumber: number }));
            });
        }
    }, [sale, saleId, generateSaleNumber]);

    // Calcular totales automáticamente
    useEffect(() => {
        const subtotal = formData.products.reduce(
            (sum, product) => sum + product.totalPrice,
            0
        );
        // Validar que el descuento no sea mayor al subtotal
        const maxDiscount = subtotal + formData.shippingCost;
        const validDiscount = Math.min(formData.discountAmount, maxDiscount);

        const total = subtotal + formData.shippingCost - validDiscount;
        setFormData((prev) => ({
            ...prev,
            subtotalAmount: subtotal,
            discountAmount: validDiscount,
            totalAmount: total,
        }));
    }, [formData.products, formData.shippingCost, formData.discountAmount]);

    // Verificar si hay productos sin stock
    const hasOutOfStockProducts = formData.products.some((product) => {
        if (!product.productId) return false;
        const selectedProduct = products?.find(
            (p) => p._id === product.productId
        );
        return selectedProduct && selectedProduct.stock < product.quantity;
    });

    const handleInputChange = (
        field: keyof SalesFormData,
        value: string | number
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const addProduct = () => {
        setFormData((prev) => ({
            ...prev,
            products: [
                ...prev.products,
                {
                    productId: "" as Id<"products">,
                    quantity: 1,
                    unitPrice: 0,
                    totalPrice: 0,
                    variations: [],
                },
            ],
        }));
    };

    const removeProduct = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index),
        }));
    };

    const updateProduct = (
        index: number,
        field: keyof SaleProduct,
        value:
            | string
            | number
            | Array<{ name: string; value: string; quantity: number }>
    ) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.map((product, i) => {
                if (i === index) {
                    const updatedProduct = { ...product, [field]: value };

                    // Si cambió el producto, recalcular precio según canal
                    if (field === "productId") {
                        const selectedProduct = products?.find(
                            (p) => p._id === value
                        );
                        if (selectedProduct) {
                            // Determinar precio según canal de venta
                            if (formData.salesChannel === "SHOPIFY") {
                                updatedProduct.unitPrice =
                                    selectedProduct.finalPrice; // Con pasarela
                            } else {
                                updatedProduct.unitPrice =
                                    selectedProduct.finalPriceWithoutGateway; // Sin pasarela
                            }
                        }
                        updatedProduct.variations = [];
                    }

                    // Recalcular total del producto
                    updatedProduct.totalPrice =
                        updatedProduct.quantity * updatedProduct.unitPrice;

                    return updatedProduct;
                }
                return product;
            }),
        }));
    };

    const addVariation = (productIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.map((product, i) => {
                if (i === productIndex) {
                    const updatedProduct = {
                        ...product,
                        variations: [
                            ...(product.variations || []),
                            { name: "", value: "", quantity: 1 },
                        ],
                    };

                    // Recalcular la cantidad total del producto solo si hay variaciones
                    if (
                        updatedProduct.variations &&
                        updatedProduct.variations.length > 0
                    ) {
                        const totalVariationQuantity =
                            updatedProduct.variations.reduce(
                                (sum, variation) =>
                                    sum + (variation.quantity || 0),
                                0
                            );
                        updatedProduct.quantity = totalVariationQuantity;
                    }

                    // Recalcular el total del producto
                    updatedProduct.totalPrice =
                        updatedProduct.quantity * updatedProduct.unitPrice;

                    return updatedProduct;
                }
                return product;
            }),
        }));
    };

    const removeVariation = (productIndex: number, variationIndex: number) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.map((product, i) => {
                if (i === productIndex) {
                    const updatedProduct = {
                        ...product,
                        variations:
                            product.variations?.filter(
                                (_, j) => j !== variationIndex
                            ) || [],
                    };

                    // Recalcular la cantidad total del producto solo si hay variaciones
                    if (
                        updatedProduct.variations &&
                        updatedProduct.variations.length > 0
                    ) {
                        const totalVariationQuantity =
                            updatedProduct.variations.reduce(
                                (sum, variation) =>
                                    sum + (variation.quantity || 0),
                                0
                            );
                        updatedProduct.quantity = totalVariationQuantity;
                    }

                    // Recalcular el total del producto
                    updatedProduct.totalPrice =
                        updatedProduct.quantity * updatedProduct.unitPrice;

                    return updatedProduct;
                }
                return product;
            }),
        }));
    };

    const updateVariation = (
        productIndex: number,
        variationIndex: number,
        field: string,
        value: string | number
    ) => {
        setFormData((prev) => ({
            ...prev,
            products: prev.products.map((product, i) => {
                if (i === productIndex) {
                    const updatedProduct = {
                        ...product,
                        variations:
                            product.variations?.map((variation, j) =>
                                j === variationIndex
                                    ? { ...variation, [field]: value }
                                    : variation
                            ) || [],
                    };

                    // Si cambió la cantidad de una variación, recalcular la cantidad total del producto
                    if (
                        field === "quantity" &&
                        updatedProduct.variations &&
                        updatedProduct.variations.length > 0
                    ) {
                        const totalVariationQuantity =
                            updatedProduct.variations.reduce(
                                (sum, variation) =>
                                    sum + (variation.quantity || 0),
                                0
                            );
                        updatedProduct.quantity = totalVariationQuantity;
                    }

                    // Recalcular el total del producto
                    updatedProduct.totalPrice =
                        updatedProduct.quantity * updatedProduct.unitPrice;

                    return updatedProduct;
                }
                return product;
            }),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        try {
            const saleData = {
                saleNumber: formData.saleNumber,
                saleDate: formData.saleDate,
                customerName: formData.customerName,
                customerNumber: formData.customerNumber,
                customerAddress: formData.customerAddress,
                district: formData.district,
                googleMapsUrl: formData.googleMapsUrl,
                shippingCost: formData.shippingCost,
                salesChannel: formData.salesChannel,
                products: formData.products,
                subtotalAmount: formData.subtotalAmount,
                discountAmount: formData.discountAmount,
                advancePayment: formData.advancePayment,
                saleStatus: formData.saleStatus as "REGISTRADO" | "PREPARADO" | "COMPLETADO",
                totalAmount: formData.totalAmount,
                storeId: currentStoreId || undefined,
            };

            if (saleId) {
                await updateSale({
                    id: saleId,
                    ...saleData,
                });
            } else {
                await createSale(saleData);
            }

            onSuccess?.();
        } catch (error) {
            console.error("Error saving sale:", error);
            alert("Error al guardar la venta. Por favor intenta de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(value);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toISOString().split("T")[0];
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
           
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {saleId ? "Editar Venta" : "Crear Venta"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número de Venta *
                            </label>
                            <input
                                type="text"
                                value={formData.saleNumber}
                                onChange={(e) =>
                                    handleInputChange(
                                        "saleNumber",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Venta *
                            </label>
                            <input
                                type="date"
                                value={formatDate(formData.saleDate)}
                                onChange={(e) =>
                                    handleInputChange(
                                        "saleDate",
                                        new Date(e.target.value).getTime()
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Canal de Venta *
                            </label>
                            <select
                                value={formData.salesChannel}
                                onChange={(e) =>
                                    handleInputChange(
                                        "salesChannel",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            >
                                <option value="">Seleccionar canal</option>
                                <option value="MARKETPLACE">MARKETPLACE</option>
                                <option value="INSTAGRAM">INSTAGRAM</option>
                                <option value="TIKTOK">TIKTOK</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado de Venta
                            </label>
                            <select
                                value={formData.saleStatus}
                                onChange={(e) =>
                                    handleInputChange(
                                        "saleStatus",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="REGISTRADO">REGISTRADO</option>
                                <option value="PREPARADO">PREPARADO</option>
                                <option value="COMPLETADO">COMPLETADO</option>
                            </select>
                        </div>
                    </div>

                    {/* Información del cliente */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Información del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Cliente *
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "customerName",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nombre completo del cliente"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número del Cliente *
                                </label>
                                <input
                                    type="text"
                                    value={formData.customerNumber}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "customerNumber",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Teléfono o WhatsApp"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección *
                                </label>
                                <textarea
                                    value={formData.customerAddress}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "customerAddress",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Dirección completa de entrega"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Distrito *
                                </label>
                                <select
                                    value={formData.district}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "district",
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    <option value="">Seleccionar distrito</option>
                                    <option value="ATE VITARTE">ATE VITARTE</option>
                                    <option value="BARRANCO">BARRANCO</option>
                                    <option value="BELLAVISTA">BELLAVISTA</option>
                                    <option value="BREÑA">BREÑA</option>
                                    <option value="CALLAO">CALLAO</option>
                                    <option value="CARMEN DE LA LEGUA">CARMEN DE LA LEGUA</option>
                                    <option value="CHORRILLOS">CHORRILLOS</option>
                                    <option value="COMAS">COMAS</option>
                                    <option value="EL AGUSTINO">EL AGUSTINO</option>
                                    <option value="INDEPENDENCIA">INDEPENDENCIA</option>
                                    <option value="JESUS MARIA">JESÚS MARÍA</option>
                                    <option value="LA MOLINA">LA MOLINA</option>
                                    <option value="LA PERLA">LA PERLA</option>
                                    <option value="LA PUNTA">LA PUNTA</option>
                                    <option value="LA VICTORIA">LA VICTORIA</option>
                                    <option value="LINCE">LINCE</option>
                                    <option value="LOS OLIVOS">LOS OLIVOS</option>
                                    <option value="MAGDALENA">MAGDALENA</option>
                                    <option value="MARQUEZ">MARQUEZ</option>
                                    <option value="MIRAFLORES">MIRAFLORES</option>
                                    <option value="OQUENDO">OQUENDO</option>
                                    <option value="PUEBLO LIBRE">PUEBLO LIBRE</option>
                                    <option value="PUENTE PIEDRA">PUENTE PIEDRA</option>
                                    <option value="RIMAC">RÍMAC</option>
                                    <option value="SAN BORJA">SAN BORJA</option>
                                    <option value="SAN ISIDRO">SAN ISIDRO</option>
                                    <option value="SAN JUAN DE MIRAFLORES">SAN JUAN DE MIRAFLORES</option>
                                    <option value="SAN LUIS">SAN LUIS</option>
                                    <option value="SAN MIGUEL">SAN MIGUEL</option>
                                    <option value="SANTA ANITA">SANTA ANITA</option>
                                    <option value="SANTA CLARA">SANTA CLARA</option>
                                    <option value="SMP (SAN MARTIN DE PORRES)">SMP (SAN MARTÍN DE PORRES)</option>
                                    <option value="SURCO">SURCO</option>
                                    <option value="SURQUILLO">SURQUILLO</option>
                                    <option value="VILLA EL SALVADOR">VILLA EL SALVADOR</option>
                                    <option value="VILLA MARIA DEL TRIUNFO">VILLA MARÍA DEL TRIUNFO</option>
                                    <option value="OTROS">OTROS</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL Google Maps *
                                </label>
                                <input
                                    type="url"
                                    value={formData.googleMapsUrl}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "googleMapsUrl",
                                            e.target.value
                                        )
                                    }
                                    placeholder="https://maps.google.com/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enlace a la ubicación en Google Maps
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Costos adicionales */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Costos Adicionales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Costo de Envío
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.shippingCost}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "shippingCost",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descuento Aplicado
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={
                                        formData.subtotalAmount +
                                        formData.shippingCost
                                    }
                                    value={formData.discountAmount}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "discountAmount",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        formData.discountAmount >
                                        formData.subtotalAmount +
                                            formData.shippingCost
                                            ? "border-red-300 bg-red-50"
                                            : "border-gray-300"
                                    }`}
                                />
                                {formData.discountAmount >
                                    formData.subtotalAmount +
                                        formData.shippingCost && (
                                    <p className="text-xs text-red-600 mt-1">
                                        El descuento no puede ser mayor al
                                        subtotal + envío
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Máximo:{" "}
                                    {formatCurrency(
                                        formData.subtotalAmount +
                                            formData.shippingCost
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adelanto Pagado
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.advancePayment}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "advancePayment",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Monto pagado por adelantado
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="border-t pt-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Productos
                            </h3>
                        </div>

                        {formData.products.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg
                                    className="w-12 h-12 mx-auto mb-4 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                                <p>No hay productos agregados</p>
                                <p className="text-sm">
                                    Agrega productos a esta venta
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.products.map(
                                    (product, productIndex) => (
                                        <div
                                            key={productIndex}
                                            className="bg-gray-50 p-4 rounded-lg"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Producto *
                                                    </label>
                                                    <ProductSelector
                                                        products={products}
                                                        selectedProductId={product.productId}
                                                        onSelect={(productId) =>
                                                            updateProduct(
                                                                productIndex,
                                                                "productId",
                                                                productId
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Cantidad *
                                                        {product.variations &&
                                                            product.variations
                                                                .length > 0 && (
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    (Calculada
                                                                    automáticamente)
                                                                </span>
                                                            )}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={product.quantity}
                                                        onChange={(e) =>
                                                            updateProduct(
                                                                productIndex,
                                                                "quantity",
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 1
                                                            )
                                                        }
                                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                                            product.variations &&
                                                            product.variations
                                                                .length > 0
                                                                ? "bg-gray-100 cursor-not-allowed"
                                                                : ""
                                                        }`}
                                                        disabled={
                                                            product.variations &&
                                                            product.variations
                                                                .length > 0
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeProduct(
                                                                productIndex
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Información del producto seleccionado */}
                                            {product.productId && (
                                                <div className="mb-4 p-3 bg-white rounded shadow-sm">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Precio unitario
                                                                (editable)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    product.unitPrice
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const newPrice =
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 0;
                                                                    updateProduct(
                                                                        productIndex,
                                                                        "unitPrice",
                                                                        newPrice
                                                                    );
                                                                }}
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Total calculado
                                                            </label>
                                                            <div className="px-2 py-1 text-sm  rounded border border-gray-300">
                                                                {formatCurrency(
                                                                    product.totalPrice
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">
                                                                Producto:
                                                            </span>
                                                            <span className="ml-2 font-medium">
                                                                {
                                                                    products?.find(
                                                                        (p) =>
                                                                            p._id ===
                                                                            product.productId
                                                                    )?.name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">
                                                                Canal:
                                                            </span>
                                                            <span className="ml-2 font-medium">
                                                                {formData.salesChannel ===
                                                                "SHOPIFY"
                                                                    ? "Con Pasarela"
                                                                    : "Sin Pasarela"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">
                                                                Stock
                                                                disponible:
                                                            </span>
                                                            <span
                                                                className={`ml-2 font-medium ${
                                                                    (products?.find(
                                                                        (p) =>
                                                                            p._id ===
                                                                            product.productId
                                                                    )?.stock ||
                                                                        0) <
                                                                    product.quantity
                                                                        ? "text-red-600"
                                                                        : "text-green-600"
                                                                }`}
                                                            >
                                                                {products?.find(
                                                                    (p) =>
                                                                        p._id ===
                                                                        product.productId
                                                                )?.stock ||
                                                                    0}{" "}
                                                                unidades
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">
                                                                Cantidad
                                                                solicitada:
                                                            </span>
                                                            <span className="ml-2 font-medium">
                                                                {
                                                                    product.quantity
                                                                }{" "}
                                                                unidades
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Mensaje de error si no hay stock suficiente */}
                                                    {products?.find(
                                                        (p) =>
                                                            p._id ===
                                                            product.productId
                                                    ) &&
                                                        (products?.find(
                                                            (p) =>
                                                                p._id ===
                                                                product.productId
                                                        )?.stock || 0) <
                                                            product.quantity && (
                                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                                                                <p className="text-sm text-red-600 font-medium">
                                                                    ⚠️ El
                                                                    producto
                                                                    seleccionado
                                                                    no tiene
                                                                    stock
                                                                    suficiente
                                                                </p>
                                                                <p className="text-xs text-red-500 mt-1">
                                                                    Stock
                                                                    disponible:{" "}
                                                                    {products?.find(
                                                                        (p) =>
                                                                            p._id ===
                                                                            product.productId
                                                                    )?.stock ||
                                                                        0}{" "}
                                                                    unidades |
                                                                    Cantidad
                                                                    solicitada:{" "}
                                                                    {
                                                                        product.quantity
                                                                    }{" "}
                                                                    unidades
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>
                                            )}

                                            {/* Variaciones del producto */}
                                            {product.productId &&
                                                products?.find(
                                                    (p) =>
                                                        p._id ===
                                                        product.productId
                                                )?.variations &&
                                                (products?.find(
                                                    (p) =>
                                                        p._id ===
                                                        product.productId
                                                )?.variations?.length || 0) >
                                                    0 && (
                                                    <div className="mt-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-sm font-medium text-gray-700">
                                                                Variaciones
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addVariation(
                                                                        productIndex
                                                                    )
                                                                }
                                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                            >
                                                                Agregar
                                                                Variación
                                                            </button>
                                                        </div>

                                                        {product.variations &&
                                                            product.variations
                                                                .length > 0 && (
                                                                <div className="space-y-3">
                                                                    {product.variations.map(
                                                                        (
                                                                            variation,
                                                                            variationIndex
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    variationIndex
                                                                                }
                                                                                className="p-3 bg-white rounded shadow-sm"
                                                                            >
                                                                                {/* Mobile layout */}
                                                                                <div className="block md:hidden space-y-3">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-sm font-medium text-gray-700">
                                                                                            Variación{" "}
                                                                                            {variationIndex +
                                                                                                1}
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                removeVariation(
                                                                                                    productIndex,
                                                                                                    variationIndex
                                                                                                )
                                                                                            }
                                                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                                                        >
                                                                                            <svg
                                                                                                className="w-4 h-4"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                viewBox="0 0 24 24"
                                                                                            >
                                                                                                <path
                                                                                                    strokeLinecap="round"
                                                                                                    strokeLinejoin="round"
                                                                                                    strokeWidth={
                                                                                                        2
                                                                                                    }
                                                                                                    d="M6 18L18 6M6 6l12 12"
                                                                                                />
                                                                                            </svg>
                                                                                        </button>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                            Tipo
                                                                                            de
                                                                                            variación
                                                                                        </label>
                                                                                        <select
                                                                                            value={
                                                                                                variation.name
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
                                                                                                updateVariation(
                                                                                                    productIndex,
                                                                                                    variationIndex,
                                                                                                    "name",
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                        >
                                                                                            <option value="">
                                                                                                Seleccionar
                                                                                                variación
                                                                                            </option>
                                                                                            {products
                                                                                                ?.find(
                                                                                                    (
                                                                                                        p
                                                                                                    ) =>
                                                                                                        p._id ===
                                                                                                        product.productId
                                                                                                )
                                                                                                ?.variations?.map(
                                                                                                    (
                                                                                                        v
                                                                                                    ) => (
                                                                                                        <option
                                                                                                            key={
                                                                                                                v.name
                                                                                                            }
                                                                                                            value={
                                                                                                                v.name
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                v.name
                                                                                                            }
                                                                                                        </option>
                                                                                                    )
                                                                                                )}
                                                                                        </select>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                            Valor
                                                                                        </label>
                                                                                        <select
                                                                                            value={
                                                                                                variation.value
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
                                                                                                updateVariation(
                                                                                                    productIndex,
                                                                                                    variationIndex,
                                                                                                    "value",
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                        >
                                                                                            <option value="">
                                                                                                Seleccionar
                                                                                                valor
                                                                                            </option>
                                                                                            {variation.name &&
                                                                                                products
                                                                                                    ?.find(
                                                                                                        (
                                                                                                            p
                                                                                                        ) =>
                                                                                                            p._id ===
                                                                                                            product.productId
                                                                                                    )
                                                                                                    ?.variations?.find(
                                                                                                        (
                                                                                                            v
                                                                                                        ) =>
                                                                                                            v.name ===
                                                                                                            variation.name
                                                                                                    )
                                                                                                    ?.values.map(
                                                                                                        (
                                                                                                            val
                                                                                                        ) => (
                                                                                                            <option
                                                                                                                key={
                                                                                                                    val
                                                                                                                }
                                                                                                                value={
                                                                                                                    val
                                                                                                                }
                                                                                                            >
                                                                                                                {
                                                                                                                    val
                                                                                                                }
                                                                                                            </option>
                                                                                                        )
                                                                                                    )}
                                                                                        </select>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                                            Cantidad
                                                                                        </label>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={
                                                                                                variation.quantity
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
                                                                                                updateVariation(
                                                                                                    productIndex,
                                                                                                    variationIndex,
                                                                                                    "quantity",
                                                                                                    parseInt(
                                                                                                        e
                                                                                                            .target
                                                                                                            .value
                                                                                                    ) ||
                                                                                                        1
                                                                                                )
                                                                                            }
                                                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                            placeholder="Cantidad"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Desktop layout */}
                                                                                <div className="hidden md:flex items-center space-x-2">
                                                                                    <select
                                                                                        value={
                                                                                            variation.name
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updateVariation(
                                                                                                productIndex,
                                                                                                variationIndex,
                                                                                                "name",
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                    >
                                                                                        <option value="">
                                                                                            Seleccionar
                                                                                            variación
                                                                                        </option>
                                                                                        {products
                                                                                            ?.find(
                                                                                                (
                                                                                                    p
                                                                                                ) =>
                                                                                                    p._id ===
                                                                                                    product.productId
                                                                                            )
                                                                                            ?.variations?.map(
                                                                                                (
                                                                                                    v
                                                                                                ) => (
                                                                                                    <option
                                                                                                        key={
                                                                                                            v.name
                                                                                                        }
                                                                                                        value={
                                                                                                            v.name
                                                                                                        }
                                                                                                    >
                                                                                                        {
                                                                                                            v.name
                                                                                                        }
                                                                                                    </option>
                                                                                                )
                                                                                            )}
                                                                                    </select>

                                                                                    <select
                                                                                        value={
                                                                                            variation.value
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updateVariation(
                                                                                                productIndex,
                                                                                                variationIndex,
                                                                                                "value",
                                                                                                e
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                    >
                                                                                        <option value="">
                                                                                            Seleccionar
                                                                                            valor
                                                                                        </option>
                                                                                        {variation.name &&
                                                                                            products
                                                                                                ?.find(
                                                                                                    (
                                                                                                        p
                                                                                                    ) =>
                                                                                                        p._id ===
                                                                                                        product.productId
                                                                                                )
                                                                                                ?.variations?.find(
                                                                                                    (
                                                                                                        v
                                                                                                    ) =>
                                                                                                        v.name ===
                                                                                                        variation.name
                                                                                                )
                                                                                                ?.values.map(
                                                                                                    (
                                                                                                        val
                                                                                                    ) => (
                                                                                                        <option
                                                                                                            key={
                                                                                                                val
                                                                                                            }
                                                                                                            value={
                                                                                                                val
                                                                                                            }
                                                                                                        >
                                                                                                            {
                                                                                                                val
                                                                                                            }
                                                                                                        </option>
                                                                                                    )
                                                                                                )}
                                                                                    </select>

                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={
                                                                                            variation.quantity
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updateVariation(
                                                                                                productIndex,
                                                                                                variationIndex,
                                                                                                "quantity",
                                                                                                parseInt(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                ) ||
                                                                                                    1
                                                                                            )
                                                                                        }
                                                                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                                                                        placeholder="Cant."
                                                                                    />

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            removeVariation(
                                                                                                productIndex,
                                                                                                variationIndex
                                                                                            )
                                                                                        }
                                                                                        className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                                                    >
                                                                                        <svg
                                                                                            className="w-4 h-4"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={
                                                                                                    2
                                                                                                }
                                                                                                d="M6 18L18 6M6 6l12 12"
                                                                                            />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        {/* Botón Agregar Producto - Siempre visible debajo de la lista */}
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={addProduct}
                                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                <span>Agregar Producto</span>
                            </button>
                        </div>
                    </div>

                    {/* Mensaje de error general si hay productos sin stock */}
                    {hasOutOfStockProducts && (
                        <div className="border-t pt-6">
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <svg
                                        className="w-5 h-5 text-red-600 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                        />
                                    </svg>
                                    <p className="text-red-800 font-medium">
                                        No se puede crear la venta: Hay
                                        productos sin stock suficiente
                                    </p>
                                </div>
                                <p className="text-red-600 text-sm mt-1">
                                    Ajusta las cantidades o selecciona otros
                                    productos para continuar
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumen */}
                    <div className="border-t pt-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium text-gray-900">
                                        Subtotal:
                                    </span>
                                    <span className="text-lg font-medium text-gray-900">
                                        {formatCurrency(
                                            formData.subtotalAmount
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Costo de envío:
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {formatCurrency(formData.shippingCost)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Descuento:
                                    </span>
                                    <span className="text-sm text-red-600">
                                        -
                                        {formatCurrency(
                                            formData.discountAmount
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Adelanto pagado:
                                    </span>
                                    <span className="text-sm text-blue-600">
                                        -
                                        {formatCurrency(
                                            formData.advancePayment
                                        )}
                                    </span>
                                </div>
                                <div className="border-t pt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-semibold text-gray-900">
                                            Total:
                                        </span>
                                        <span className="text-2xl font-bold text-green-600">
                                            {formatCurrency(
                                                formData.totalAmount
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {formData.advancePayment > 0 && (
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium text-gray-700">
                                                Total a cobrar:
                                            </span>
                                            <span className="text-xl font-bold text-blue-600">
                                                {formatCurrency(
                                                    formData.totalAmount - formData.advancePayment
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Monto que debe cobrar la empresa de delivery
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || hasOutOfStockProducts}
                            className={`px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2 ${
                                hasOutOfStockProducts
                                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                            } ${isSaving ? "opacity-50" : ""}`}
                        >
                            {isSaving && (
                                <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            )}
                            <span>
                                {isSaving
                                    ? "Guardando..."
                                    : saleId
                                      ? "Actualizar Venta"
                                      : "Crear Venta"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesForm;
