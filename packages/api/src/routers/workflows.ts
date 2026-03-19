// ============================================================================
// Workflows Router - Automation engine
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure, publicProcedure } from "../index";
import { workflow, workflowRun } from "@my-ai-stack/db/schema";
import { eq, desc, and } from "drizzle-orm";

// Workflow node definition
const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()),
});

// Workflow edge definition
const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});

// Workflow trigger definition
const workflowTriggerSchema = z.object({
  type: z.enum(["webhook", "schedule", "event", "manual"]),
  config: z.record(z.unknown()),
});

// Create workflow input
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema),
  triggers: z.array(workflowTriggerSchema).optional(),
  schedule: z.string().optional(), // Cron expression
  timezone: z.string().default("UTC"),
  isScheduled: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Update workflow input
const updateWorkflowSchema = createWorkflowSchema.partial();

// Execute workflow input
const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  input: z.record(z.unknown()).optional(),
});

export const workflowsRouter = {
  // Create a new workflow
  create: protectedProcedure
    .input(createWorkflowSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newWorkflow = {
        id: nanoid(),
        userId,
        ...input,
        isActive: false, // Must be manually activated
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(workflow).values(newWorkflow).returning();
      return created;
    }),

  // List workflows (with marketplace filter)
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
      
      let conditions: any[] = [];
      
      if (input.isPublic !== undefined) {
        conditions.push(eq(workflow.isPublic, input.isPublic));
      }
      
      if (input.category) {
        conditions.push(eq(workflow.category, input.category));
      }
      
      // If user is logged in, show their workflows + public workflows
      // If not logged in, only show public workflows
      if (userId) {
        conditions.push(eq(workflow.userId, userId));
      } else {
        conditions.push(eq(workflow.isPublic, true));
      }
      
      const workflows = await db
        .select()
        .from(workflow)
        .where(and(...conditions))
        .orderBy(desc(workflow.downloads), desc(workflow.createdAt))
        .limit(input.limit);
      
      return workflows;
    }),

  // Get a single workflow
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      
      const [wf] = await db
        .select()
        .from(workflow)
        .where(eq(workflow.id, input.id))
        .limit(1);
      
      if (!wf) {
        throw new Error("Workflow not found");
      }
      
      // Don't expose private workflows to non-owners
      if (!wf.isPublic && (!context.session?.user?.id || wf.userId !== context.session.user.id)) {
        throw new Error("Workflow not found");
      }
      
      return wf;
    }),

  // Update a workflow
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateWorkflowSchema,
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(workflow)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(workflow.id, input.id), eq(workflow.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Workflow not found or unauthorized");
      }
      
      return updated;
    }),

  // Delete a workflow
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [deleted] = await db
        .delete(workflow)
        .where(and(eq(workflow.id, input.id), eq(workflow.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Workflow not found or unauthorized");
      }
      
      return { success: true };
    }),

  // Activate/deactivate workflow
  setActive: protectedProcedure
    .input(z.object({
      id: z.string(),
      isActive: z.boolean(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(workflow)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(and(eq(workflow.id, input.id), eq(workflow.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Workflow not found or unauthorized");
      }
      
      return updated;
    }),

  // Execute a workflow
  execute: protectedProcedure
    .input(executeWorkflowSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Get workflow
      const [wf] = await db
        .select()
        .from(workflow)
        .where(and(eq(workflow.id, input.workflowId), eq(workflow.userId, userId)))
        .limit(1);
      
      if (!wf) {
        throw new Error("Workflow not found");
      }
      
      // Create run record
      const runId = nanoid();
      const [run] = await db.insert(workflowRun).values({
        id: runId,
        workflowId: input.workflowId,
        status: "pending",
        input: input.input,
        startedAt: new Date(),
        triggeredBy: userId,
      }).returning();
      
      // In production, this would queue a background job
      // For now, just return the run ID
      return {
        runId,
        status: "pending",
        message: "Workflow execution queued",
      };
    }),

  // Get workflow runs
  getRuns: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Verify ownership
      const [wf] = await db
        .select()
        .from(workflow)
        .where(and(eq(workflow.id, input.workflowId), eq(workflow.userId, userId)))
        .limit(1);
      
      if (!wf) {
        throw new Error("Workflow not found");
      }
      
      const runs = await db
        .select()
        .from(workflowRun)
        .where(eq(workflowRun.workflowId, input.workflowId))
        .orderBy(desc(workflowRun.startedAt))
        .limit(input.limit);
      
      return runs;
    }),

  // Get run details
  getRun: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      runId: z.string(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Verify ownership
      const [wf] = await db
        .select()
        .from(workflow)
        .where(and(eq(workflow.id, input.workflowId), eq(workflow.userId, userId)))
        .limit(1);
      
      if (!wf) {
        throw new Error("Workflow not found");
      }
      
      const [run] = await db
        .select()
        .from(workflowRun)
        .where(and(
          eq(workflowRun.id, input.runId),
          eq(workflowRun.workflowId, input.workflowId)
        ))
        .limit(1);
      
      if (!run) {
        throw new Error("Run not found");
      }
      
      return run;
    }),

  // Fork a workflow
  fork: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      name: z.string(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Get original workflow
      const [original] = await db
        .select()
        .from(workflow)
        .where(eq(workflow.id, input.workflowId))
        .limit(1);
      
      if (!original) {
        throw new Error("Workflow not found");
      }
      
      // Check if user can fork this workflow
      if (!original.isPublic && original.userId !== userId) {
        throw new Error("Unauthorized to fork this workflow");
      }
      
      // Create fork
      const forked = {
        id: nanoid(),
        userId,
        name: input.name,
        description: original.description,
        definition: original.definition,
        triggers: original.triggers,
        isPublic: false,
        isActive: false,
        tags: original.tags,
        category: original.category,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(workflow).values(forked).returning();
      return created;
    }),
};
