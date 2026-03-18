// ============================================================================
// Chat Router - Streaming AI chat with SSE
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";
import type { H3Event } from "h3";

import { protectedProcedure, publicProcedure } from "../index";
import { conversations, messages, agents, usageLogs } from "@my-ai-stack/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createAIService,
  type ModelProvider,
  type ModelName,
} from "@my-ai-stack/ai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

// Chat input schema
const chatInputSchema = z.object({
  conversationId: z.string().optional(),
  agentId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool", "data"]),
      content: z.string(),
      toolInvocations: z
        .array(
          z.object({
            toolCallId: z.string(),
            toolName: z.string(),
            args: z.record(z.unknown()),
            result: z.unknown().optional(),
          })
        )
        .optional(),
    })
  ),
  stream: z.boolean().default(true),
});

// Chat response types
interface StreamChunk {
  type: "text" | "error" | "done";
  content: string;
}

// Helper to get database from event
function getDb(event: H3Event) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (event as any).context.db || globalThis.__db;
}

export const chatRouter = {
  // Stream chat completion
  stream: protectedProcedure
    .input(chatInputSchema)
    .handler(async ({ input, context, event }) => {
      const userId = context.session!.user.id;
      const startTime = Date.now();

      // Get or create conversation
      let conversationId = input.conversationId;

      if (!conversationId && input.agentId) {
        // Create new conversation
        const newId = `conv_${nanoid(16)}`;
        const [conversation] = await context.db
          .insert(conversations)
          .values({
            id: newId,
            userId,
            agentId: input.agentId,
            title: input.messages[0]?.content.slice(0, 100) || "New Chat",
          })
          .returning();

        conversationId = conversation.id;
      }

      if (!conversationId) {
        throw new Error("Conversation ID or Agent ID required");
      }

      // Get agent config
      let agentConfig = null;
      if (input.agentId) {
        const [agent] = await context.db
          .select()
          .from(agents)
          .where(and(eq(agents.id, input.agentId), eq(agents.userId, userId)))
          .limit(1);

        if (agent) {
          agentConfig = agent;
        }
      }

      // Create AI service
      const provider = (agentConfig?.modelProvider as ModelProvider) || "anthropic";
      const model = (agentConfig?.modelName as ModelName) || "claude-3-5-sonnet-20241022";

      const aiService = createAIService(provider, model, {
        temperature: parseFloat(agentConfig?.temperature || "0.7"),
        maxTokens: agentConfig?.maxTokens || 4096,
        systemPrompt: agentConfig?.systemPrompt || undefined,
      });

      // Convert messages to AI SDK format
      const uiMessages: UIMessage[] = input.messages.map((m) => {
        const msg: UIMessage = {
          role: m.role,
          content: m.content,
        };
        return msg;
      });

      const modelMessages = convertToModelMessages(uiMessages);

      // Save user message to database
      const userMessageId = `msg_${nanoid(16)}`;
      const userMessage = input.messages[input.messages.length - 1];

      if (userMessage?.role === "user") {
        await context.db.insert(messages).values({
          id: userMessageId,
          conversationId,
          role: "user",
          content: userMessage.content,
        });
      }

      // Stream the response
      const result = streamText({
        model: aiService["model"], // Access internal model
        messages: modelMessages,
        temperature: aiService["temperature"], // eslint-disable-line @typescript-eslint/no-explicit-any
        maxTokens: aiService["maxTokens"], // eslint-disable-line @typescript-eslint/no-explicit-any
      });

      // Collect response for storage
      let responseContent = "";

      // Set up SSE headers
      event.node.res.setHeader("Content-Type", "text/event-stream");
      event.node.res.setHeader("Cache-Control", "no-cache");
      event.node.res.setHeader("Connection", "keep-alive");
      event.node.res.setHeader("X-Accel-Buffering", "no");

      // Stream text
      for await (const chunk of result.textStream) {
        responseContent += chunk;

        const data = JSON.stringify({ type: "text", content: chunk });
        event.node.res.write(`data: ${data}\n\n`);
      }

      // Send done signal
      event.node.res.write("data: {\"type\":\"done\"}\n\n");

      // Save assistant message
      const assistantMessageId = `msg_${nanoid(16)}`;
      await context.db.insert(messages).values({
        id: assistantMessageId,
        conversationId,
        role: "assistant",
        content: responseContent,
      });

      // Log usage (estimate tokens)
      const estimatedTokens = Math.ceil(responseContent.length / 4);
      const estimatedCost = estimatedTokens * 0.000075; // Rough estimate

      await context.db.insert(usageLogs).values({
        id: `usage_${nanoid(12)}`,
        userId,
        agentId: input.agentId,
        conversationId,
        modelProvider: provider,
        modelName: model,
        promptTokens: Math.ceil((userMessage?.content.length || 0) / 4),
        completionTokens: estimatedTokens,
        totalTokens: Math.ceil((userMessage?.content.length || 0) / 4) + estimatedTokens,
        cost: String(estimatedCost),
        latency: Date.now() - startTime,
      });

      return {
        conversationId,
        messageId: assistantMessageId,
      };
    }),

  // Non-streaming chat
  chat: protectedProcedure
    .input(chatInputSchema)
    .output(
      z.object({
        message: z.string(),
        conversationId: z.string(),
        messageId: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session!.user.id;
      const startTime = Date.now();

      // Get or create conversation
      let conversationId = input.conversationId;

      if (!conversationId && input.agentId) {
        const newId = `conv_${nanoid(16)}`;
        const [conversation] = await context.db
          .insert(conversations)
          .values({
            id: newId,
            userId,
            agentId: input.agentId,
            title: input.messages[0]?.content.slice(0, 100) || "New Chat",
          })
          .returning();

        conversationId = conversation.id;
      }

      if (!conversationId) {
        throw new Error("Conversation ID or Agent ID required");
      }

      // Get agent config
      let agentConfig = null;
      if (input.agentId) {
        const [agent] = await context.db
          .select()
          .from(agents)
          .where(and(eq(agents.id, input.agentId), eq(agents.userId, userId)))
          .limit(1);

        if (agent) {
          agentConfig = agent;
        }
      }

      // Create AI service
      const provider = (agentConfig?.modelProvider as ModelProvider) || "anthropic";
      const model = (agentConfig?.modelName as ModelName) || "claude-3-5-sonnet-20241022";

      const aiService = createAIService(provider, model, {
        temperature: parseFloat(agentConfig?.temperature || "0.7"),
        maxTokens: agentConfig?.maxTokens || 4096,
        systemPrompt: agentConfig?.systemPrompt || undefined,
      });

      // Convert messages
      const uiMessages: UIMessage[] = input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const modelMessages = convertToModelMessages(uiMessages);

      // Generate response
      const result = await aiService.generate(modelMessages);

      // Save messages
      const userMessage = input.messages[input.messages.length - 1];
      if (userMessage?.role === "user") {
        await context.db.insert(messages).values({
          id: `msg_${nanoid(16)}`,
          conversationId,
          role: "user",
          content: userMessage.content,
        });
      }

      const assistantMessageId = `msg_${nanoid(16)}`;
      await context.db.insert(messages).values({
        id: assistantMessageId,
        conversationId,
        role: "assistant",
        content: result.message,
        metadata: {
          modelProvider: result.metadata?.modelProvider,
          modelName: result.metadata?.modelName,
          promptTokens: result.metadata?.promptTokens,
          completionTokens: result.metadata?.completionTokens,
          totalTokens: result.metadata?.totalTokens,
          cost: result.metadata?.cost,
          latency: result.metadata?.latency,
        },
      });

      // Log usage
      await context.db.insert(usageLogs).values({
        id: `usage_${nanoid(12)}`,
        userId,
        agentId: input.agentId,
        conversationId,
        modelProvider: provider,
        modelName: model,
        promptTokens: result.metadata?.promptTokens || 0,
        completionTokens: result.metadata?.completionTokens || 0,
        totalTokens: result.metadata?.totalTokens || 0,
        cost: String(result.metadata?.cost || 0),
        latency: Date.now() - startTime,
      });

      return {
        message: result.message,
        conversationId,
        messageId: assistantMessageId,
      };
    }),
};