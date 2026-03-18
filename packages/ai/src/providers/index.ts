// ============================================================================
// Model Providers - Multi-model AI support with fallback chains
// ============================================================================

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  generateText,
  streamText,
  type LanguageModel,
  type GenerateTextResult,
  type StreamTextResult,
  type Message,
  convertToModelMessages,
} from "ai";

import type {
  ModelProvider,
  ModelName,
  AnthropicModel,
  OpenAIModel,
  GoogleModel,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  AIError,
  RateLimitError,
  ModelUnavailableError,
  ProviderChain,
  MessageMetadata,
} from "./types.js";

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// Provider to SDK mapping
const providerConfigs: Record<
  ModelProvider,
  {
    create: (model: string) => LanguageModel;
    supportsStreaming: boolean;
  }
> = {
  anthropic: {
    create: (model: string) => {
      const anthropic = createAnthropic({
        apiKey: ANTHROPIC_API_KEY,
      });
      return anthropic(model as AnthropicModel);
    },
    supportsStreaming: true,
  },
  openai: {
    create: (model: string) => {
      const openai = createOpenAI({
        apiKey: OPENAI_API_KEY,
      });
      return openai(model as OpenAIModel);
    },
    supportsStreaming: true,
  },
  google: {
    create: (model: string) => {
      const google = createGoogle({
        apiKey: GOOGLE_API_KEY,
      });
      return google(model as GoogleModel);
    },
    supportsStreaming: true,
  },
  ollama: {
    create: (model: string) => {
      const openai = createOpenAI({
        apiKey: "ollama",
        baseURL: OLLAMA_BASE_URL,
      });
      return openai(model as string);
    },
    supportsStreaming: false, // Ollama may not support streaming
  },
};

// Create language model from provider and model name
export function createModel(provider: ModelProvider, modelName: ModelName): LanguageModel {
  const config = providerConfigs[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return config.create(modelName);
}

// Check if provider supports streaming
export function supportsStreaming(provider: ModelProvider): boolean {
  return providerConfigs[provider]?.supportsStreaming ?? false;
}

// Default temperature settings per provider
export const defaultTemperatures: Record<ModelProvider, number> = {
  anthropic: 0.7,
  openai: 0.7,
  google: 0.9,
  ollama: 0.7,
};

// Default max tokens per provider
export const defaultMaxTokens: Record<ModelProvider, number> = {
  anthropic: 4096,
  openai: 4096,
  google: 8192,
  ollama: 2048,
};

// ============================================================================
// AI Service Class
// ============================================================================

export class AIService {
  private model: LanguageModel;
  private provider: ModelProvider;
  private modelName: ModelName;
  private temperature: number;
  private maxTokens: number;
  private systemPrompt?: string;

  constructor(
    provider: ModelProvider,
    modelName: ModelName,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ) {
    this.provider = provider;
    this.modelName = modelName;
    this.temperature = options?.temperature ?? defaultTemperatures[provider];
    this.maxTokens = options?.maxTokens ?? defaultMaxTokens[provider];
    this.systemPrompt = options?.systemPrompt;
    this.model = createModel(provider, modelName);
  }

  // Update model configuration
  setModel(provider: ModelProvider, modelName: ModelName): void {
    this.provider = provider;
    this.modelName = modelName;
    this.model = createModel(provider, modelName);
  }

  // Update temperature
  setTemperature(temperature: number): void {
    this.temperature = Math.max(0, Math.min(2, temperature));
  }

  // Update max tokens
  setMaxTokens(maxTokens: number): void {
    this.maxTokens = Math.max(1, maxTokens);
  }

  // Update system prompt
  setSystemPrompt(systemPrompt: string): void {
    this.systemPrompt = systemPrompt;
  }

  // Generate text (non-streaming)
  async generate(
    messages: Message[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
    }
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      const modelMessages = this.prepareMessages(messages, options?.systemPrompt);

      const result = await generateText({
        model: this.model,
        messages: modelMessages,
        temperature: options?.temperature ?? this.temperature,
        maxTokens: options?.maxTokens ?? this.maxTokens,
        tools: options?.tools,
      });

      const latency = Date.now() - startTime;
      const usage = result.usage;

      return {
        message: result.text,
        metadata: {
          modelProvider: this.provider,
          modelName: this.modelName,
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
          cost: this.estimateCost(usage?.promptTokens ?? 0, usage?.completionTokens ?? 0),
          latency,
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Stream text generation
  async *stream(
    messages: Message[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
    }
  ): AsyncGenerator<StreamChunk> {
    const modelMessages = this.prepareMessages(messages, options?.systemPrompt);

    try {
      const result = streamText({
        model: this.model,
        messages: modelMessages,
        temperature: options?.temperature ?? this.temperature,
        maxTokens: options?.maxTokens ?? this.maxTokens,
        tools: options?.tools,
      });

      for await (const chunk of result.textStream) {
        yield { type: "text", content: chunk };
      }

      // Handle tool calls if present
      for await (const chunk of result.toolCallStream) {
        if (chunk.toolCall) {
          yield {
            type: "tool-call" as const,
            content: JSON.stringify(chunk.toolCall),
            toolCallId: chunk.toolCall.id,
            toolName: chunk.toolCall.toolName,
          };
        }
      }

      yield { type: "done", content: "" };
    } catch (error) {
      const aiError = this.handleError(error);
      yield { type: "error", content: aiError.message };
    }
  }

  // Prepare messages for AI SDK
  private prepareMessages(
    messages: Message[],
    systemPrompt?: string
  ): Array<Message> {
    const allMessages: Array<Message> = [];

    // Add system prompt if provided
    const finalSystemPrompt = systemPrompt ?? this.systemPrompt;
    if (finalSystemPrompt) {
      allMessages.push({
        role: "system",
        content: finalSystemPrompt,
      });
    }

    // Convert and add user messages
    const modelMessages = convertToModelMessages(messages as Parameters<typeof convertToModelMessages>[0]);
    allMessages.push(...modelMessages);

    return allMessages;
  }

  // Estimate cost based on token usage
  private estimateCost(promptTokens: number, completionTokens: number): number {
    const rates: Record<ModelProvider, { prompt: number; completion: number }> = {
      anthropic: { prompt: 0.000015, completion: 0.000075 }, // Claude 3.5 Sonnet
      openai: { prompt: 0.000005, completion: 0.000015 }, // GPT-4o
      google: { prompt: 0.00000125, completion: 0.000005 }, // Gemini 1.5 Flash
      ollama: { prompt: 0, completion: 0 }, // Free
    };

    const rate = rates[this.provider];
    return promptTokens * rate.prompt + completionTokens * rate.completion;
  }

  // Handle errors and convert to AIError
  private handleError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Rate limiting
    if (errorMessage.includes("rate_limit") || errorMessage.includes("429")) {
      const retryAfter = 60; // Default 60 seconds
      return new RateLimitError(this.provider, retryAfter);
    }

    // Model not available
    if (errorMessage.includes("model_not_found") || errorMessage.includes("not found")) {
      return new ModelUnavailableError(this.provider, this.modelName);
    }

    // Generic error
    return new AIError(errorMessage, "UNKNOWN_ERROR", this.provider, false);
  }
}

// ============================================================================
// Provider Chain for Fallback
// ============================================================================

export class ProviderChainService {
  private chain: ProviderChain;
  private currentService: AIService;

  constructor(chain: ProviderChain) {
    this.chain = chain;
    const firstProvider = chain.providers[0];
    this.currentService = new AIService(firstProvider.provider, firstProvider.modelName);
  }

  // Generate with fallback
  async generate(
    messages: Message[],
    options?: Parameters<AIService["generate"]>[1]
  ): Promise<ChatResponse> {
    let lastError: AIError | null = null;

    for (let i = this.chain.currentIndex; i < this.chain.providers.length; i++) {
      const providerConfig = this.chain.providers[i];

      try {
        this.currentService.setModel(providerConfig.provider, providerConfig.modelName);
        return await this.currentService.generate(messages, options);
      } catch (error) {
        lastError = error instanceof AIError ? error : new AIError(
          String(error),
          "UNKNOWN_ERROR",
          providerConfig.provider,
          true
        );

        // Only retry if error is retryable
        if (!lastError.retryable) {
          throw lastError;
        }

        // Move to next provider
        this.chain.currentIndex = i + 1;
      }
    }

    throw lastError || new AIError("All providers failed", "CHAIN_EXHAUSTED", "anthropic");
  }

  // Stream with fallback
  async *stream(
    messages: Message[],
    options?: Parameters<AIService["stream"]>[1]
  ): AsyncGenerator<StreamChunk> {
    let lastError: AIError | null = null;

    for (let i = this.chain.currentIndex; i < this.chain.providers.length; i++) {
      const providerConfig = this.chain.providers[i];

      try {
        this.currentService.setModel(providerConfig.provider, providerConfig.modelName);

        // Check if provider supports streaming
        if (!supportsStreaming(providerConfig.provider)) {
          // Fallback to non-streaming
          const result = await this.currentService.generate(messages, options);
          yield { type: "text", content: result.message };
          yield { type: "done", content: "" };
          return;
        }

        for await (const chunk of this.currentService.stream(messages, options)) {
          yield chunk;
        }
        return;
      } catch (error) {
        lastError = error instanceof AIError ? error : new AIError(
          String(error),
          "UNKNOWN_ERROR",
          providerConfig.provider,
          true
        );

        if (!lastError.retryable) {
          yield { type: "error", content: lastError.message };
          throw lastError;
        }

        this.chain.currentIndex = i + 1;
      }
    }

    yield { type: "error", content: lastError?.message || "All providers failed" };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

// Create default AI service
export function createAIService(
  provider: ModelProvider = "anthropic",
  modelName: ModelName = "claude-3-5-sonnet-20241022",
  options?: Parameters<typeof AIService.prototype.constructor>[2]
): AIService {
  return new AIService(provider, modelName, options);
}

// Create provider chain for fallback
export function createProviderChain(
  providers: Array<{ provider: ModelProvider; modelName: ModelName }>
): ProviderChainService {
  return new ProviderChainService({
    providers,
    currentIndex: 0,
  });
}

// Get available models for a provider
export function getAvailableModels(provider: ModelProvider): ModelName[] {
  const models: Record<ModelProvider, ModelName[]> = {
    anthropic: [
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    google: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    ollama: ["llama3", "mistral", "codellama", "phi3"], // Common Ollama models
  };

  return models[provider] || [];
}