// ============================================================================
// Tools Router - Function calling and tool marketplace
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure, publicProcedure } from "../index";
import { tool, agentTool } from "@my-ai-stack/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Tool creation input
const createToolSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
  }),
  implementationType: z.enum(["code", "http", "plugin"]).default("code"),
  code: z.string().optional(),
  httpEndpoint: z.string().url().optional(),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]).default("POST"),
  httpHeaders: z.record(z.string()).optional(),
  timeout: z.number().min(1000).max(300000).default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
  rateLimitPerMinute: z.number().min(1).max(10000).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Tool update input
const updateToolSchema = createToolSchema.partial();

// Execute tool input
const executeToolSchema = z.object({
  toolId: z.string(),
  parameters: z.record(z.unknown()),
  timeout: z.number().min(1000).max(300000).optional(),
});

export const toolsRouter = {
  // Create a new tool
  create: protectedProcedure
    .input(createToolSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newTool = {
        id: nanoid(),
        userId,
        ...input,
        version: "1.0.0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(tool).values(newTool).returning();
      return created;
    }),

  // List tools (with marketplace filter)
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      category: z.string().optional(),
      isPublic: z.boolean().optional(),
      search: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session?.user?.id;
      
      let conditions = [eq(tool.status, "active")];
      
      if (input.isPublic !== undefined) {
        conditions.push(eq(tool.isPublic, input.isPublic));
      }
      
      if (input.category) {
        conditions.push(eq(tool.category, input.category));
      }
      
      // If user is logged in, show their tools + public tools
      // If not logged in, only show public tools
      if (userId) {
        conditions.push(sql`${tool.userId} = ${userId} OR ${tool.isPublic} = true`);
      } else {
        conditions.push(eq(tool.isPublic, true));
      }
      
      const tools = await db
        .select()
        .from(tool)
        .where(and(...conditions))
        .orderBy(desc(tool.downloads), desc(tool.rating))
        .limit(input.limit);
      
      return tools;
    }),

  // Get a single tool
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      
      const [t] = await db
        .select()
        .from(tool)
        .where(eq(tool.id, input.id))
        .limit(1);
      
      if (!t) {
        throw new Error("Tool not found");
      }
      
      // Don't expose code/implementation to non-owners for private tools
      if (!t.isPublic && (!context.session?.user?.id || t.userId !== context.session.user.id)) {
        throw new Error("Tool not found");
      }
      
      return t;
    }),

  // Update a tool
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateToolSchema,
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(tool)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(tool.id, input.id), eq(tool.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Tool not found or unauthorized");
      }
      
      return updated;
    }),

  // Delete a tool
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [deleted] = await db
        .delete(tool)
        .where(and(eq(tool.id, input.id), eq(tool.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Tool not found or unauthorized");
      }
      
      return { success: true };
    }),

  // Assign tool to agent
  assignToAgent: protectedProcedure
    .input(z.object({
      toolId: z.string(),
      agentId: z.string(),
      customParameters: z.record(z.unknown()).optional(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const assignment = {
        id: nanoid(),
        ...input,
        isEnabled: true,
        createdAt: new Date(),
      };
      
      const [created] = await db.insert(agentTool).values(assignment).returning();
      return created;
    }),

  // Remove tool from agent
  removeFromAgent: protectedProcedure
    .input(z.object({
      toolId: z.string(),
      agentId: z.string(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      await db
        .delete(agentTool)
        .where(and(
          eq(agentTool.toolId, input.toolId),
          eq(agentTool.agentId, input.agentId)
        ));
      
      return { success: true };
    }),

  // Execute a tool
  execute: protectedProcedure
    .input(executeToolSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Get tool
      const [t] = await db
        .select()
        .from(tool)
        .where(and(eq(tool.id, input.toolId), eq(tool.status, "active")))
        .limit(1);
      
      if (!t) {
        throw new Error("Tool not found or inactive");
      }
      
      // Check authorization
      if (!t.isPublic && t.userId !== userId) {
        throw new Error("Unauthorized to execute this tool");
      }
      
      // Execute based on implementation type
      const startTime = Date.now();
      let result: unknown;
      let error: string | null = null;
      
      try {
        if (t.implementationType === "http" && t.httpEndpoint) {
          // HTTP-based tool execution
          const response = await fetch(t.httpEndpoint, {
            method: t.httpMethod,
            headers: {
              "Content-Type": "application/json",
              ...t.httpHeaders,
            },
            body: JSON.stringify(input.parameters),
            signal: AbortSignal.timeout(input.timeout || t.timeout || 30000),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
          }
          
          result = await response.json();
        } else if (t.implementationType === "code" && t.code) {
          // Code-based tool execution (sandboxed)
          // In production, this would use a sandbox like E2B, Modal, or isolated-vm
          // For now, we return an error indicating sandbox not available
          throw new Error("Code execution sandbox not configured");
        } else {
          throw new Error("Tool implementation not configured");
        }
        
        // Update success stats
        await db
          .update(tool)
          .set({
            totalCalls: sql`${tool.totalCalls} + 1`,
            averageLatency: sql`(
              (${tool.averageLatency} * ${tool.totalCalls} + ${Date.now() - startTime}) 
              / (${tool.totalCalls} + 1)
            )`,
          })
          .where(eq(tool.id, input.toolId));
        
        return {
          success: true,
          result,
          executionTime: Date.now() - startTime,
        };
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        
        // Update error stats
        await db
          .update(tool)
          .set({
            totalCalls: sql`${tool.totalCalls} + 1`,
            successRate: sql`${tool.successRate} * ${tool.totalCalls} / (${tool.totalCalls} + 1)`,
          })
          .where(eq(tool.id, input.toolId));
        
        throw new Error(`Tool execution failed: ${error}`);
      }
    }),

  // Fork a tool (create copy)
  fork: protectedProcedure
    .input(z.object({
      toolId: z.string(),
      name: z.string(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Get original tool
      const [original] = await db
        .select()
        .from(tool)
        .where(eq(tool.id, input.toolId))
        .limit(1);
      
      if (!original) {
        throw new Error("Tool not found");
      }
      
      // Check if user can fork this tool
      if (!original.isPublic && original.userId !== userId) {
        throw new Error("Unauthorized to fork this tool");
      }
      
      // Create fork
      const forked = {
        id: nanoid(),
        userId,
        name: input.name,
        description: original.description,
        parameters: original.parameters,
        implementationType: original.implementationType,
        code: original.code,
        httpEndpoint: original.httpEndpoint,
        httpMethod: original.httpMethod,
        httpHeaders: original.httpHeaders,
        timeout: original.timeout,
        maxRetries: original.maxRetries,
        isPublic: false,
        parentToolId: original.id,
        tags: original.tags,
        category: original.category,
        version: "1.0.0",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(tool).values(forked).returning();
      return created;
    }),
};
