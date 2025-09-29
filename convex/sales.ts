import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
    
    // Validar stock de todos los productos antes de crear la venta
    for (const productSale of args.products) {
      const stockValidation = await ctx.runQuery(api.products.validateStockForSale, {
        productId: productSale.productId,
        quantity: productSale.quantity,
        variations: productSale.variations,
      });
      
      if (!stockValidation.valid) {
        throw new Error(stockValidation.error);
      }
    }
    
    // Crear la venta
    const saleId = await ctx.db.insert("sales", {
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
    
    // Actualizar stock de cada producto
    for (const productSale of args.products) {
      await ctx.runMutation(api.products.updateStockFromSale, {
        productId: productSale.productId,
        quantity: productSale.quantity,
        variations: productSale.variations,
      });
    }
    
    return saleId;
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
    
    // Obtener la venta actual para comparar productos
    const currentSale = await ctx.db.get(args.id);
    if (!currentSale) {
      throw new Error("Venta no encontrada");
    }
    
    // Revertir stock de productos anteriores
    for (const productSale of currentSale.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productSale.productId,
        quantity: productSale.quantity, // Sumar stock (revertir venta)
        variations: productSale.variations,
      });
    }
    
    // Validar stock de productos nuevos
    for (const productSale of args.products) {
      const stockValidation = await ctx.runQuery(api.products.validateStockForSale, {
        productId: productSale.productId,
        quantity: productSale.quantity,
        variations: productSale.variations,
      });
      
      if (!stockValidation.valid) {
        // Revertir cambios si hay error
        for (const productSale of currentSale.products) {
          await ctx.runMutation(api.products.updateStockFromSale, {
            productId: productSale.productId,
            quantity: productSale.quantity,
            variations: productSale.variations,
          });
        }
        throw new Error(stockValidation.error);
      }
    }
    
    // Aplicar stock de productos nuevos
    for (const productSale of args.products) {
      await ctx.runMutation(api.products.updateStockFromSale, {
        productId: productSale.productId,
        quantity: productSale.quantity,
        variations: productSale.variations,
      });
    }
    
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
    // Obtener la venta antes de eliminarla
    const sale = await ctx.db.get(args.id);
    if (!sale) {
      throw new Error("Venta no encontrada");
    }
    
    // Revertir stock de productos
    for (const productSale of sale.products) {
      await ctx.runMutation(api.products.updateStockFromOrder, {
        productId: productSale.productId,
        quantity: productSale.quantity, // Sumar stock (revertir venta)
        variations: productSale.variations,
      });
    }
    
    return await ctx.db.delete(args.id);
  },
});

// ===== FUNCIONES PARA DASHBOARD =====

// Obtener métricas de ventas por mes
export const getSalesMetricsByMonth = query({
  args: {
    month: v.number(), // 1-12
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();
    
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_created_at")
      .filter(q => 
        q.and(
          q.gte(q.field("saleDate"), startOfMonth),
          q.lte(q.field("saleDate"), endOfMonth)
        )
      )
      .collect();
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalShippingCost = sales.reduce((sum, sale) => sum + sale.shippingCost, 0);
    const totalDiscounts = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);
    
    return {
      totalSales,
      totalShippingCost,
      totalDiscounts,
      salesCount: sales.length,
      averageSaleAmount: sales.length > 0 ? totalSales / sales.length : 0,
      sales: sales.sort((a, b) => b.saleDate - a.saleDate),
    };
  },
});

// Obtener ventas por canal
export const getSalesByChannel = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();
    
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_created_at")
      .filter(q => 
        q.and(
          q.gte(q.field("saleDate"), startOfMonth),
          q.lte(q.field("saleDate"), endOfMonth)
        )
      )
      .collect();
    
    const channelStats: Record<string, { amount: number; count: number }> = {};
    
    sales.forEach(sale => {
      if (!channelStats[sale.salesChannel]) {
        channelStats[sale.salesChannel] = { amount: 0, count: 0 };
      }
      channelStats[sale.salesChannel].amount += sale.totalAmount;
      channelStats[sale.salesChannel].count += 1;
    });
    
    return Object.entries(channelStats).map(([channel, stats]) => ({
      channel,
      amount: stats.amount,
      count: stats.count,
      percentage: sales.length > 0 ? (stats.count / sales.length) * 100 : 0,
    }));
  },
});

// Obtener top productos más vendidos
export const getTopSellingProducts = query({
  args: {
    month: v.number(),
    year: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();
    
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_created_at")
      .filter(q => 
        q.and(
          q.gte(q.field("saleDate"), startOfMonth),
          q.lte(q.field("saleDate"), endOfMonth)
        )
      )
      .collect();
    
    const productStats: Record<string, { 
      productId: string; 
      quantity: number; 
      amount: number; 
      name: string;
      code: string;
    }> = {};
    
    // Procesar todas las ventas y agregar productos
    for (const sale of sales) {
      for (const productSale of sale.products) {
        const product = await ctx.db.get(productSale.productId);
        if (product) {
          const key = product._id;
          if (!productStats[key]) {
            productStats[key] = {
              productId: product._id,
              quantity: 0,
              amount: 0,
              name: product.name,
              code: product.code,
            };
          }
          productStats[key].quantity += productSale.quantity;
          productStats[key].amount += productSale.totalPrice;
        }
      }
    }
    
    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  },
});

// Obtener top productos más rentables (por margen de ganancia)
export const getTopProfitableProducts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    
    // Obtener todos los productos
    const products = await ctx.db.query("products").collect();
    
    // Ordenar por margen de ganancia (profitPercentage) y tomar los top
    const topProfitableProducts = products
      .map(product => ({
        productId: product._id,
        name: product.name,
        code: product.code,
        profitPercentage: product.profitPercentage,
        finalPrice: product.finalPrice,
        totalCost: product.totalCost,
        profitAmount: product.profitAmount,
        stock: product.stock,
      }))
      .sort((a, b) => b.profitPercentage - a.profitPercentage)
      .slice(0, limit);
    
    return topProfitableProducts;
  },
});

// Obtener métricas completas del dashboard
export const getDashboardMetrics = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Calcular fechas del mes una sola vez
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();
    
    // Obtener métricas de ventas
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_created_at")
      .filter(q => 
        q.and(
          q.gte(q.field("saleDate"), startOfMonth),
          q.lte(q.field("saleDate"), endOfMonth)
        )
      )
      .collect();
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalShippingCost = sales.reduce((sum, sale) => sum + sale.shippingCost, 0);
    const totalDiscounts = sales.reduce((sum, sale) => sum + sale.discountAmount, 0);
    
    const salesMetrics = {
      totalSales,
      totalShippingCost,
      totalDiscounts,
      salesCount: sales.length,
      averageSaleAmount: sales.length > 0 ? totalSales / sales.length : 0,
      sales: sales.sort((a, b) => b.saleDate - a.saleDate),
    };
    
    // Obtener métricas financieras adicionales
    const financialMetrics: {
      totalIncome: number;
      totalExpenses: number;
      netIncome: number;
      incomeCount: number;
      expenseCount: number;
    } = await ctx.runQuery(api.financial_transactions.getMetricsByMonth, args);
    
    // Obtener métricas de órdenes (gastos de productos)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_created_at")
      .filter(q => 
        q.and(
          q.gte(q.field("orderDate"), startOfMonth),
          q.lte(q.field("orderDate"), endOfMonth)
        )
      )
      .collect();
    
    const totalOrderCosts = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calcular totales
    const totalIncome = salesMetrics.totalSales + financialMetrics.totalIncome;
    const totalExpenses = totalOrderCosts + salesMetrics.totalShippingCost + financialMetrics.totalExpenses;
    const netProfit = totalIncome - totalExpenses;
    
    const result: {
      salesIncome: number;
      additionalIncome: number;
      totalIncome: number;
      productCosts: number;
      shippingCosts: number;
      additionalExpenses: number;
      totalExpenses: number;
      netProfit: number;
      profitMargin: number;
      salesCount: number;
      ordersCount: number;
      incomeTransactionsCount: number;
      expenseTransactionsCount: number;
      previousMonth: number;
      previousYear: number;
    } = {
      // Ingresos
      salesIncome: salesMetrics.totalSales,
      additionalIncome: financialMetrics.totalIncome,
      totalIncome,
      
      // Gastos
      productCosts: totalOrderCosts,
      shippingCosts: salesMetrics.totalShippingCost,
      additionalExpenses: financialMetrics.totalExpenses,
      totalExpenses,
      
      // Ganancia
      netProfit,
      profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
      
      // Contadores
      salesCount: salesMetrics.salesCount,
      ordersCount: orders.length,
      incomeTransactionsCount: financialMetrics.incomeCount,
      expenseTransactionsCount: financialMetrics.expenseCount,
      
      // Comparación con mes anterior
      previousMonth: args.month > 1 ? args.month - 1 : 12,
      previousYear: args.month > 1 ? args.year : args.year - 1,
    };

    return result;
  },
});