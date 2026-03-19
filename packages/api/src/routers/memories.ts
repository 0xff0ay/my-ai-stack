// ============================================================================
// Memories Router - Vector search and memory management
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure } from "../index";
import { memory } from "@my-ai-stack/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Memory creation input
const createMemorySchema = z.object({
  agentId: z.string(),
  content: z.string().min(1).max(10000),
  type: z.enum(["short_term", "long_term", "episodic", "semantic", "working"]).default("long_term"),
  category: z.string().optional(),
  importance: z.number().min(0).max(1).default(0.5),
  tags: z.array(z.string()).default([]),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Memory search input
const searchMemorySchema = z.object({
  agentId: z.string(),
  query: z.string(),
  type: z.enum(["short_term", "long_term", "episodic", "semantic", "working"]).optional(),
  limit: z.number().min(1).max(50).default(10),
  minScore: z.number().min(0).max(1).default(0.7),
});

// Memory update input
const updateMemorySchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  importance: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const memoriesRouter = {
  // Create a new memory
  create: protectedProcedure
    .input(createMemorySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newMemory = {
        id: nanoid(),
        userId,
        ...input,
        accessCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(memory).values(newMemory).returning();
      return created;
    }),

  // List memories for an agent
  list: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      type: z.enum(["short_term", "long_term", "episodic", "semantic", "working"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const conditions = [
        eq(memory.userId, userId),
        eq(memory.agentId, input.agentId),
      ];
      
      if (input.type) {
        conditions.push(eq(memory.type, input.type));
      }
      
      const memories = await db
        .select()
        .from(memory)
        .where(and(...conditions))
        .orderBy(desc(memory.importance), desc(memory.createdAt))
        .limit(input.limit);
      
      return memories;
    }),

  // Search memories using vector similarity
  search: protectedProcedure
    .input(searchMemorySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Note: This requires pgvector and embeddings
      // In production, you'd generate embedding for the query first
      const memories = await db
        .select({
          ...memory,
          similarity: sql`1 - (embedding <=> ${input.query}::vector)`.as("similarity"),
        })
        .from(memory)
        .where(and(
          eq(memory.userId, userId),
          eq(memory.agentId, input.agentId),
          input.type ? eq(memory.type, input.type) : undefined,
        ))
        .orderBy(sql`embedding <=> ${input.query}::vector`)
        .limit(input.limit);
      
      return memories.filter((m: { similarity: number }) => m.similarity >= input.minScore);
    }),

  // Get a single memory
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [mem] = await db
        .select()
        .from(memory)
        .where(and(eq(memory.id, input.id), eq(memory.userId, userId)))
        .limit(1);
      
      if (!mem) {
        throw new Error("Memory not found");
      }
      
      // Update access count
      await db
        .update(memory)
        .set({
          accessCount: sql`${memory.accessCount} + 1`,
          lastAccessedAt: new Date(),
        })
        .where(eq(memory.id, input.id));
      
      return mem;
    }),

  // Update a memory
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateMemorySchema,
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(memory)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(memory.id, input.id), eq(memory.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Memory not found");
      }
      
      return updated;
    }),

  // Delete a memory
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [deleted] = await db
        .delete(memory)
        .where(and(eq(memory.id, input.id), eq(memory.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Memory not found");
      }
      
      return { success: true };
    }),

  // Consolidate memories (combine similar memories)
  consolidate: protectedProcedure
    .input(z.object({
      memoryIds: z.array(z.string()).min(2),
      consolidatedContent: z.string(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Create new consolidated memory
      const newMemory = await db.insert(memory).values({
        id: nanoid(),
        userId,
        agentId: "", // Will be set from first memory
        content: input.consolidatedContent,
        type: "long_term",
        isConsolidated: true,
        consolidatedFrom: input.memoryIds,
        importance: "0.8",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      // Optionally delete old memories or mark them
      // await db.delete(memory).where(inArray(memory.id, input.memoryIds));
      
      return newMemory[0];
    }),
};
