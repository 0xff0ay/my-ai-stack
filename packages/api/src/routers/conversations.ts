// ============================================================================
// Conversations Router - Chat session management
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure, publicProcedure } from "../index";
import { conversations, messages, agents } from "@my-ai-stack/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Conversation creation input
const createConversationSchema = z.object({
  agentId: z.string().optional(),
  title: z.string().max(200).optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Conversation update input
const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  context: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Message input
const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Conversation query input
const conversationQuerySchema = z.object({
  agentId: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Response schemas
const conversationResponseSchema = z.object({
  id: z.string(),
  agentId: z.string().nullable(),
  userId: z.string(),
  title: z.string().nullable(),
  context: z.unknown().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messageCount: z.number().optional(),
});

const messageResponseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.string(),
  content: z.string(),
  name: z.string().nullable(),
  toolCallId: z.string().nullable(),
  toolName: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.date(),
});

// Helper to convert DB row to response
function toConversationResponse(
  row: (typeof conversations.$inferSelect) & { messageCount?: number }
): z.infer<typeof conversationResponseSchema> {
  return {
    id: row.id,
    agentId: row.agentId,
    userId: row.userId,
    title: row.title,
    context: row.context,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messageCount: row.messageCount,
  };
}

function toMessageResponse(row: (typeof messages.$inferSelect)): z.infer<typeof messageResponseSchema> {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    name: row.name,
    toolCallId: row.toolCallId,
    toolName: row.toolName,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

export const conversationsRouter = {
  // Create a new conversation
  create: protectedProcedure
    .input(createConversationSchema)
    .output(conversationResponseSchema)
    .handler(async ({ input, context }) => {
      const id = `conv_${nanoid(16)}`;
      const userId = context.session!.user.id;

      // Verify agent exists if provided
      if (input.agentId) {
        const [agent] = await context.db
          .select()
          .from(agents)
          .where(and(eq(agents.id, input.agentId), eq(agents.userId, userId)))
          .limit(1);

        if (!agent) {
          throw new Error("Agent not found");
        }
      }

      const [conversation] = await context.db
        .insert(conversations)
        .values({
          id,
          userId,
          agentId: input.agentId,
          title: input.title,
          context: input.context,
          metadata: input.metadata,
        })
        .returning();

      return toConversationResponse(conversation);
    }),

  // Get conversation by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(conversationResponseSchema.nullable())
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, input.id), eq(conversations.userId, userId)))
        .limit(1);

      if (!conversation) {
        return null;
      }

      // Get message count
      const [{ count }] = await context.db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(eq(messages.conversationId, input.id));

      return toConversationResponse({ ...conversation, messageCount: Number(count) });
    }),

  // List user's conversations
  list: protectedProcedure
    .input(conversationQuerySchema)
    .output(z.array(conversationResponseSchema))
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      const whereConditions = [eq(conversations.userId, userId)];

      if (input.agentId) {
        whereConditions.push(eq(conversations.agentId, input.agentId));
      }

      const results = await context.db
        .select()
        .from(conversations)
        .where(and(...whereConditions))
        .orderBy(desc(conversations.updatedAt))
        .limit(input.limit);

      // Get message counts for each conversation
      const conversationsWithCounts = await Promise.all(
        results.map(async (conv) => {
          const [{ count }] = await context.db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(eq(messages.conversationId, conv.id));

          return toConversationResponse({ ...conv, messageCount: Number(count) });
        })
      );

      return conversationsWithCounts;
    }),

  // Update conversation
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateConversationSchema,
      })
    )
    .output(conversationResponseSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      const [conversation] = await context.db
        .update(conversations)
        .set(input.data)
        .where(
          and(eq(conversations.id, input.id), eq(conversations.userId, userId))
        )
        .returning();

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return toConversationResponse(conversation);
    }),

  // Delete conversation
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.boolean())
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      const result = await context.db
        .delete(conversations)
        .where(
          and(eq(conversations.id, input.id), eq(conversations.userId, userId))
        )
        .returning({ id: conversations.id });

      return result.length > 0;
    }),

  // Add message to conversation
  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        message: createMessageSchema,
      })
    )
    .output(messageResponseSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      // Verify conversation belongs to user
      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, userId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const id = `msg_${nanoid(16)}`;

      const [message] = await context.db
        .insert(messages)
        .values({
          id,
          conversationId: input.conversationId,
          role: input.message.role,
          content: input.message.content,
          name: input.message.name,
          toolCallId: input.message.toolCallId,
          toolName: input.message.toolName,
          metadata: input.message.metadata,
        })
        .returning();

      // Update conversation's updatedAt
      await context.db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return toMessageResponse(message);
    }),

  // Get messages for conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        before: z.string().optional(),
      })
    )
    .output(z.array(messageResponseSchema))
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      // Verify conversation belongs to user
      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, userId)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const results = await context.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit);

      return results.map(toMessageResponse).reverse();
    }),

  // Clear conversation messages
  clear: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.boolean())
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;

      // Verify conversation belongs to user
      const [conversation] = await context.db
        .select()
        .from(conversations)
        .where(and(eq(conversations.id, input.id), eq(conversations.userId, userId)))
        .limit(1);

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Delete all messages
      await context.db
        .delete(messages)
        .where(eq(messages.conversationId, input.id));

      return true;
    }),
};