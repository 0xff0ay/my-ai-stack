// ============================================================================
// Main Router - Aggregates all API routes
// ============================================================================

import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { agentsRouter } from "./agents";
import { conversationsRouter } from "./conversations";
import { chatRouter } from "./chat";
import { memoriesRouter } from "./memories";
import { toolsRouter } from "./tools";
import { workflowsRouter } from "./workflows";
import { documentsRouter } from "./documents";
import { knowledgeGraphRouter } from "./knowledge-graph";

export const appRouter = {
  // Health check
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),

  // Private data example
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),

  // Agents
  agents: agentsRouter,

  // Conversations
  conversations: conversationsRouter,

  // Chat (streaming)
  chat: chatRouter,

  // Memories
  memories: memoriesRouter,

  // Tools
  tools: toolsRouter,

  // Workflows
  workflows: workflowsRouter,

  // Documents
  documents: documentsRouter,

  // Knowledge Graph
  knowledgeGraph: knowledgeGraphRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;