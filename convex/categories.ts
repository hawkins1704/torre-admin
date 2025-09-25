import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtener todas las categorías ordenadas por fecha de creación (con límite)
export const getAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db.query("categories")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

// Obtener una categoría por ID
export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Crear una nueva categoría
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      createdAt: now,
    });
  },
});

// Actualizar una categoría
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });
  },
});

// Eliminar una categoría
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
