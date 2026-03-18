// ============================================================================
// @my-ai-stack/ai - AI Agent Platform Core
// ============================================================================

// Types
export type {
  ModelProvider,
  ModelName,
  AnthropicModel,
  OpenAIModel,
  GoogleModel,
  OllamaModel,
  AgentConfig,
  ConversationContext,
  ChatMessage,
  MessageMetadata,
  ToolCall,
  ToolDefinition,
  ToolResult,
  MemoryType,
  Memory,
  Document,
  DocumentChunk,
  RetrievalResult,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamChunk,
  UsageRecord,
  AIError,
  RateLimitError,
  ModelUnavailableError,
  ProviderChain,
} from "./types.js";

// Providers
export {
  AIService,
  ProviderChainService,
  createAIService,
  createProviderChain,
  supportsStreaming,
  getAvailableModels,
  defaultTemperatures,
  defaultMaxTokens,
} from "./providers/index.js";

// Agent
export {
  Agent,
  AgentManager,
  createDefaultConfig,
  validateAgentConfig,
  generateAgentId,
  defaultPersonalityPrompts,
} from "./agent/index.js";

// Embeddings
export {
  EmbeddingService,
  createEmbeddingService,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_DIMENSIONS,
  batchEmbed,
  findMostSimilar,
} from "./embeddings/index.js";

// RAG
export {
  RAGService,
  createRAGService,
  extractTextFromFile,
  estimateTokens,
  type ChunkStrategy,
  type ChunkOptions,
  type ChunkResult,
  type RetrievalOptions,
} from "./rag/index.js";

// Tools
export {
  ToolRegistry,
  ToolExecutor,
  createToolDefinition,
  toAISDKTools,
  toolSchemas,
  type ToolContext,
  type ValidationResult,
  type ExecutionResult,
} from "./tools/index.js";

// Memory
export {
  ShortTermMemory,
  LongTermMemory,
  WorkingMemory,
  MemoryManager,
  createMemoryManager,
  estimateImportance,
  type MemoryEntry,
} from "./memory/index.js";