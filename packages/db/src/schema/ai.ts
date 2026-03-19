import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  decimal,
  jsonb,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { agent } from "./agents";

// Enums
export const memoryImportanceEnum = pgEnum("memory_importance", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "indexed",
  "error",
]);

export const toolStatusEnum = pgEnum("tool_status", [
  "active",
  "inactive",
  "deprecated",
]);

// ============================================================================
// MEMORIES (Vector-indexed for RAG)
// ============================================================================
export const memory = pgTable(
  "memory",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Memory Content
    content: text("content").notNull(),
    embedding: vector("embedding", 1536), // OpenAI embedding dimensions
    
    // Memory Type & Classification
    type: memoryImportanceEnum("type").default("short_term").notNull(),
    category: text("category"), // e.g., "facts", "preferences", "events", "concepts"
    tags: jsonb("tags").$type<string[]>(),
    
    // Scoring
    importance: decimal("importance", { precision: 3, scale: 2 }).default("0.5"),
    relevanceScore: decimal("relevance_score", { precision: 5, scale: 4 }),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.8"),
    
    // Source Attribution
    sourceType: text("source_type"), // conversation, document, tool, manual
    sourceId: text("source_id"), // conversation_id, document_id, etc.
    sourceChunk: text("source_chunk"), // The specific chunk from source
    
    // Temporal
    lastAccessedAt: timestamp("last_accessed_at"),
    accessCount: integer("access_count").default(0),
    
    // Forgetting Mechanism
    decayRate: decimal("decay_rate", { precision: 5, scale: 4 }).default("0.01"),
    expirationDate: timestamp("expiration_date"),
    
    // Consolidation
    isConsolidated: boolean("is_consolidated").default(false),
    consolidatedFrom: jsonb("consolidated_from").$type<string[]>(), // memory IDs
    
    // Relationships (for knowledge graph)
    relatedMemoryIds: jsonb("related_memory_ids").$type<string[]>(),
    entityMentions: jsonb("entity_mentions").$type<string[]>(), // Named entities
    
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("memory_agentId_idx").on(table.agentId),
    index("memory_userId_idx").on(table.userId),
    index("memory_type_idx").on(table.type),
    index("memory_category_idx").on(table.category),
    index("memory_importance_idx").on(table.importance),
    index("memory_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

export const memoryRelations = relations(memory, ({ one }) => ({
  agent: one(agent, { fields: [memory.agentId], references: [agent.id] }),
  user: one(user, { fields: [memory.userId], references: [user.id] }),
}));

// ============================================================================
// DOCUMENTS (For RAG document intelligence)
// ============================================================================
export const document = pgTable(
  "document",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    name: text("name").notNull(),
    originalName: text("original_name"),
    mimeType: text("mime_type").notNull(),
    size: integer("size"), // bytes
    
    // Storage
    storageKey: text("storage_key").notNull(), // R2/S3 key
    storageUrl: text("storage_url"),
    
    // Processing
    status: documentStatusEnum("status").default("pending").notNull(),
    processingError: text("processing_error"),
    
    // Content Extraction
    extractedText: text("extracted_text"),
    extractedMetadata: jsonb("extracted_metadata"), // PDF metadata, etc.
    
    // Chunking
    chunkCount: integer("chunk_count").default(0),
    chunkingStrategy: text("chunking_strategy").default("recursive"),
    chunkSize: integer("chunk_size").default(1000),
    chunkOverlap: integer("chunk_overlap").default(200),
    
    // Indexing
    isIndexed: boolean("is_indexed").default(false),
    indexedAt: timestamp("indexed_at"),
    
    // Sharing
    isPublic: boolean("is_public").default(false),
    shareToken: text("share_token"),
    
    // Tags & Organization
    tags: jsonb("tags").$type<string[]>(),
    folder: text("folder").default("/"),
    
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_userId_idx").on(table.userId),
    index("document_status_idx").on(table.status),
    index("document_isIndexed_idx").on(table.isIndexed),
    index("document_folder_idx").on(table.folder),
  ]
);

export const documentRelations = relations(document, ({ one, many }) => ({
  user: one(user, { fields: [document.userId], references: [user.id] }),
  chunks: many(documentChunk),
}));

// Document Chunks (for vector search)
export const documentChunk = pgTable(
  "document_chunk",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),
    
    content: text("content").notNull(),
    embedding: vector("embedding", 1536),
    
    // Position
    chunkIndex: integer("chunk_index").notNull(),
    startChar: integer("start_char"),
    endChar: integer("end_char"),
    pageNumber: integer("page_number"),
    
    // Quality Scoring
    relevanceScore: decimal("relevance_score", { precision: 5, scale: 4 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("documentChunk_documentId_idx").on(table.documentId),
    index("documentChunk_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

export const documentChunkRelations = relations(documentChunk, ({ one }) => ({
  document: one(document, { fields: [documentChunk.documentId], references: [document.id] }),
}));

// ============================================================================
// TOOLS (Function calling registry)
// ============================================================================
export const tool = pgTable(
  "tool",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" }), // null = system tool
    
    name: text("name").notNull(),
    description: text("description").notNull(),
    
    // OpenAI Function Schema
    parameters: jsonb("parameters").$type<{
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    }>().notNull(),
    
    // Implementation
    implementationType: text("implementation_type").default("code"), // code, http, plugin
    code: text("code"), // JavaScript/TypeScript code for execution
    httpEndpoint: text("http_endpoint"), // For HTTP-based tools
    httpMethod: text("http_method").default("POST"),
    httpHeaders: jsonb("http_headers"),
    
    // Status
    status: toolStatusEnum("status").default("active").notNull(),
    isPublic: boolean("is_public").default(false),
    
    // Validation & Safety
    validationSchema: jsonb("validation_schema"), // Zod schema
    timeout: integer("timeout").default(30000), // milliseconds
    maxRetries: integer("max_retries").default(3),
    
    // Rate Limiting
    rateLimitPerMinute: integer("rate_limit_per_minute"),
    
    // Stats
    totalCalls: integer("total_calls").default(0),
    successRate: decimal("success_rate", { precision: 5, scale: 4 }).default("1.0"),
    averageLatency: decimal("average_latency", { precision: 10, scale: 2 }),
    
    // Marketplace
    downloads: integer("downloads").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    reviews: integer("reviews").default(0),
    
    // Versioning
    version: text("version").default("1.0.0"),
    parentToolId: text("parent_tool_id"), // For forked tools
    
    tags: jsonb("tags").$type<string[]>(),
    category: text("category"),
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tool_userId_idx").on(table.userId),
    index("tool_status_idx").on(table.status),
    index("tool_isPublic_idx").on(table.isPublic),
    index("tool_category_idx").on(table.category),
    index("tool_name_idx").on(table.name),
  ]
);

export const toolRelations = relations(tool, ({ one, many }) => ({
  user: one(user, { fields: [tool.userId], references: [user.id] }),
  agents: many(agentTool),
}));

// Agent-Tool many-to-many relationship
export const agentTool = pgTable(
  "agent_tool",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    toolId: text("tool_id")
      .notNull()
      .references(() => tool.id, { onDelete: "cascade" }),
    
    // Tool-specific config for this agent
    customParameters: jsonb("custom_parameters"),
    isEnabled: boolean("is_enabled").default(true),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agentTool_agentId_idx").on(table.agentId),
    index("agentTool_toolId_idx").on(table.toolId),
  ]
);

export const agentToolRelations = relations(agentTool, ({ one }) => ({
  agent: one(agent, { fields: [agentTool.agentId], references: [agent.id] }),
  tool: one(tool, { fields: [agentTool.toolId], references: [tool.id] }),
}));

// ============================================================================
// WORKFLOWS (Automation engine)
// ============================================================================
export const workflow = pgTable(
  "workflow",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    name: text("name").notNull(),
    description: text("description"),
    
    // Workflow Definition (n8n-like structure)
    definition: jsonb("definition").$type<{
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: Record<string, unknown>;
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        condition?: string;
      }>;
    }>().notNull(),
    
    // Triggers
    triggers: jsonb("triggers").$type<{
      type: "webhook" | "schedule" | "event" | "manual";
      config: Record<string, unknown>;
    }[]>(),
    
    // Schedule
    schedule: text("schedule"), // Cron expression
    timezone: text("timezone").default("UTC"),
    isScheduled: boolean("is_scheduled").default(false),
    
    // Settings
    isActive: boolean("is_active").default(false),
    isPublic: boolean("is_public").default(false),
    
    // Execution
    lastRunAt: timestamp("last_run_at"),
    lastRunStatus: text("last_run_status"), // success, error, running
    nextRunAt: timestamp("next_run_at"),
    
    // Stats
    totalRuns: integer("total_runs").default(0),
    successCount: integer("success_count").default(0),
    errorCount: integer("error_count").default(0),
    
    // Sharing
    downloads: integer("downloads").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    
    tags: jsonb("tags").$type<string[]>(),
    category: text("category"),
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workflow_userId_idx").on(table.userId),
    index("workflow_isActive_idx").on(table.isActive),
    index("workflow_isScheduled_idx").on(table.isScheduled),
    index("workflow_nextRunAt_idx").on(table.nextRunAt),
  ]
);

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  user: one(user, { fields: [workflow.userId], references: [user.id] }),
  runs: many(workflowRun),
}));

// Workflow execution runs
export const workflowRun = pgTable(
  "workflow_run",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    
    status: text("status").notNull(), // pending, running, success, error
    
    // Execution Details
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    duration: integer("duration"), // milliseconds
    
    // Input/Output
    input: jsonb("input"),
    output: jsonb("output"),
    
    // Error
    error: text("error"),
    errorDetails: jsonb("error_details"),
    
    // Node execution log
    nodeLogs: jsonb("node_logs").$type<{
      nodeId: string;
      status: string;
      startedAt: string;
      endedAt: string;
      output: unknown;
      error?: string;
    }[]>(),
    
    triggeredBy: text("triggered_by"), // user_id, webhook, schedule
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("workflowRun_workflowId_idx").on(table.workflowId),
    index("workflowRun_status_idx").on(table.status),
    index("workflowRun_startedAt_idx").on(table.startedAt),
  ]
);

export const workflowRunRelations = relations(workflowRun, ({ one }) => ({
  workflow: one(workflow, { fields: [workflowRun.workflowId], references: [workflow.id] }),
}));
