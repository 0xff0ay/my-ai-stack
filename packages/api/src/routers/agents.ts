// ============================================================================
// Agents Router - CRUD operations for AI agents
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure, publicProcedure } from "../index";
import {
  agents,
  conversations,
  memories,
} from "@my-ai-stack/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Agent creation input
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  modelProvider: z
    .enum(["anthropic", "openai", "google", "ollama"])
    .default("anthropic"),
  modelName: z.string().default("claude-3-5-sonnet-20241022"),
  personality: z.record(z.unknown()).optional(),
  systemPrompt: z.string().max(10000).optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(100000).default(4096),
  tools: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

// Agent update input
const updateAgentSchema = createAgentSchema.partial();

// Agent query input
const agentQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Response types
const agentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  modelProvider: z.string(),
  modelName: z.string(),
  personality: z.unknown().nullable(),
  systemPrompt: z.string().nullable(),
  temperature: z.string(),
  maxTokens: z.number(),
  tools: z.unknown(),
  isPublic: z.boolean(),
  metadata: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Helper to convert DB row to response
function toAgentResponse(row: (typeof agents.$inferSelect)): z.infer<typeof agentResponseSchema> {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    modelProvider: row.modelProvider,
    modelName: row.modelName,
    personality: row.personality,
    systemPrompt: row.systemPrompt,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    tools: row.tools,
    isPublic: row.isPublic,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const agentsRouter = {
  // Create a new agent
  create: protectedProcedure
    .input(createAgentSchema)
    .output(agentResponseSchema)
    .handler(async ({ input, context }) => {
      const id = `agent_${nanoid(16)}`;

      const [agent] = await context.db
        .insert(agents)
        .values({
          id,
          userId: context.session!.user.id,
          name: input.name,
          description: input.description,
          modelProvider: input.modelProvider,
          modelName: input.modelName,
          personality: input.personality,
          systemPrompt: input.systemPrompt,
          temperature: String(input.temperature),
          maxTokens: input.maxTokens,
          tools: input.tools,
          isPublic: input.isPublic,
          metadata: input.metadata,
        })
        .returning();

      return toAgentResponse(agent);
    }),

  // Get agent by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(agentResponseSchema.nullable())
    .handler(async ({ input, context }) => {
      const [agent] = await context.db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, context.session!.user.id)
          )
        )
        .limit(1);

      return agent ? toAgentResponse(agent) : null;
    }),

  // List user's agents
  list: protectedProcedure
    .input(agentQuerySchema)
    .output(z.array(agentResponseSchema))
    .handler(async ({ input, context }) => {
      const query = context.db
        .select()
        .from(agents)
        .where(eq(agents.userId, context.session!.user.id))
        .orderBy(desc(agents.createdAt))
        .limit(input.limit);

      if (input.cursor) {
        // For cursor-based pagination
        query.where(
          and(
            eq(agents.userId, context.session!.user.id),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (agents.createdAt as any) < input.cursor
          )
        );
      }

      const results = await query;
      return results.map(toAgentResponse);
    }),

  // List public agents
  listPublic: publicProcedure
    .input(agentQuerySchema)
    .output(z.array(agentResponseSchema))
    .handler(async ({ input }) => {
      const results = await context.db
        .select()
        .from(agents)
        .where(eq(agents.isPublic, true))
        .orderBy(desc(agents.createdAt))
        .limit(input.limit);

      return results.map(toAgentResponse);
    }),

  // Update agent
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateAgentSchema,
      })
    )
    .output(agentResponseSchema)
    .handler(async ({ input, context }) => {
      const [agent] = await context.db
        .update(agents)
        .set({
          ...input.data,
          // Convert temperature to string for decimal field
          ...(input.data.temperature !== undefined && {
            temperature: String(input.data.temperature),
          }),
        })
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, context.session!.user.id)
          )
        )
        .returning();

      if (!agent) {
        throw new Error("Agent not found");
      }

      return toAgentResponse(agent);
    }),

  // Delete agent
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.boolean())
    .handler(async ({ input, context }) => {
      const result = await context.db
        .delete(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, context.session!.user.id)
          )
        )
        .returning({ id: agents.id });

      return result.length > 0;
    }),

  // Get agent statistics
  stats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        conversationCount: z.number(),
        memoryCount: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const [agent] = await context.db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, input.id),
            eq(agents.userId, context.session!.user.id)
          )
        )
        .limit(1);

      if (!agent) {
        throw new Error("Agent not found");
      }

      const conversationCount = await context.db
        .select({ count: conversations.id })
        .from(conversations)
        .where(eq(conversations.agentId, input.id));

      const memoryCount = await context.db
        .select({ count: memories.id })
        .from(memories)
        .where(eq(memories.agentId, input.id));

      return {
        conversationCount: conversationCount.length,
        memoryCount: memoryCount.length,
      };
    }),
};