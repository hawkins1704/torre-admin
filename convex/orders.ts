import type { PaginationOptions } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Obtener todas las órdenes (paginado)
export const getAll = query({
  args: {
    paginationOpts: v.optional(v.object({
      cursor: v.optional(v.string()),
      numItems: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 50 };
    
    const ordersPage = await ctx.db.query("orders")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(paginationOpts as PaginationOptions);
    
    // Obtener información de productos usando batch get
    const productIds = [...new Set(ordersPage.page.flatMap(order => 
      order.products.map(p => p.productId)
    ))];
    const products = await Promise.all(
      productIds.map(id => ctx.db.get(id))
    );
    const productMap = new Map(
      products.filter(Boolean).map(product => [product!._id, product])
    );
    
    const ordersWithProducts = ordersPage.page.map(order => ({
      ...order,
      products: order.products.map(productOrder => ({
        ...productOrder,
        product: productMap.get(productOrder.productId),
      })),
    }));
    
    return {
      orders: ordersWithProducts,
      isDone: ordersPage.isDone,
      continueCursor: ordersPage.continueCursor,
    };
  },
});

// Obtener una orden por ID
export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;
    
    // Obtener información de productos
    const products = await Promise.all(
      order.products.map(p => ctx.db.get(p.productId))
    );
    
    return {
      ...order,
      products: order.products.map((productOrder, index) => ({
        ...productOrder,
        product: products[index],
      })),
    };
  },
});

// Crear una nueva orden
export const create = mutation({
  args: {
    orderNumber: v.string(),
    orderDate: v.number(),
    supplier: v.string(),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Crear la orden
    const orderId = await ctx.db.insert("orders", {
      orderNumber: args.orderNumber,
      orderDate: args.orderDate,
      supplier: args.supplier,
      products: args.products,
      totalAmount: args.totalAmount,
      createdAt: now,
      updatedAt: now,
    });
    
    // Actualizar stock de cada producto
    for (const productOrder of args.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productOrder.productId,
        quantity: productOrder.quantity,
        variations: productOrder.variations,
      });
    }
    
    return orderId;
  },
});

// Actualizar una orden
export const update = mutation({
  args: {
    id: v.id("orders"),
    orderNumber: v.string(),
    orderDate: v.number(),
    supplier: v.string(),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Obtener la orden actual para comparar productos
    const currentOrder = await ctx.db.get(args.id);
    if (!currentOrder) {
      throw new Error("Orden no encontrada");
    }
    
    // Revertir stock de productos anteriores
    for (const productOrder of currentOrder.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productOrder.productId,
        quantity: -productOrder.quantity, // Restar stock
        variations: productOrder.variations,
      });
    }
    
    // Aplicar stock de productos nuevos
    for (const productOrder of args.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productOrder.productId,
        quantity: productOrder.quantity,
        variations: productOrder.variations,
      });
    }
    
    return await ctx.db.patch(args.id, {
      orderNumber: args.orderNumber,
      orderDate: args.orderDate,
      supplier: args.supplier,
      products: args.products,
      totalAmount: args.totalAmount,
      updatedAt: now,
    });
  },
});

// Eliminar una orden
export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    // Obtener la orden antes de eliminarla
    const order = await ctx.db.get(args.id);
    if (!order) {
      throw new Error("Orden no encontrada");
    }
    
    // Revertir stock de productos
    for (const productOrder of order.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productOrder.productId,
        quantity: -productOrder.quantity, // Restar stock
        variations: productOrder.variations,
      });
    }
    
    return await ctx.db.delete(args.id);
  },
});

// Buscar órdenes por número o proveedor
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let orders;
    
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchTerm = args.searchTerm.trim();
      
      // Buscar por número de orden
      const searchByNumber = ctx.db
        .query("orders")
        .withIndex("by_order_number", (q) => q.eq("orderNumber", searchTerm))
        .take(limit);
      
      // Buscar por proveedor (búsqueda parcial)
      const allOrders = await ctx.db.query("orders").collect();
      const searchBySupplier = allOrders
        .filter(order => 
          order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limit);
      
      // Combinar resultados y eliminar duplicados
      const allResults = [...(await searchByNumber), ...searchBySupplier];
      orders = allResults.filter((order, index, self) => 
        index === self.findIndex(o => o._id === order._id)
      );
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
    }
    
    // Obtener información de productos
    const productIds = [...new Set(orders.flatMap(order => 
      order.products.map(p => p.productId)
    ))];
    const products = await Promise.all(
      productIds.map(id => ctx.db.get(id))
    );
    const productMap = new Map(
      products.filter(Boolean).map(product => [product!._id, product])
    );
    
    return orders.map(order => ({
      ...order,
      products: order.products.map(productOrder => ({
        ...productOrder,
        product: productMap.get(productOrder.productId),
      })),
    }));
  },
});

// Generar número de orden automático
export const generateOrderNumber = mutation({
  handler: async (ctx) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Buscar el último número de orden del día
    const todayOrders = await ctx.db
      .query("orders")
      .filter((q) => 
        q.and(
          q.gte(q.field("orderDate"), new Date(year, now.getMonth(), now.getDate()).getTime()),
          q.lt(q.field("orderDate"), new Date(year, now.getMonth(), now.getDate() + 1).getTime())
        )
      )
      .collect();
    
    const nextNumber = todayOrders.length + 1;
    return `ORD-${year}${month}${day}-${String(nextNumber).padStart(3, '0')}`;
  },
});