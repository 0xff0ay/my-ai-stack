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
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Enums
export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "inactive",
  "paused",
  "error",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "tool",
]);

export const memoryTypeEnum = pgEnum("memory_type", [
  "short_term",
  "long_term",
  "episodic",
  "semantic",
  "working",
]);

export const toolStatusEnum = pgEnum("tool_status", [
  "active",
  "inactive",
  "deprecated",
  "beta",
]);

// Vector column type for pgvector (1536 dimensions for OpenAI embeddings)
export const embedding = (name: string) => vector(name, 1536);

// ============================================================================
// AGENTS
// ============================================================================
export const agent = pgTable(
  "agent",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: agentStatusEnum("status").default("active").notNull(),
    
    // AI Provider Configuration
    provider: text("provider").notNull(), // openai, anthropic, google, ollama
    model: text("model").notNull(), // gpt-4, claude-3-opus, etc.
    fallbackModels: jsonb("fallback_models").$type<string[]>(),
    apiKeyId: text("api_key_id"), // Reference to api_keys table
    
    // Personality & Behavior
    personalityProfile: jsonb("personality_profile").$type<{
      traits: string[];
      communicationStyle: string;
      expertise: string[];
      tone: string;
    }>(),
    systemPrompt: text("system_prompt"),
    promptTemplate: text("prompt_template"),
    
    // Context Management
    contextWindow: integer("context_window").default(128000),
    maxTokens: integer("max_tokens").default(4096),
    temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
    topP: decimal("top_p", { precision: 3, scale: 2 }).default("0.9"),
    
    // Features
    streamingEnabled: boolean("streaming_enabled").default(true),
    memoryEnabled: boolean("memory_enabled").default(true),
    toolsEnabled: boolean("tools_enabled").default(true),
    visionEnabled: boolean("vision_enabled").default(false),
    voiceEnabled: boolean("voice_enabled").default(false),
    
    // Rate Limiting
    rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
    rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
    
    // Metadata
    avatar: text("avatar"),
    color: text("color").default("#00ffff"),
    tags: jsonb("tags").$type<string[]>(),
    metadata: jsonb("metadata"),
    
    // Stats
    totalConversations: integer("total_conversations").default(0),
    totalMessages: integer("total_messages").default(0),
    totalTokensUsed: integer("total_tokens_used").default(0),
    averageResponseTime: decimal("average_response_time", { precision: 10, scale: 2 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    lastActiveAt: timestamp("last_active_at"),
  },
  (table) => [
    index("agent_userId_idx").on(table.userId),
    index("agent_status_idx").on(table.status),
    index("agent_provider_idx").on(table.provider),
  ]
);

export const agentRelations = relations(agent, ({ one, many }) => ({
  user: one(user, { fields: [agent.userId], references: [user.id] }),
  conversations: many(conversation),
}));

// ============================================================================
// CONVERSATIONS
// ============================================================================
export const conversation = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    title: text("title"),
    summary: text("summary"), // AI-generated summary
    
    // Context
    contextWindowUsed: integer("context_window_used").default(0),
    tokensUsed: integer("tokens_used").default(0),
    
    // Settings
    isArchived: boolean("is_archived").default(false),
    isPinned: boolean("is_pinned").default(false),
    isShared: boolean("is_shared").default(false),
    shareToken: text("share_token"),
    
    // Collaboration
    collaborators: jsonb("collaborators").$type<string[]>(), // user IDs
    parentConversationId: text("parent_conversation_id"), // For branched conversations
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_agentId_idx").on(table.agentId),
    index("conversation_userId_idx").on(table.userId),
    index("conversation_createdAt_idx").on(table.createdAt),
  ]
);

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  agent: one(agent, { fields: [conversation.agentId], references: [agent.id] }),
  user: one(user, { fields: [conversation.userId], references: [user.id] }),
  messages: many(message),
  parent: one(conversation, { fields: [conversation.parentConversationId], references: [conversation.id] }),
}));

// ============================================================================
// MESSAGES
// ============================================================================
export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    
    // For structured content (tool calls, images, etc.)
    contentType: text("content_type").default("text"), // text, image, tool_call, tool_result, code
    structuredContent: jsonb("structured_content"),
    
    // Tool calls
    toolCalls: jsonb("tool_calls").$type<{
      id: string;
      type: string;
      function: { name: string; arguments: string };
    }[]>(),
    toolCallResults: jsonb("tool_call_results"),
    
    // Token usage
    tokensUsed: integer("tokens_used"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    
    // Performance
    latency: integer("latency"), // milliseconds
    modelUsed: text("model_used"),
    providerUsed: text("provider_used"),
    
    // Citations & Sources (for RAG)
    citations: jsonb("citations").$type<{
      source: string;
      chunk: string;
      score: number;
    }[]>(),
    
    // Feedback
    rating: integer("rating"), // 1-5 stars
    feedback: text("feedback"),
    
    // Metadata
    metadata: jsonb("metadata"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_conversationId_idx").on(table.conversationId),
    index("message_role_idx").on(table.role),
    index("message_createdAt_idx").on(table.createdAt),
  ]
);

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
}));
