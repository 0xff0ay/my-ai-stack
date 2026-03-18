// ============================================================================
// Agent Service - Agent configuration and management
// ============================================================================

import { nanoid } from "nanoid";
import type {
  AgentConfig,
  ChatMessage,
  ConversationContext,
  MemoryType,
  ToolCall,
} from "../types.js";
import type { AIService } from "../providers/index.js";

// Default system prompts for different agent roles
export const defaultPersonalityPrompts: Record<string, string> = {
  researcher: `You are a research assistant. Your goal is to find and synthesize information from various sources.
Always cite your sources and provide evidence for your claims.
Break down complex topics into digestible pieces.
Be thorough and precise in your research.`,

  coder: `You are a coding assistant. Your goal is to write clean, efficient, and well-documented code.
Follow best practices and coding standards.
Explain your reasoning and the trade-offs of your decisions.
Consider edge cases and error handling.`,

  writer: `You are a writing assistant. Your goal is to produce clear, engaging, and well-structured content.
Adapt your writing style to the target audience.
Use proper grammar, spelling, and punctuation.
Organize ideas logically with clear transitions.`,

  analyst: `You are a data analyst. Your goal is to extract insights from data and present them clearly.
Use data to support your conclusions.
Visualize data when possible.
Consider multiple perspectives and interpretations.`,

  general: `You are a helpful AI assistant. Provide accurate, relevant, and helpful responses.
Think step by step when solving problems.
Ask clarifying questions when needed.
Admit uncertainty when you don't know something.`,
};

// ============================================================================
// Agent Class
// ============================================================================

export class Agent {
  private config: AgentConfig;
  private aiService: AIService;
  private context: ConversationContext;

  constructor(config: AgentConfig, aiService: AIService) {
    this.config = config;
    this.aiService = aiService;
    this.context = {
      workingMemory: [],
      relevantMemories: [],
      documents: [],
    };

    // Apply system prompt from config or default based on personality
    if (config.systemPrompt) {
      this.aiService.setSystemPrompt(config.systemPrompt);
    } else if (config.personality?.role) {
      const rolePrompt = defaultPersonalityPrompts[config.personality.role as string];
      if (rolePrompt) {
        this.aiService.setSystemPrompt(rolePrompt);
      }
    }

    // Apply temperature and max tokens
    if (config.temperature) {
      this.aiService.setTemperature(config.temperature);
    }
    if (config.maxTokens) {
      this.aiService.setMaxTokens(config.maxTokens);
    }
  }

  // Get agent configuration
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };

    // Apply updates to AI service
    if (updates.temperature !== undefined) {
      this.aiService.setTemperature(updates.temperature);
    }
    if (updates.maxTokens !== undefined) {
      this.aiService.setMaxTokens(updates.maxTokens);
    }
    if (updates.systemPrompt !== undefined) {
      this.aiService.setSystemPrompt(updates.systemPrompt);
    }
    if (updates.modelProvider !== undefined || updates.modelName !== undefined) {
      this.aiService.setModel(
        updates.modelProvider ?? this.config.modelProvider,
        updates.modelName ?? this.config.modelName
      );
    }
  }

  // Add to working memory
  addToWorkingMemory(content: string): void {
    this.context.workingMemory.push(content);
    // Keep working memory bounded
    if (this.context.workingMemory.length > 10) {
      this.context.workingMemory.shift();
    }
  }

  // Clear working memory
  clearWorkingMemory(): void {
    this.context.workingMemory = [];
  }

  // Set relevant memories for context
  setRelevantMemories(memories: string[]): void {
    this.context.relevantMemories = memories;
  }

  // Set documents for RAG context
  setDocuments(documents: string[]): void {
    this.context.documents = documents;
  }

  // Build context prompt from memories and documents
  private buildContextPrompt(): string {
    const parts: string[] = [];

    if (this.context.relevantMemories.length > 0) {
      parts.push("Relevant memories from previous conversations:");
      this.context.relevantMemories.forEach((mem, i) => {
        parts.push(`${i + 1}. ${mem}`);
      });
      parts.push("");
    }

    if (this.context.documents.length > 0) {
      parts.push("Relevant documents from knowledge base:");
      this.context.documents.forEach((doc, i) => {
        parts.push(`${i + 1}. ${doc}`);
      });
      parts.push("");
    }

    return parts.join("\n");
  }

  // Process user message with tools
  async processMessage(
    messages: Array<{ role: string; content: string; name?: string }>,
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>
  ): Promise<{
    response: string;
    toolCalls?: ToolCall[];
    metadata: Record<string, unknown>;
  }> {
    // Build the full message list with context
    const contextPrompt = this.buildContextPrompt();

    let systemPrompt = this.config.systemPrompt || "";
    if (contextPrompt) {
      systemPrompt += "\n\n" + contextPrompt;
    }

    // Add current conversation to working memory
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    this.addToWorkingMemory(`User: ${lastUserMessage}`);

    // Prepare messages for AI
    const aiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      name: m.name,
    }));

    // Generate response
    const result = await this.aiService.generate(aiMessages, {
      systemPrompt: systemPrompt || undefined,
      tools,
    });

    // Add assistant response to working memory
    this.addToWorkingMemory(`Assistant: ${result.message}`);

    return {
      response: result.message,
      metadata: result.metadata || {},
    };
  }

  // Stream user message with tools
  async *streamMessage(
    messages: Array<{ role: string; content: string; name?: string }>,
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>
  ): AsyncGenerator<{
    type: "text" | "tool-call" | "done" | "error";
    content: string;
    toolCallId?: string;
    toolName?: string;
  }> {
    const contextPrompt = this.buildContextPrompt();

    let systemPrompt = this.config.systemPrompt || "";
    if (contextPrompt) {
      systemPrompt += "\n\n" + contextPrompt;
    }

    const aiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      name: m.name,
    }));

    for await (const chunk of this.aiService.stream(aiMessages, {
      systemPrompt: systemPrompt || undefined,
      tools,
    })) {
      if (chunk.type === "tool-call") {
        const toolCall = JSON.parse(chunk.content);
        yield {
          type: "tool-call",
          content: chunk.content,
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
        };
      } else if (chunk.type === "error") {
        yield { type: "error", content: chunk.content };
      } else if (chunk.type !== "done") {
        yield { type: "text", content: chunk.content };
      } else {
        yield { type: "done", content: "" };
      }
    }
  }
}

// ============================================================================
// Agent Manager - Factory and Registry
// ============================================================================

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private createAIService: (provider: string, model: string) => AIService;

  constructor(
    createAIServiceFn: (provider: string, model: string) => AIService
  ) {
    this.createAIService = createAIServiceFn;
  }

  // Create a new agent
  create(config: AgentConfig): Agent {
    const aiService = this.createAIService(config.modelProvider, config.modelName);
    const agent = new Agent(config, aiService);
    this.agents.set(config.id, agent);
    return agent;
  }

  // Get an agent by ID
  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  // Remove an agent
  remove(id: string): boolean {
    return this.agents.delete(id);
  }

  // List all agent IDs
  list(): string[] {
    return Array.from(this.agents.keys());
  }

  // Get all agent configurations
  listConfigs(): AgentConfig[] {
    return Array.from(this.agents.values()).map((agent) => agent.getConfig());
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Generate a unique agent ID
export function generateAgentId(): string {
  return `agent_${nanoid(16)}`;
}

// Validate agent configuration
export function validateAgentConfig(config: Partial<AgentConfig>): string[] {
  const errors: string[] = [];

  if (!config.name?.trim()) {
    errors.push("Agent name is required");
  }

  if (!config.modelProvider) {
    errors.push("Model provider is required");
  }

  if (!config.modelName) {
    errors.push("Model name is required");
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push("Temperature must be between 0 and 2");
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    errors.push("Max tokens must be at least 1");
  }

  return errors;
}

// Create default agent config
export function createDefaultConfig(userId: string, name: string): AgentConfig {
  return {
    id: generateAgentId(),
    userId,
    name,
    modelProvider: "anthropic",
    modelName: "claude-3-5-sonnet-20241022",
    personality: {},
    systemPrompt: defaultPersonalityPrompts.general,
    temperature: 0.7,
    maxTokens: 4096,
    tools: [],
    isPublic: false,
    metadata: {},
  };
}