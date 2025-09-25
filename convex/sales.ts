import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtener todas las ventas ordenadas por fecha de creación (con límite)
export const getAll = query({
  args: { paginationOpts: v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) }) },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(args.paginationOpts);
    
    // Obtener información de productos para cada venta
    const salesWithProducts = await Promise.all(
      sales.page.map(async (sale) => {
        const productsWithDetails = await Promise.all(
          sale.products.map(async (productSale) => {
            const product = await ctx.db.get(productSale.productId);
            return {
              ...productSale,
              product: product,
            };
          })
        );
        
        return {
          ...sale,
          products: productsWithDetails,
        };
      })
    );
    
    return {
      ...sales,
      page: salesWithProducts,
    };
  },
});

// Obtener una venta por ID
export const getById = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    if (!sale) return null;
    
    // Obtener información de productos
    const productsWithDetails = await Promise.all(
      sale.products.map(async (productSale) => {
        const product = await ctx.db.get(productSale.productId);
        return {
          ...productSale,
          product: product,
        };
      })
    );
    
    return {
      ...sale,
      products: productsWithDetails,
    };
  },
});

// Buscar ventas por número o cliente
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let sales;
    
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchTerm = args.searchTerm.trim();
      
      // Buscar por número de venta
      const searchByNumber = ctx.db
        .query("sales")
        .withIndex("by_sale_number", (q) => q.eq("saleNumber", searchTerm))
        .take(limit);
      
      // Buscar por cliente (búsqueda parcial)
      const allSales = await ctx.db.query("sales").collect();
      const searchByCustomer = allSales
        .filter(sale => 
          sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limit);
      
      // Combinar resultados y eliminar duplicados
      const allResults = [...(await searchByNumber), ...searchByCustomer];
      sales = allResults.filter((sale, index, self) => 
        index === self.findIndex(s => s._id === sale._id)
      );
    } else {
      sales = await ctx.db
        .query("sales")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
    }
    
    // Obtener información de productos
    const salesWithProducts = await Promise.all(
      sales.map(async (sale) => {
        const productsWithDetails = await Promise.all(
          sale.products.map(async (productSale) => {
            const product = await ctx.db.get(productSale.productId);
            return {
              ...productSale,
              product: product,
            };
          })
        );
        
        return {
          ...sale,
          products: productsWithDetails,
        };
      })
    );
    
    return salesWithProducts;
  },
});

// Generar número de venta automático
export const generateSaleNumber = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Buscar el último número de venta del día
    const todaySales = await ctx.db
      .query("sales")
      .filter((q) => 
        q.and(
          q.gte(q.field("saleDate"), new Date(year, now.getMonth(), now.getDate()).getTime()),
          q.lt(q.field("saleDate"), new Date(year, now.getMonth(), now.getDate() + 1).getTime())
        )
      )
      .collect();
    
    const nextNumber = todaySales.length + 1;
    return `SALE-${year}${month}${day}-${String(nextNumber).padStart(3, '0')}`;
  },
});

// Crear una nueva venta
export const create = mutation({
  args: {
    saleNumber: v.string(),
    saleDate: v.number(),
    customerName: v.string(),
    customerNumber: v.string(),
    customerAddress: v.string(),
    shippingCost: v.number(),
    salesChannel: v.string(),
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
    subtotalAmount: v.number(),
    discountAmount: v.number(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("sales", {
      saleNumber: args.saleNumber,
      saleDate: args.saleDate,
      customerName: args.customerName,
      customerNumber: args.customerNumber,
      customerAddress: args.customerAddress,
      shippingCost: args.shippingCost,
      salesChannel: args.salesChannel,
      products: args.products,
      subtotalAmount: args.subtotalAmount,
      discountAmount: args.discountAmount,
      totalAmount: args.totalAmount,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Actualizar una venta
export const update = mutation({
  args: {
    id: v.id("sales"),
    saleNumber: v.string(),
    saleDate: v.number(),
    customerName: v.string(),
    customerNumber: v.string(),
    customerAddress: v.string(),
    shippingCost: v.number(),
    salesChannel: v.string(),
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
    subtotalAmount: v.number(),
    discountAmount: v.number(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.patch(args.id, {
      saleNumber: args.saleNumber,
      saleDate: args.saleDate,
      customerName: args.customerName,
      customerNumber: args.customerNumber,
      customerAddress: args.customerAddress,
      shippingCost: args.shippingCost,
      salesChannel: args.salesChannel,
      products: args.products,
      subtotalAmount: args.subtotalAmount,
      discountAmount: args.discountAmount,
      totalAmount: args.totalAmount,
      updatedAt: now,
    });
  },
});

// Eliminar una venta
export const remove = mutation({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});