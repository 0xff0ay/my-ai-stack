// ============================================================================
// Core Types for AI Agent Platform
// ============================================================================

import type { UIMessage } from "ai";

// Model Providers
export type ModelProvider = "anthropic" | "openai" | "google" | "ollama";

// Supported models per provider
export type AnthropicModel = "claude-3-5-sonnet-20241022" | "claude-3-opus-20240229" | "claude-3-haiku-20240307";
export type OpenAIModel = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "gpt-3.5-turbo";
export type GoogleModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-1.5-pro" | "gemini-1.5-flash";
export type OllamaModel = string; // Dynamic based on installed models

export type ModelName = AnthropicModel | OpenAIModel | GoogleModel | OllamaModel;

// Agent Configuration
export interface AgentConfig {
  id: string;
  userId: string;
  name: string;
  description?: string;
  modelProvider: ModelProvider;
  modelName: ModelName;
  personality?: Record<string, unknown>;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}

// Conversation Context
export interface ConversationContext {
  workingMemory: string[];
  relevantMemories: string[];
  documents: string[];
}

// Message Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
  toolName?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// Tool Types
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
  code: string;
  category?: string;
  tags?: string[];
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

// Memory Types
export type MemoryType = "episodic" | "semantic" | "working";

export interface Memory {
  id: string;
  agentId?: string;
  userId: string;
  content: string;
  embedding?: number[];
  memoryType: MemoryType;
  importance: number;
  accessCount: number;
  lastAccessedAt?: Date;
  metadata?: Record<string, unknown>;
}

// RAG Types
export interface Document {
  id: string;
  userId: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "txt" | "md" | "url";
  content?: string;
  metadata?: Record<string, unknown>;
  chunkCount: number;
  embeddingModel?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
  citations: string[];
}

// Chat Request/Response Types
export interface ChatRequest {
  messages: UIMessage[];
  agentId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  toolResults?: ToolResult[];
  metadata?: MessageMetadata;
}

// Embedding Types
export interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

// Streaming Types
export interface StreamChunk {
  type: "text" | "tool-call" | "tool-result" | "error" | "done";
  content: string;
  toolCallId?: string;
  toolName?: string;
  error?: string;
}

// Usage Tracking
export interface UsageRecord {
  userId: string;
  agentId?: string;
  conversationId?: string;
  modelProvider: ModelProvider;
  modelName: ModelName;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
}

// Error Types
export class AIError extends Error {
  code: string;
  provider: ModelProvider;
  retryable: boolean;

  constructor(message: string, code: string, provider: ModelProvider, retryable = false) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class RateLimitError extends AIError {
  retryAfter: number;

  constructor(provider: ModelProvider, retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}s`, "RATE_LIMIT", provider, true);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ModelUnavailableError extends AIError {
  constructor(provider: ModelProvider, modelName: ModelName) {
    super(`Model ${modelName} not available on ${provider}`, "MODEL_UNAVAILABLE", provider, true);
    this.name = "ModelUnavailableError";
  }
}

// Provider Fallback Chain
export interface ProviderChain {
  providers: Array<{
    provider: ModelProvider;
    modelName: ModelName;
  }>;
  currentIndex: number;
}