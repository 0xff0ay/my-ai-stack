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
  vector,
} from "drizzle-orm/pg-core";

// Vector column type for pgvector (1536 dimensions for OpenAI embeddings)
export const embedding = (name: string) => vector(name, 1536);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// AI Agent Platform Tables
// ============================================================================

/**
 * Agents - Custom AI agents with personality and configuration
 */
export const agents = pgTable(
  "agent",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    modelProvider: text("model_provider").notNull().default("anthropic"),
    modelName: text("model_name").notNull().default("claude-3-5-sonnet-20241022"),
    personality: text("personality"), // JSON blob for personality traits
    systemPrompt: text("system_prompt"),
    temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
    maxTokens: integer("max_tokens").default(4096),
    tools: jsonb("tools"), // Array of tool IDs this agent can use
    isPublic: boolean("is_public").default(false),
    metadata: jsonb("metadata"), // Additional configuration
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("agent_userId_idx").on(table.userId),
    index("agent_isPublic_idx").on(table.isPublic),
  ],
);

/**
 * Conversations - Chat sessions between users and agents
 */
export const conversations = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").references(() => agents.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    context: jsonb("context"), // Working memory context
    metadata: jsonb("metadata"), // Additional conversation metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_agentId_idx").on(table.agentId),
    index("conversation_userId_idx").on(table.userId),
  ],
);

/**
 * Messages - Individual messages in conversations
 */
export const messages = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "user" | "assistant" | "system" | "tool"
    content: text("content").notNull(),
    name: text("name"), // For tool calls
    toolCallId: text("tool_call_id"),
    toolName: text("tool_name"),
    metadata: jsonb("metadata"), // Token counts, model used, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("message_conversationId_idx").on(table.conversationId)],
);

/**
 * Memories - Long-term vector-indexed memories
 */
export const memories = pgTable(
  "memory",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").references(() => agents.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: embedding("embedding"),
    memoryType: text("memory_type").notNull().default("episodic"), // episodic | semantic | working
    importance: integer("importance").default(5), // 1-10 scale
    accessCount: integer("access_count").default(0),
    lastAccessedAt: timestamp("last_accessed_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("memory_agentId_idx").on(table.agentId),
    index("memory_userId_idx").on(table.userId),
    index("memory_memoryType_idx").on(table.memoryType),
  ],
);

/**
 * Tools - Custom tool definitions for agent function calling
 */
export const tools = pgTable(
  "tool",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    schema: jsonb("schema").notNull(), // Zod schema for validation
    code: text("code").notNull(), // Executable code
    isPublic: boolean("is_public").default(false),
    category: text("category"), // file-operations | web-search | code-execution | etc.
    tags: jsonb("tags"), // Array of tags for discovery
    usageCount: integer("usage_count").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("tool_userId_idx").on(table.userId),
    index("tool_isPublic_idx").on(table.isPublic),
    index("tool_category_idx").on(table.category),
  ],
);

/**
 * Workflows - Automation workflow definitions
 */
export const workflows = pgTable(
  "workflow",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    definition: jsonb("definition").notNull(), // Workflow graph definition
    triggers: jsonb("triggers"), // Webhook URLs, cron expressions, event types
    isActive: boolean("is_active").default(false),
    runCount: integer("run_count").default(0),
    lastRunAt: timestamp("last_run_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("workflow_userId_idx").on(table.userId),
    index("workflow_isActive_idx").on(table.isActive),
  ],
);

/**
 * Documents - User documents for RAG/knowledge base
 */
export const documents = pgTable(
  "document",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // pdf | docx | xlsx | txt | md | url
    content: text("content"), // Extracted text content
    metadata: jsonb("metadata"), // Original file metadata
    chunkCount: integer("chunk_count").default(0),
    embeddingModel: text("embedding_model"), // Which model used for embeddings
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("document_userId_idx").on(table.userId)],
);

/**
 * Document Chunks - Vector embeddings for document chunks (RAG)
 */
export const documentChunks = pgTable(
  "document_chunk",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    embedding: embedding("embedding"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("documentChunk_documentId_idx").on(table.documentId)],
);

/**
 * API Keys - User API keys for external access
 */
export const apiKeys = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull().unique(),
    name: text("name").notNull(),
    permissions: jsonb("permissions"), // Array of allowed actions
    rateLimit: integer("rate_limit"), // Requests per minute
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("apiKey_userId_idx").on(table.userId),
    index("apiKey_keyHash_idx").on(table.keyHash),
  ],
);

/**
 * Usage Logs - Token usage and cost tracking
 */
export const usageLogs = pgTable(
  "usage_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id").references(() => agents.id, { onDelete: "set null" }),
    conversationId: text("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    modelProvider: text("model_provider").notNull(),
    modelName: text("model_name").notNull(),
    promptTokens: integer("prompt_tokens").default(0),
    completionTokens: integer("completion_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    cost: decimal("cost", { precision: 10, scale: 6 }).default("0"),
    latency: integer("latency"), // Milliseconds
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usageLog_userId_idx").on(table.userId),
    index("usageLog_agentId_idx").on(table.agentId),
    index("usageLog_createdAt_idx").on(table.createdAt),
  ],
);

/**
 * Agent Collaborations - Multi-agent orchestration
 */
export const agentCollaborations = pgTable(
  "agent_collaboration",
  {
    id: text("id").primaryKey(),
    parentAgentId: text("parent_agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    childAgentId: text("child_agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    role: text("role"), // researcher | coder | writer | analyst | etc.
    config: jsonb("config"), // Collaboration-specific config
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("collaboration_parentAgentId_idx").on(table.parentAgentId),
    index("collaboration_childAgentId_idx").on(table.childAgentId),
  ],
);

/**
 * Scheduled Tasks - Temporal reasoning engine tasks
 */
export const scheduledTasks = pgTable(
  "scheduled_task",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    cronExpression: text("cron_expression"),
    taskType: text("task_type").notNull(), // one-time | recurring | webhook
    payload: jsonb("payload"), // Task input parameters
    status: text("status").notNull().default("pending"), // pending | running | completed | failed
    result: jsonb("result"), // Task execution result
    nextRunAt: timestamp("next_run_at"),
    lastRunAt: timestamp("last_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("scheduledTask_userId_idx").on(table.userId),
    index("scheduledTask_agentId_idx").on(table.agentId),
    index("scheduledTask_status_idx").on(table.status),
    index("scheduledTask_nextRunAt_idx").on(table.nextRunAt),
  ],
);

/**
 * Plugins - Plugin ecosystem definitions
 */
export const plugins = pgTable(
  "plugin",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    version: text("version").notNull(),
    code: text("code").notNull(), // Plugin code
    dependencies: jsonb("dependencies"), // Plugin dependencies
    isPublic: boolean("is_public").default(false),
    isInstalled: boolean("is_installed").default(false),
    installCount: integer("install_count").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("plugin_userId_idx").on(table.userId),
    index("plugin_isPublic_idx").on(table.isPublic),
  ],
);

// ============================================================================
// Relations
// ============================================================================

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(user, {
    fields: [agents.userId],
    references: [user.id],
  }),
  conversations: many(conversations),
  memories: many(memories),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  user: one(user, {
    fields: [conversations.userId],
    references: [user.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const memoriesRelations = relations(memories, ({ one }) => ({
  agent: one(agents, {
    fields: [memories.agentId],
    references: [agents.id],
  }),
  user: one(user, {
    fields: [memories.userId],
    references: [user.id],
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  user: one(user, {
    fields: [tools.userId],
    references: [user.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  user: one(user, {
    fields: [workflows.userId],
    references: [user.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(user, {
    fields: [apiKeys.userId],
    references: [user.id],
  }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(user, {
    fields: [usageLogs.userId],
    references: [user.id],
  }),
  agent: one(agents, {
    fields: [usageLogs.agentId],
    references: [agents.id],
  }),
  conversation: one(conversations, {
    fields: [usageLogs.conversationId],
    references: [conversations.id],
  }),
}));

export const agentCollaborationsRelations = relations(agentCollaborations, ({ one }) => ({
  parentAgent: one(agents, {
    fields: [agentCollaborations.parentAgentId],
    references: [agents.id],
  }),
  childAgent: one(agents, {
    fields: [agentCollaborations.childAgentId],
    references: [agents.id],
  }),
}));

export const scheduledTasksRelations = relations(scheduledTasks, ({ one }) => ({
  user: one(user, {
    fields: [scheduledTasks.userId],
    references: [user.id],
  }),
  agent: one(agents, {
    fields: [scheduledTasks.agentId],
    references: [agents.id],
  }),
}));

export const pluginsRelations = relations(plugins, ({ one }) => ({
  user: one(user, {
    fields: [plugins.userId],
    references: [user.id],
  }),
}));
