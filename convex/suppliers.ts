import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtener todos los proveedores ordenados por fecha de creación (con límite)
export const getAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db.query("suppliers")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

// Obtener un proveedor por ID
export const getById = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Buscar proveedores por nombre
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let suppliers;
    
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchTerm = args.searchTerm.trim();
      
      // Buscar por nombre (búsqueda parcial)
      const allSuppliers = await ctx.db.query("suppliers").collect();
      suppliers = allSuppliers
        .filter(supplier => 
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, limit);
    } else {
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
    }
    
    return suppliers;
  },
});

// Crear un nuevo proveedor
export const create = mutation({
  args: {
    name: v.string(),
    number: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("suppliers", {
      name: args.name,
      number: args.number,
      createdAt: now,
    });
  },
});

// Actualizar un proveedor
export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.string(),
    number: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      name: args.name,
      number: args.number,
    });
  },
});

// Eliminar un proveedor
export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
