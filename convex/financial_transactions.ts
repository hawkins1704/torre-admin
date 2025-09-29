import type { PaginationOptions } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Función auxiliar para generar número de transacción
function generateTransactionNumber(type: "income" | "expense"): string {
  const prefix = type === "income" ? "ING" : "GAS";
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

// Obtener todas las transacciones financieras (paginado)
export const getAll = query({
  args: {
    paginationOpts: v.optional(v.object({
      cursor: v.optional(v.string()),
      numItems: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 50 };
    
    return await ctx.db.query("financial_transactions")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(paginationOpts as PaginationOptions);
  },
});

// Obtener una transacción por ID
export const getById = query({
  args: { id: v.id("financial_transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Buscar transacciones por descripción
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let transactions;
    
    if (args.searchTerm && args.searchTerm.trim()) {
      const searchTerm = args.searchTerm.trim().toLowerCase();
      const allTransactions = await ctx.db.query("financial_transactions").collect();
      
      transactions = allTransactions
        .filter(transaction => 
          transaction.description.toLowerCase().includes(searchTerm) ||
          transaction.transactionNumber.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);
    } else {
      transactions = await ctx.db
        .query("financial_transactions")
        .withIndex("by_created_at")
        .order("desc")
        .take(limit);
    }
    
    // Filtrar por tipo si se especifica
    if (args.type) {
      transactions = transactions.filter(transaction => transaction.type === args.type);
    }
    
    return transactions;
  },
});

// Obtener métricas por mes y año
export const getMetricsByMonth = query({
  args: {
    month: v.number(), // 1-12
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
    const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();
    
    const transactions = await ctx.db
      .query("financial_transactions")
      .withIndex("by_date")
      .filter(q => 
        q.and(
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .collect();
    
    const incomeTransactions = transactions.filter(t => t.type === "income");
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      transactions: transactions.sort((a, b) => b.date - a.date),
    };
  },
});

// Crear nueva transacción financiera
export const create = mutation({
  args: {
    type: v.union(v.literal("income"), v.literal("expense")),
    description: v.string(),
    amount: v.number(),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const transactionDate = args.date || now;
    
    const transactionNumber = generateTransactionNumber(args.type);
    
    return await ctx.db.insert("financial_transactions", {
      transactionNumber,
      date: transactionDate,
      type: args.type,
      description: args.description,
      amount: args.amount,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Actualizar transacción financiera
export const update = mutation({
  args: {
    id: v.id("financial_transactions"),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const updateData: {
      type?: "income" | "expense";
      description?: string;
      amount?: number;
      date?: number;
      transactionNumber?: string;
      updatedAt: number;
    } = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    // Si cambia el tipo, generar nuevo número de transacción
    if (updates.type) {
      const currentTransaction = await ctx.db.get(id);
      if (currentTransaction && currentTransaction.type !== updates.type) {
        updateData.transactionNumber = generateTransactionNumber(updates.type);
      }
    }
    
    return await ctx.db.patch(id, updateData);
  },
});

// Eliminar transacción financiera
export const remove = mutation({
  args: { id: v.id("financial_transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Obtener resumen de ingresos y gastos por mes (últimos 12 meses)
export const getMonthlySummary = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const summaries: Array<{
      month: number;
      year: number;
      monthName: string;
      totalIncome: number;
      totalExpenses: number;
      netIncome: number;
      incomeCount: number;
      expenseCount: number;
      transactions: Array<{
        _id: string;
        type: "income" | "expense";
        description: string;
        amount: number;
        date: number;
        transactionNumber: string;
        createdAt: number;
        updatedAt: number;
      }>;
    }> = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const startOfMonth = new Date(year, month - 1, 1).getTime();
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      
      const transactions = await ctx.db
        .query("financial_transactions")
        .withIndex("by_date")
        .filter(q => 
          q.and(
            q.gte(q.field("date"), startOfMonth),
            q.lte(q.field("date"), endOfMonth)
          )
        )
        .collect();
      
      const incomeTransactions = transactions.filter(t => t.type === "income");
      const expenseTransactions = transactions.filter(t => t.type === "expense");
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const metrics = {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
        transactions: transactions.sort((a, b) => b.date - a.date),
      };
      
      summaries.push({
        month,
        year,
        monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        ...metrics,
      });
    }
    
    return summaries.reverse(); // Más antiguo a más reciente
  },
});
