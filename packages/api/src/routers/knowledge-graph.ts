// ============================================================================
// Knowledge Graph Router - Entity relationships and graph queries
// ============================================================================

import { z } from "zod";
import { nanoid } from "nanoid";

import { protectedProcedure } from "../index";
import { knowledgeNode, knowledgeEdge } from "@my-ai-stack/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Create knowledge node input
const createNodeSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  aliases: z.array(z.string()).optional(),
  description: z.string().max(5000).optional(),
  properties: z.record(z.unknown()).optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});

// Create knowledge edge input
const createEdgeSchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  relationshipType: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  strength: z.number().min(0).max(1).default(1.0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});

// Search nodes input
const searchNodesSchema = z.object({
  query: z.string(),
  type: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const knowledgeGraphRouter = {
  // Create a knowledge node
  createNode: protectedProcedure
    .input(createNodeSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newNode = {
        id: nanoid(),
        userId,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(knowledgeNode).values(newNode).returning();
      return created;
    }),

  // List knowledge nodes
  listNodes: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      type: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      let conditions = [eq(knowledgeNode.userId, userId)];
      
      if (input.type) {
        conditions.push(eq(knowledgeNode.type, input.type));
      }
      
      const nodes = await db
        .select()
        .from(knowledgeNode)
        .where(and(...conditions))
        .orderBy(desc(knowledgeNode.createdAt))
        .limit(input.limit);
      
      return nodes;
    }),

  // Get a single node
  getNode: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [node] = await db
        .select()
        .from(knowledgeNode)
        .where(and(eq(knowledgeNode.id, input.id), eq(knowledgeNode.userId, userId)))
        .limit(1);
      
      if (!node) {
        throw new Error("Node not found");
      }
      
      return node;
    }),

  // Update a node
  updateNode: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(5000).optional(),
        aliases: z.array(z.string()).optional(),
        properties: z.record(z.unknown()).optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [updated] = await db
        .update(knowledgeNode)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(knowledgeNode.id, input.id), eq(knowledgeNode.userId, userId)))
        .returning();
      
      if (!updated) {
        throw new Error("Node not found");
      }
      
      return updated;
    }),

  // Delete a node
  deleteNode: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      // Delete related edges first
      await db
        .delete(knowledgeEdge)
        .where(and(
          eq(knowledgeEdge.userId, userId),
          sql`${knowledgeEdge.sourceNodeId} = ${input.id} OR ${knowledgeEdge.targetNodeId} = ${input.id}`
        ));
      
      const [deleted] = await db
        .delete(knowledgeNode)
        .where(and(eq(knowledgeNode.id, input.id), eq(knowledgeNode.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Node not found");
      }
      
      return { success: true };
    }),

  // Search nodes
  searchNodes: protectedProcedure
    .input(searchNodesSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      let conditions = [eq(knowledgeNode.userId, userId)];
      
      if (input.type) {
        conditions.push(eq(knowledgeNode.type, input.type));
      }
      
      const nodes = await db
        .select()
        .from(knowledgeNode)
        .where(and(...conditions))
        .limit(input.limit);
      
      // Filter by name/aliases/description match
      const searchLower = input.query.toLowerCase();
      const filtered = nodes.filter((node: { 
        name: string; 
        aliases: string[] | null; 
        description: string | null;
      }) => {
        return (
          (node.name.toLowerCase().includes(searchLower)) ||
          (node.aliases?.some((alias: string) => alias.toLowerCase().includes(searchLower))) ||
          (node.description?.toLowerCase().includes(searchLower))
        );
      });
      
      return filtered;
    }),

  // Create an edge (relationship)
  createEdge: protectedProcedure
    .input(createEdgeSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const newEdge = {
        id: nanoid(),
        userId,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [created] = await db.insert(knowledgeEdge).values(newEdge).returning();
      return created;
    }),

  // Get edges for a node
  getNodeEdges: protectedProcedure
    .input(z.object({
      nodeId: z.string(),
      direction: z.enum(["outgoing", "incoming", "both"]).default("both"),
    }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      let conditions = [eq(knowledgeEdge.userId, userId)];
      
      if (input.direction === "outgoing") {
        conditions.push(eq(knowledgeEdge.sourceNodeId, input.nodeId));
      } else if (input.direction === "incoming") {
        conditions.push(eq(knowledgeEdge.targetNodeId, input.nodeId));
      } else {
        conditions.push(sql`${knowledgeEdge.sourceNodeId} = ${input.nodeId} OR ${knowledgeEdge.targetNodeId} = ${input.nodeId}`);
      }
      
      const edges = await db
        .select()
        .from(knowledgeEdge)
        .where(and(...conditions))
        .orderBy(desc(knowledgeEdge.strength));
      
      return edges;
    }),

  // Delete an edge
  deleteEdge: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const [deleted] = await db
        .delete(knowledgeEdge)
        .where(and(eq(knowledgeEdge.id, input.id), eq(knowledgeEdge.userId, userId)))
        .returning();
      
      if (!deleted) {
        throw new Error("Edge not found");
      }
      
      return { success: true };
    }),

  // Get graph statistics
  getStats: protectedProcedure
    .handler(async ({ context }) => {
      const { db } = context;
      const userId = context.session.user.id;
      
      const nodeCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(knowledgeNode)
        .where(eq(knowledgeNode.userId, userId));
      
      const edgeCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(knowledgeEdge)
        .where(eq(knowledgeEdge.userId, userId));
      
      const nodeTypes = await db
        .select({
          type: knowledgeNode.type,
          count: sql<number>`count(*)::int`,
        })
        .from(knowledgeNode)
        .where(eq(knowledgeNode.userId, userId))
        .groupBy(knowledgeNode.type);
      
      return {
        nodes: nodeCount[0]?.count || 0,
        edges: edgeCount[0]?.count || 0,
        nodeTypes,
      };
    }),
};
