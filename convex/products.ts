import type { PaginationOptions } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Función auxiliar para calcular stock total desde stockByVariation
function calculateTotalStock(stockByVariation: Record<string, Record<string, number>> | null | undefined): number {
  if (!stockByVariation) return 0;
  
  let total = 0;
  for (const variationName in stockByVariation) {
    const variation = stockByVariation[variationName];
    for (const value in variation) {
      total += variation[value] || 0;
    }
  }
  return total;
}

// Función auxiliar para actualizar stock por variación
function updateStockByVariation(
  currentStock: Record<string, Record<string, number>> | null | undefined, 
  variations: Array<{name: string, value: string, quantity: number}>, 
  operation: 'add' | 'subtract'
): Record<string, Record<string, number>> {
  const newStock = currentStock ? { ...currentStock } : {};
  
  for (const variation of variations) {
    const { name, value, quantity } = variation;
    
    if (!newStock[name]) {
      newStock[name] = {};
    }
    
    const currentValue = newStock[name][value] || 0;
    const change = operation === 'add' ? quantity : -quantity;
    newStock[name][value] = Math.max(0, currentValue + change);
  }
  
  return newStock;
}

// Obtener todos los productos con información de categoría (paginado)
export const getAll = query({
  args: {
    paginationOpts: v.optional(v.object({
      cursor: v.optional(v.string()),
      numItems: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 50 };
    
    const productsPage = await ctx.db.query("products")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(paginationOpts as PaginationOptions);
    
    // Obtener información de categorías usando batch get (más eficiente)
    const categoryIds = [...new Set(productsPage.page.map(p => p.categoryId))];
    const categories = await Promise.all(
      categoryIds.map(id => ctx.db.get(id as Id<"categories">))
    );
    const categoryMap = new Map(
      categories.filter(Boolean).map(cat => [cat!._id, cat])
    );
    
    const productsWithCategories = productsPage.page.map(product => ({
      ...product,
      category: categoryMap.get(product.categoryId),
    }));
    
    return {
      products: productsWithCategories,
      isDone: productsPage.isDone,
      continueCursor: productsPage.continueCursor,
    };
  },
});

// Obtener productos por categoría (con límite)
export const getByCategory = query({
  args: { 
    categoryId: v.id("categories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    const products = await ctx.db.query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(limit);
    
    const category = await ctx.db.get(args.categoryId);
    
    return products.map(product => ({
      ...product,
      category: category,
    }));
  },
});

// Obtener un producto por ID
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    
    const category = await ctx.db.get(product.categoryId);
    return {
      ...product,
      category: category,
    };
  },
});

// Crear un nuevo producto con cálculos automáticos
export const create = mutation({
  args: {
    // Campos de entrada
    code: v.string(),
    name: v.string(),
    age: v.string(),
    categoryId: v.id("categories"),
    cost: v.number(),
    packaging: v.number(),
    profitPercentage: v.number(),
    gatewayCommission: v.number(),
    igv: v.number(),
    imageId: v.optional(v.id("_storage")),
    variations: v.optional(v.array(v.object({
      name: v.string(),
      values: v.array(v.string()),
    }))),
    stock: v.optional(v.number()),
    stockByVariation: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Cálculos automáticos
    const totalCost = args.cost + args.packaging;
    const profitAmount = totalCost * (args.profitPercentage / 100);
    const desiredNetIncome = totalCost + profitAmount;
    
    // Precio con pasarela
    const priceWithoutIgv = desiredNetIncome / (1 - args.gatewayCommission / 100);
    const priceWithIgv = priceWithoutIgv + args.igv;
    const finalPrice = Math.ceil(priceWithIgv);
    
    // Precio sin pasarela (comisión = 0%)
    const priceWithoutGateway = desiredNetIncome + args.igv;
    const finalPriceWithoutGateway = Math.ceil(priceWithoutGateway);
    
    // Manejo del stock
    let stock = args.stock || 0;
    const stockByVariation = args.stockByVariation;
    
    // Solo calcular automáticamente si hay datos reales en stockByVariation
    if (stockByVariation && Object.keys(stockByVariation).length > 0) {
      stock = calculateTotalStock(stockByVariation);
    }
    
    return await ctx.db.insert("products", {
      // Campos de entrada
      code: args.code,
      name: args.name,
      age: args.age,
      categoryId: args.categoryId,
      cost: args.cost,
      packaging: args.packaging,
      profitPercentage: args.profitPercentage,
      gatewayCommission: args.gatewayCommission,
      igv: args.igv,
      imageId: args.imageId,
      variations: args.variations,
      stock,
      stockByVariation,
      
      // Campos calculados
      totalCost,
      profitAmount,
      desiredNetIncome,
      priceWithoutIgv,
      priceWithIgv,
      finalPrice,
      priceWithoutGateway,
      finalPriceWithoutGateway,
      
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Actualizar un producto
export const update = mutation({
  args: {
    id: v.id("products"),
    // Campos de entrada
    code: v.string(),
    name: v.string(),
    age: v.string(),
    categoryId: v.id("categories"),
    cost: v.number(),
    packaging: v.number(),
    profitPercentage: v.number(),
    gatewayCommission: v.number(),
    igv: v.number(),
    imageId: v.optional(v.id("_storage")),
    variations: v.optional(v.array(v.object({
      name: v.string(),
      values: v.array(v.string()),
    }))),
    stock: v.optional(v.number()),
    stockByVariation: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Recalcular todos los campos
    const totalCost = args.cost + args.packaging;
    const profitAmount = totalCost * (args.profitPercentage / 100);
    const desiredNetIncome = totalCost + profitAmount;
    
    // Precio con pasarela
    const priceWithoutIgv = desiredNetIncome / (1 - args.gatewayCommission / 100);
    const priceWithIgv = priceWithoutIgv + args.igv;
    const finalPrice = Math.ceil(priceWithIgv);
    
    // Precio sin pasarela
    const priceWithoutGateway = desiredNetIncome + args.igv;
    const finalPriceWithoutGateway = Math.ceil(priceWithoutGateway);
    
    // Manejo del stock
    let stock = args.stock;
    const stockByVariation = args.stockByVariation;
    
    // Solo calcular automáticamente si hay datos reales en stockByVariation
    if (stockByVariation && Object.keys(stockByVariation).length > 0) {
      stock = calculateTotalStock(stockByVariation);
    }
    
    return await ctx.db.patch(args.id, {
      // Campos de entrada
      code: args.code,
      name: args.name,
      age: args.age,
      categoryId: args.categoryId,
      cost: args.cost,
      packaging: args.packaging,
      profitPercentage: args.profitPercentage,
      gatewayCommission: args.gatewayCommission,
      igv: args.igv,
      imageId: args.imageId,
      variations: args.variations,
      stock,
      stockByVariation,
      
      // Campos calculados
      totalCost,
      profitAmount,
      desiredNetIncome,
      priceWithoutIgv,
      priceWithIgv,
      finalPrice,
      priceWithoutGateway,
      finalPriceWithoutGateway,
      
      updatedAt: now,
    });
  },
});

// Eliminar un producto
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Buscar productos por texto y filtros
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Si hay término de búsqueda, usar ambos searchIndex
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchTerm = args.searchTerm.trim();
      
      // Buscar por nombre
      const searchByName = ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => {
          let searchQuery = q.search("name", searchTerm);
          if (args.categoryId) {
            searchQuery = searchQuery.eq("categoryId", args.categoryId);
          }
          return searchQuery;
        })
        .take(limit);
      
      // Buscar por código
      const searchByCode = ctx.db
        .query("products")
        .withSearchIndex("search_products_by_code", (q) => {
          let searchQuery = q.search("code", searchTerm);
          if (args.categoryId) {
            searchQuery = searchQuery.eq("categoryId", args.categoryId);
          }
          return searchQuery;
        })
        .take(limit);
      
      // Ejecutar ambas búsquedas en paralelo
      const [resultsByName, resultsByCode] = await Promise.all([
        searchByName,
        searchByCode
      ]);
      
      // Combinar resultados y eliminar duplicados
      const allResults = [...resultsByName, ...resultsByCode];
      const uniqueResults = allResults.filter((product, index, self) => 
        index === self.findIndex(p => p._id === product._id)
      );
      
      // Obtener información de categorías
      const categoryIds = [...new Set(uniqueResults.map(p => p.categoryId))];
      const categories = await Promise.all(
        categoryIds.map(id => ctx.db.get(id as Id<"categories">))
      );
      const categoryMap = new Map(
        categories.filter(Boolean).map(cat => [cat!._id, cat])
      );
      
      return uniqueResults.map(product => ({
        ...product,
        category: categoryMap.get(product.categoryId),
      }));
    }
    
    // Si no hay término de búsqueda, usar filtros normales
    let products;
    if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .take(limit);
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
    }
    
    // Obtener información de categorías
    const categoryIds = [...new Set(products.map(p => p.categoryId))];
    const categories = await Promise.all(
      categoryIds.map(id => ctx.db.get(id as Id<"categories">))
    );
    const categoryMap = new Map(
      categories.filter(Boolean).map(cat => [cat!._id, cat])
    );
    
    return products.map(product => ({
      ...product,
      category: categoryMap.get(product.categoryId),
    }));
  },
});

// Generar URL de upload para imágenes
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Actualizar imagen de un producto
export const updateProductImage = mutation({
  args: {
    productId: v.id("products"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verificar que el producto existe
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    
    // Actualizar el producto con la nueva imagen
    await ctx.db.patch(args.productId, {
      imageId: args.storageId,
      updatedAt: now,
    });
    
    return args.productId;
  },
});

// Eliminar imagen de un producto
export const removeProductImage = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verificar que el producto existe
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    
    // Eliminar la imagen del storage si existe
    if (product.imageId) {
      await ctx.storage.delete(product.imageId);
    }
    
    // Actualizar el producto removiendo la referencia a la imagen
    await ctx.db.patch(args.productId, {
      imageId: undefined,
      updatedAt: now,
    });
    
    return args.productId;
  },
});

// Obtener URL de una imagen
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Actualizar stock de un producto (para órdenes)
export const updateStockFromOrder = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    variations: v.optional(v.array(v.object({
      name: v.string(),
      value: v.string(),
      quantity: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    
    const now = Date.now();
    let newStock = product.stock + args.quantity;
    let newStockByVariation = product.stockByVariation;
    
    // Si hay variaciones, actualizar stock por variación
    if (args.variations && args.variations.length > 0) {
      // Determinar la operación basada en el signo de la cantidad
      const operation = args.quantity >= 0 ? 'add' : 'subtract';
      newStockByVariation = updateStockByVariation(
        product.stockByVariation,
        args.variations,
        operation
      );
      // Recalcular stock total
      newStock = calculateTotalStock(newStockByVariation);
    }
    
    return await ctx.db.patch(args.productId, {
      stock: newStock,
      stockByVariation: newStockByVariation,
      updatedAt: now,
    });
  },
});

// Actualizar stock de un producto (para ventas)
export const updateStockFromSale = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    variations: v.optional(v.array(v.object({
      name: v.string(),
      value: v.string(),
      quantity: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }
    
    // Validar que hay suficiente stock
    if (product.stock < args.quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${args.quantity}`);
    }
    
    // Si hay variaciones, validar stock por variación
    if (args.variations && args.variations.length > 0) {
      for (const variation of args.variations) {
        const currentStock = product.stockByVariation?.[variation.name]?.[variation.value] || 0;
        if (currentStock < variation.quantity) {
          throw new Error(`Stock insuficiente para ${variation.name}: ${variation.value}. Disponible: ${currentStock}, Solicitado: ${variation.quantity}`);
        }
      }
    }
    
    const now = Date.now();
    let newStock = product.stock - args.quantity;
    let newStockByVariation = product.stockByVariation;
    
    // Si hay variaciones, actualizar stock por variación
    if (args.variations && args.variations.length > 0) {
      newStockByVariation = updateStockByVariation(
        product.stockByVariation,
        args.variations,
        'subtract'
      );
      // Recalcular stock total
      newStock = calculateTotalStock(newStockByVariation);
    }
    
    return await ctx.db.patch(args.productId, {
      stock: newStock,
      stockByVariation: newStockByVariation,
      updatedAt: now,
    });
  },
});

// Validar stock antes de una venta
export const validateStockForSale = query({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    variations: v.optional(v.array(v.object({
      name: v.string(),
      value: v.string(),
      quantity: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return { valid: false, error: "Producto no encontrado" };
    }
    
    // Validar stock total
    if (product.stock < args.quantity) {
      return { 
        valid: false, 
        error: `Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${args.quantity}`,
        availableStock: product.stock,
        requestedStock: args.quantity
      };
    }
    
    // Si hay variaciones, validar stock por variación
    if (args.variations && args.variations.length > 0) {
      for (const variation of args.variations) {
        const currentStock = product.stockByVariation?.[variation.name]?.[variation.value] || 0;
        if (currentStock < variation.quantity) {
          return { 
            valid: false, 
            error: `Stock insuficiente para ${variation.name}: ${variation.value}. Disponible: ${currentStock}, Solicitado: ${variation.quantity}`,
            availableStock: currentStock,
            requestedStock: variation.quantity,
            variation: variation
          };
        }
      }
    }
    
    return { valid: true };
  },
});

// ===== FUNCIONES PARA DASHBOARD =====

// Obtener estado del inventario
export const getInventoryStatus = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.totalCost), 0);
    const totalProducts = products.length;
    
    return {
      totalProducts,
      totalInventoryValue,
      lowStockProducts: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        code: p.code,
        stock: p.stock,
        category: p.categoryId, // Se puede expandir para obtener nombre de categoría
      })),
      outOfStockProducts: outOfStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        code: p.code,
        category: p.categoryId,
      })),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    };
  },
});
