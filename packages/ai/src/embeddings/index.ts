// ============================================================================
// Embeddings - Vector embeddings for semantic search
// ============================================================================

import { createOpenAI } from "@ai-sdk/openai";

// Default embedding models
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;

// OpenAI embedding model prices (per 1M tokens)
const EMBEDDING_PRICING = {
  "text-embedding-3-small": { input: 0.00002 },
  "text-embedding-3-large": { input: 0.00013 },
  "text-embedding-ada-002": { input: 0.0001 },
};

interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  apiKey?: string;
}

interface EmbeddingResult {
  embedding: number[];
  index: number;
}

interface EmbeddingBatchResult {
  embeddings: EmbeddingResult[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
  cost: number;
}

// ============================================================================
// Embedding Service
// ============================================================================

export class EmbeddingService {
  private client: ReturnType<typeof createOpenAI>;
  private model: string;
  private dimensions: number;

  constructor(options: EmbeddingOptions = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY || "";

    this.client = createOpenAI({
      apiKey,
      // Use standard OpenAI endpoint (not Azure)
    });

    this.model = options.model || DEFAULT_EMBEDDING_MODEL;
    this.dimensions = options.dimensions || DEFAULT_EMBEDDING_DIMENSIONS;
  }

  // Embed a single text
  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0].embedding;
  }

  // Embed multiple texts in batch
  async embedBatch(texts: string[]): Promise<EmbeddingBatchResult> {
    if (texts.length === 0) {
      return {
        embeddings: [],
        model: this.model,
        usage: { promptTokens: 0, totalTokens: 0 },
        cost: 0,
      };
    }

    // Truncate texts to avoid token limits
    const truncatedTexts = texts.map((text) => this.truncateText(text));

    const response = await this.client.embeddings.create({
      model: this.model,
      input: truncatedTexts,
      dimensions: this.dimensions,
    });

    const pricing = EMBEDDING_PRICING[this.model as keyof typeof EMBEDDING_PRICING] || {
      input: 0.0001,
    };

    const totalTokens = response.usage?.total_tokens || 0;
    const cost = (totalTokens / 1_000_000) * pricing.input;

    return {
      embeddings: response.data.map((item) => ({
        embedding: item.embedding,
        index: item.index,
      })),
      model: this.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        totalTokens,
      },
      cost,
    };
  }

  // Calculate cosine similarity between two embeddings
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embedding dimensions must match");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  // Calculate euclidean distance between two embeddings
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embedding dimensions must match");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  // Calculate dot product between two embeddings
  dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embedding dimensions must match");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  // Normalize embedding vector
  normalize(embedding: number[]): number[] {
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );

    if (magnitude === 0) return embedding;

    return embedding.map((val) => val / magnitude);
  }

  // Truncate text to avoid token limits (rough estimate)
  private truncateText(text: string, maxChars = 8000): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  }

  // Get model info
  getModelInfo(): { model: string; dimensions: number } {
    return {
      model: this.model,
      dimensions: this.dimensions,
    };
  }

  // Update model
  setModel(model: string, dimensions?: number): void {
    this.model = model;
    if (dimensions) {
      this.dimensions = dimensions;
    }
  }
}

// ============================================================================
// Vector Store Interface (for pgvector integration)
// ============================================================================

export interface VectorStore {
  insert(vectors: Array<{ id: string; embedding: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
  search(queryEmbedding: number[], options?: { limit?: number; filter?: Record<string, unknown> }): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
  delete(ids: string[]): Promise<void>;
  upsert(vectors: Array<{ id: string; embedding: number[]; metadata?: Record<string, unknown> }>): Promise<void>;
}

// ============================================================================
// Helper Functions
// ============================================================================

// Create embedding service with default config
export function createEmbeddingService(options?: EmbeddingOptions): EmbeddingService {
  return new EmbeddingService(options);
}

// Batch embeddings for large texts
export async function* batchEmbed(
  service: EmbeddingService,
  texts: string[],
  batchSize = 100
): AsyncGenerator<EmbeddingBatchResult> {
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    yield await service.embedBatch(batch);
  }
}

// Find most similar embeddings
export function findMostSimilar(
  queryEmbedding: number[],
  candidates: Array<{ id: string; embedding: number[] }>,
  topK = 5
): Array<{ id: string; similarity: number }> {
  const similarities = candidates.map((candidate) => ({
    id: candidate.id,
    similarity: new EmbeddingService().cosineSimilarity(queryEmbedding, candidate.embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}