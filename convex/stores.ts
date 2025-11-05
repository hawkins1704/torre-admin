import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Obtener todas las tiendas del usuario actual
export const getAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Usuario no autenticado");
    }

    const limit = args.limit || 50;
    
    return await ctx.db.query("stores")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(limit);
  },
});

// Obtener una tienda por ID (solo si el usuario es el dueño)
export const getById = query({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Usuario no autenticado");
    }

    const store = await ctx.db.get(args.id);
    if (!store) {
      return null;
    }

    // Verificar que el usuario sea el dueño
    if (store.ownerId !== userId) {
      throw new Error("No tienes permiso para acceder a esta tienda");
    }

    return store;
  },
});

// Crear una nueva tienda
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Usuario no autenticado");
    }

    const now = Date.now();
    return await ctx.db.insert("stores", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Actualizar una tienda (solo si el usuario es el dueño)
export const update = mutation({
  args: {
    id: v.id("stores"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar que el usuario sea el dueño
    const store = await ctx.db.get(args.id);
    if (!store) {
      throw new Error("Tienda no encontrada");
    }
    if (store.ownerId !== userId) {
      throw new Error("No tienes permiso para editar esta tienda");
    }

    const now = Date.now();
    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      updatedAt: now,
    });
  },
});

// Eliminar una tienda (solo si el usuario es el dueño)
export const remove = mutation({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar que el usuario sea el dueño
    const store = await ctx.db.get(args.id);
    if (!store) {
      throw new Error("Tienda no encontrada");
    }
    if (store.ownerId !== userId) {
      throw new Error("No tienes permiso para eliminar esta tienda");
    }

    return await ctx.db.delete(args.id);
  },
});

