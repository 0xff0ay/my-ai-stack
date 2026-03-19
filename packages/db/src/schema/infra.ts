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
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { agent } from "./agents";

// Enums
export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "active",
  "revoked",
  "expired",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "sms",
  "slack",
  "discord",
  "telegram",
  "push",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// ============================================================================
// API KEYS (For AI provider authentication)
// ============================================================================
export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull(), // Hashed API key
    keyPrefix: text("key_prefix"), // First 8 chars for display
    
    // Provider
    provider: text("provider").notNull(), // openai, anthropic, google, etc.
    providerUrl: text("provider_url"), // For custom/OpenAI-compatible endpoints
    
    // Permissions
    permissions: jsonb("permissions").$type<{
      models: string[]; // Allowed models
      features: string[]; // streaming, vision, etc.
    }>(),
    
    // Rate Limiting
    rateLimitPerMinute: integer("rate_limit_per_minute"),
    rateLimitPerHour: integer("rate_limit_per_hour"),
    
    // Status
    status: apiKeyStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("apiKey_userId_idx").on(table.userId),
    index("apiKey_provider_idx").on(table.provider),
    index("apiKey_status_idx").on(table.status),
  ]
);

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, { fields: [apiKey.userId], references: [user.id] }),
}));

// ============================================================================
// USAGE LOGS (Token tracking & cost analytics)
// ============================================================================
export const usageLog = pgTable(
  "usage_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
      .references(() => agent.id, { onDelete: "set null" }),
    
    // Request Details
    requestType: text("request_type").notNull(), // chat, completion, embedding, etc.
    model: text("model").notNull(),
    provider: text("provider").notNull(),
    
    // Token Usage
    promptTokens: integer("prompt_tokens").default(0),
    completionTokens: integer("completion_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    
    // Cost (stored in cents/smallest currency unit)
    cost: decimal("cost", { precision: 10, scale: 4 }),
    currency: text("currency").default("USD"),
    
    // Performance
    latency: integer("latency"), // milliseconds
    cached: boolean("cached").default(false),
    
    // Source tracking
    conversationId: text("conversation_id"),
    messageId: text("message_id"),
    toolId: text("tool_id"),
    workflowId: text("workflow_id"),
    
    // IP & Geo for abuse detection
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usageLog_userId_idx").on(table.userId),
    index("usageLog_agentId_idx").on(table.agentId),
    index("usageLog_createdAt_idx").on(table.createdAt),
    index("usageLog_provider_idx").on(table.provider),
    index("usageLog_requestType_idx").on(table.requestType),
  ]
);

export const usageLogRelations = relations(usageLog, ({ one }) => ({
  user: one(user, { fields: [usageLog.userId], references: [user.id] }),
  agent: one(agent, { fields: [usageLog.agentId], references: [agent.id] }),
}));

// ============================================================================
// NOTIFICATIONS (Smart notification system)
// ============================================================================
export const notification = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    title: text("title").notNull(),
    body: text("body").notNull(),
    
    // Channel & Priority
    channel: notificationChannelEnum("channel").notNull(),
    priority: notificationPriorityEnum("priority").default("medium").notNull(),
    
    // Delivery
    status: text("status").default("pending").notNull(), // pending, sent, delivered, failed
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    
    // Scheduling
    scheduledFor: timestamp("scheduled_for"),
    
    // Retry
    retryCount: integer("retry_count").default(0),
    maxRetries: integer("max_retries").default(3),
    
    // Source
    sourceType: text("source_type"), // agent, workflow, system
    sourceId: text("source_id"),
    
    // Action (deep link)
    actionUrl: text("action_url"),
    actionLabel: text("action_label"),
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_status_idx").on(table.status),
    index("notification_channel_idx").on(table.channel),
    index("notification_createdAt_idx").on(table.createdAt),
    index("notification_scheduledFor_idx").on(table.scheduledFor),
  ]
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================
export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Channel Settings
    emailEnabled: boolean("email_enabled").default(true),
    emailAddress: text("email_address"),
    
    smsEnabled: boolean("sms_enabled").default(false),
    phoneNumber: text("phone_number"),
    
    slackEnabled: boolean("slack_enabled").default(false),
    slackWebhookUrl: text("slack_webhook_url"),
    
    discordEnabled: boolean("discord_enabled").default(false),
    discordWebhookUrl: text("discord_webhook_url"),
    
    telegramEnabled: boolean("telegram_enabled").default(false),
    telegramChatId: text("telegram_chat_id"),
    
    pushEnabled: boolean("push_enabled").default(true),
    pushSubscription: jsonb("push_subscription"), // Web Push subscription
    
    // Quiet Hours
    quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
    quietHoursStart: text("quiet_hours_start").default("22:00"),
    quietHoursEnd: text("quiet_hours_end").default("08:00"),
    quietHoursTimezone: text("quiet_hours_timezone").default("UTC"),
    
    // Smart Batching
    batchingEnabled: boolean("batching_enabled").default(true),
    batchIntervalMinutes: integer("batch_interval_minutes").default(5),
    
    // Priority Overrides
    urgentBypassQuietHours: boolean("urgent_bypass_quiet_hours").default(true),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notificationPreference_userId_idx").on(table.userId),
  ]
);

export const notificationPreferenceRelations = relations(notificationPreference, ({ one }) => ({
  user: one(user, { fields: [notificationPreference.userId], references: [user.id] }),
}));

// ============================================================================
// KNOWLEDGE GRAPH (Entity relationships)
// ============================================================================
export const knowledgeNode = pgTable(
  "knowledge_node",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    name: text("name").notNull(),
    type: text("type").notNull(), // person, organization, concept, location, event, etc.
    
    // Attributes
    aliases: jsonb("aliases").$type<string[]>(),
    description: text("description"),
    properties: jsonb("properties"), // Flexible attributes
    
    // Vector embedding for semantic search
    embedding: vector("embedding", 1536),
    
    // Source
    sourceType: text("source_type"), // memory, document, manual
    sourceId: text("source_id"),
    
    // Confidence
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.8"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("knowledgeNode_userId_idx").on(table.userId),
    index("knowledgeNode_type_idx").on(table.type),
    index("knowledgeNode_name_idx").on(table.name),
    index("knowledgeNode_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

export const knowledgeNodeRelations = relations(knowledgeNode, ({ one, many }) => ({
  user: one(user, { fields: [knowledgeNode.userId], references: [user.id] }),
  outgoingRelations: many(knowledgeEdge),
  incomingRelations: many(knowledgeEdge),
}));

// Knowledge Graph Edges (Relationships)
export const knowledgeEdge = pgTable(
  "knowledge_edge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    sourceNodeId: text("source_node_id")
      .notNull()
      .references(() => knowledgeNode.id, { onDelete: "cascade" }),
    targetNodeId: text("target_node_id")
      .notNull()
      .references(() => knowledgeNode.id, { onDelete: "cascade" }),
    
    relationshipType: text("relationship_type").notNull(), // works_at, knows, located_in, part_of, etc.
    
    // Properties
    properties: jsonb("properties"), // start_date, end_date, strength, etc.
    strength: decimal("strength", { precision: 3, scale: 2 }).default("1.0"), // 0-1 relationship strength
    
    // Temporal
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    
    // Source
    sourceType: text("source_type"),
    sourceId: text("source_id"),
    
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.8"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("knowledgeEdge_userId_idx").on(table.userId),
    index("knowledgeEdge_sourceNodeId_idx").on(table.sourceNodeId),
    index("knowledgeEdge_targetNodeId_idx").on(table.targetNodeId),
    index("knowledgeEdge_relationshipType_idx").on(table.relationshipType),
  ]
);

export const knowledgeEdgeRelations = relations(knowledgeEdge, ({ one }) => ({
  user: one(user, { fields: [knowledgeEdge.userId], references: [user.id] }),
  sourceNode: one(knowledgeNode, { fields: [knowledgeEdge.sourceNodeId], references: [knowledgeNode.id] }),
  targetNode: one(knowledgeNode, { fields: [knowledgeEdge.targetNodeId], references: [knowledgeNode.id] }),
}));
