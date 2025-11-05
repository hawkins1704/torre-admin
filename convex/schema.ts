import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  stores: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"), // ID del usuario que creó la tienda
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_created_at", ["createdAt"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_store", ["storeId"]),

  suppliers: defineTable({
    name: v.string(),
    number: v.string(),
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_number", ["number"])
    .index("by_store", ["storeId"]),

  products: defineTable({
    // Campos de entrada
    code: v.string(),
    name: v.string(),
    age: v.string(),
    categoryId: v.id("categories"),
    cost: v.number(),
    packaging: v.number(),
    advertisingPercentage: v.number(),
    profitPercentage: v.number(),
    gatewayCommission: v.number(),
    igvPercentage: v.optional(v.number()),
    imageId: v.optional(v.id("_storage")),
    // Variaciones del producto
    variations: v.optional(v.array(v.object({
      name: v.string(), // Ej: "Color", "Talla", "Material"
      values: v.array(v.string()), // Ej: ["Rojo", "Azul", "Verde"]
    }))),
    
    // Stock del producto
    stock: v.number(), // Stock total (suma de todas las variaciones)
    stockByVariation: v.optional(v.any()), // { "Talla": { "S": 10, "M": 15 }, "Color": { "Rojo": 5 } }
    
    // Campos calculados
    totalCost: v.number(),
    advertisingAmount: v.number(),
    profitAmount: v.number(),
    desiredNetIncome: v.number(),
    priceWithoutIgv: v.number(),
    priceWithIgv: v.number(),
    finalPrice: v.number(),
    priceWithoutGateway: v.number(), // Precio sin pasarela
    finalPriceWithoutGateway: v.number(), // Precio final sin pasarela (redondeado)
    
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_created_at", ["createdAt"])
    .index("by_code", ["code"])
    .index("by_store", ["storeId"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["categoryId"]
    })
    .searchIndex("search_products_by_code", {
      searchField: "code",
      filterFields: ["categoryId"]
    }),

  orders: defineTable({
    orderNumber: v.string(),
    orderDate: v.number(), // Fecha de la orden
    supplier: v.string(), // Proveedor
    products: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
      variations: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
        quantity: v.number(),
      }))),
    })),
    totalAmount: v.number(),
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_order_number", ["orderNumber"])
    .index("by_store", ["storeId"]),

  sales: defineTable({
    saleNumber: v.string(),
    saleDate: v.number(), // Fecha de la venta
    customerName: v.string(), // Nombre del cliente
    customerNumber: v.string(), // Número del cliente
    customerAddress: v.string(), // Dirección del cliente
    district: v.optional(v.string()), // Distrito del cliente
    googleMapsUrl: v.optional(v.string()), // URL de Google Maps
    shippingCost: v.number(), // Costo de envío
    salesChannel: v.string(), // "SHOPIFY", "MARKETPLACE", "INSTAGRAM", "TIKTOK"
    products: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(), // Precio unitario según canal
      totalPrice: v.number(),
      variations: v.optional(v.array(v.object({
        name: v.string(),
        value: v.string(),
        quantity: v.number(),
      }))),
    })),
    subtotalAmount: v.number(), // Subtotal sin descuento
    discountAmount: v.number(), // Descuento aplicado en soles
    advancePayment: v.number(), // Adelanto pagado por el cliente
    saleStatus: v.optional(v.union(v.literal("REGISTRADO"), v.literal("PREPARADO"), v.literal("COMPLETADO"))), // Estado de la venta
    totalAmount: v.number(), // Total final
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_sale_number", ["saleNumber"])
    .index("by_sales_channel", ["salesChannel"])
    .index("by_store", ["storeId"]),

  financial_transactions: defineTable({
    transactionNumber: v.string(),
    date: v.number(), // Fecha de la transacción
    type: v.union(v.literal("income"), v.literal("expense")),
    description: v.string(),
    amount: v.number(),
    storeId: v.optional(v.id("stores")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_date", ["date"])
    .index("by_type", ["type"])
    .index("by_transaction_number", ["transactionNumber"])
    .index("by_store", ["storeId"]),
});