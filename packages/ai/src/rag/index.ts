// ============================================================================
// RAG Service - Retrieval-Augmented Generation
// ============================================================================

import { nanoid } from "nanoid";

import type { Document, DocumentChunk, RetrievalResult } from "../types.js";
import { EmbeddingService, createEmbeddingService } from "../embeddings/index.js";

// Chunking strategies
export type ChunkStrategy = "recursive" | "semantic" | "fixed" | "sliding";

interface ChunkOptions {
  strategy?: ChunkStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

interface ChunkResult {
  chunks: Array<{
    id: string;
    content: string;
    chunkIndex: number;
    metadata?: Record<string, unknown>;
  }>;
  totalChunks: number;
}

// Retrieval options
interface RetrievalOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, unknown>;
}

// ============================================================================
// Document Chunking
// ============================================================================

export class DocumentChunker {
  private defaultOptions: Required<ChunkOptions>;

  constructor(options: ChunkOptions = {}) {
    this.defaultOptions = {
      strategy: options.strategy || "recursive",
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separators: options.separators || ["\n\n", "\n", ". ", " ", ""],
    };
  }

  // Chunk document content
  chunk(text: string, options?: ChunkOptions): ChunkResult {
    const opts = { ...this.defaultOptions, ...options };

    switch (opts.strategy) {
      case "recursive":
        return this.recursiveChunk(text, opts);
      case "fixed":
        return this.fixedChunk(text, opts);
      case "sliding":
        return this.slidingChunk(text, opts);
      case "semantic":
        // Semantic chunking requires NLP - use recursive as fallback
        return this.recursiveChunk(text, opts);
      default:
        return this.recursiveChunk(text, opts);
    }
  }

  // Recursive chunking - splits on multiple separator levels
  private recursiveChunk(text: string, opts: Required<ChunkOptions>): ChunkResult {
    const chunks: ChunkResult["chunks"] = [];

    function splitText(
      text: string,
      separators: string[],
      minChunkSize: number
    ): string[] {
      // If text is small enough, return as-is
      if (text.length <= minChunkSize) {
        return [text];
      }

      const separator = separators[0];
      const remainingSeparators = separators.slice(1);

      if (!separator) {
        // No more separators, return fixed-size chunk
        const result: string[] = [];
        for (let i = 0; i < text.length; i += minChunkSize) {
          result.push(text.slice(i, i + minChunkSize));
        }
        return result;
      }

      const parts = text.split(separator);

      // If splitting worked and parts are small enough, return them
      if (parts.length > 1 && parts.every((p) => p.length <= minChunkSize)) {
        return parts;
      }

      // Otherwise, recursively split each part
      const result: string[] = [];
      for (const part of parts) {
        if (part.trim()) {
          result.push(...splitText(part, remainingSeparators, minChunkSize));
        }
      }

      return result;
    }

    const rawChunks = splitText(text, opts.separators, opts.chunkSize - opts.chunkOverlap);

    // Merge small chunks and create final output
    const mergedChunks: string[] = [];
    let currentChunk = "";

    for (const chunk of rawChunks) {
      if (currentChunk.length + chunk.length <= opts.chunkSize) {
        currentChunk += (currentChunk ? opts.separators[0] : "") + chunk;
      } else {
        if (currentChunk) {
          mergedChunks.push(currentChunk);
        }
        // Start new chunk, but allow some overlap
        currentChunk = chunk.slice(-opts.chunkOverlap) + (chunk.slice(-opts.chunkOverlap) ? opts.separators[0] : "") + chunk;
      }
    }

    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }

    // Create chunk objects
    mergedChunks.forEach((content, index) => {
      if (content.trim()) {
        chunks.push({
          id: `chunk_${nanoid(12)}`,
          content: content.trim(),
          chunkIndex: index,
        });
      }
    });

    return {
      chunks,
      totalChunks: chunks.length,
    };
  }

  // Fixed-size chunking (simple character-based)
  private fixedChunk(text: string, opts: Required<ChunkOptions>): ChunkResult {
    const chunks: ChunkResult["chunks"] = [];
    let index = 0;

    while (index < text.length) {
      const chunk = text.slice(index, index + opts.chunkSize);
      if (chunk.trim()) {
        chunks.push({
          id: `chunk_${nanoid(12)}`,
          content: chunk.trim(),
          chunkIndex: chunks.length,
        });
      }
      index += opts.chunkSize;
    }

    return {
      chunks,
      totalChunks: chunks.length,
    };
  }

  // Sliding window chunking with overlap
  private slidingChunk(text: string, opts: Required<ChunkOptions>): ChunkResult {
    const chunks: ChunkResult["chunks"] = [];
    let index = 0;

    while (index < text.length) {
      const chunk = text.slice(index, index + opts.chunkSize);
      if (chunk.trim()) {
        chunks.push({
          id: `chunk_${nanoid(12)}`,
          content: chunk.trim(),
          chunkIndex: chunks.length,
        });
      }
      index += opts.chunkSize - opts.chunkOverlap;
    }

    return {
      chunks,
      totalChunks: chunks.length,
    };
  }
}

// ============================================================================
// RAG Service
// ============================================================================

export class RAGService {
  private embeddingService: EmbeddingService;
  private chunker: DocumentChunker;

  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || createEmbeddingService();
    this.chunker = new DocumentChunker();
  }

  // Process a document - chunk and embed
  async processDocument(
    document: Document,
    options?: ChunkOptions
  ): Promise<{
    chunks: Array<{ id: string; content: string; chunkIndex: number; embedding: number[] }>;
    totalChunks: number;
  }> {
    if (!document.content) {
      throw new Error("Document has no content to process");
    }

    // Chunk the document
    const chunkResult = this.chunker.chunk(document.content, options);

    // Extract text from chunks for embedding
    const texts = chunkResult.chunks.map((c) => c.content);

    // Generate embeddings in batch
    const embeddingResult = await this.embeddingService.embedBatch(texts);

    // Combine chunks with embeddings
    const chunksWithEmbeddings = chunkResult.chunks.map((chunk, index) => ({
      id: chunk.id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      embedding: embeddingResult.embeddings[index]?.embedding || [],
    }));

    return {
      chunks: chunksWithEmbeddings,
      totalChunks: chunkResult.totalChunks,
    };
  }

  // Retrieve relevant chunks for a query
  async retrieve(
    query: string,
    chunks: DocumentChunk[],
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    const limit = options.limit || 5;
    const minScore = options.minScore || 0.0;

    // Embed the query
    const queryEmbedding = await this.embeddingService.embed(query);

    // Calculate similarity scores
    const results: Array<{ chunk: DocumentChunk; score: number }> = [];

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;

      const score = this.embeddingService.cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      );

      if (score >= minScore) {
        results.push({ chunk, score });
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ chunk, score }) => ({
        chunk,
        score,
        citations: [chunk.id],
      }));
  }

  // Build context from retrieved chunks
  buildContext(
    results: RetrievalResult[],
    options?: {
      maxLength?: number;
      includeCitations?: boolean;
    }
  ): string {
    const maxLength = options?.maxLength || 4000;
    const includeCitations = options?.includeCitations ?? true;

    const parts: string[] = [];
    let currentLength = 0;

    for (const result of results) {
      const chunkContent = result.chunk.content;
      const citation = includeCitations
        ? `\n[Source: ${result.chunk.id}]`
        : "";

      const chunkWithCitation = chunkContent + citation;

      if (currentLength + chunkWithCitation.length > maxLength) {
        break;
      }

      parts.push(chunkWithCitation);
      currentLength += chunkWithCitation.length;
    }

    return parts.join("\n\n---\n\n");
  }

  // Re-rank results using cross-encoder (simple implementation)
  reRank(query: string, results: RetrievalResult[], topK = 5): RetrievalResult[] {
    // Simple keyword-based re-ranking
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scoredResults = results.map((result) => {
      const content = result.chunk.content.toLowerCase();
      let score = result.score;

      // Boost score for exact matches
      for (const term of queryTerms) {
        if (content.includes(term)) {
          score += 0.1;
        }
        // Boost for exact phrase matches
        if (content.includes(query.toLowerCase())) {
          score += 0.2;
        }
      }

      return { ...result, score };
    });

    return scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // Get chunker instance
  getChunker(): DocumentChunker {
    return this.chunker;
  }

  // Set custom chunker
  setChunker(chunker: DocumentChunker): void {
    this.chunker = chunker;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Create RAG service with default config
export function createRAGService(embeddingService?: EmbeddingService): RAGService {
  return new RAGService(embeddingService);
}

// Simple text extraction (placeholder - would integrate with actual document parsers)
export async function extractTextFromFile(
  file: File | Buffer,
  type: string
): Promise<string> {
  // This would integrate with libraries like pdf-parse, mammoth, etc.
  // For now, return the content as-is if it's text

  if (type === "text/plain" || type === "text/markdown") {
    if (file instanceof Buffer) {
      return file.toString("utf-8");
    }
    return await file.text();
  }

  // Placeholder for other file types
  throw new Error(`Unsupported file type: ${type}`);
}

// Estimate token count (rough approximation)
export function estimateTokens(text: string): number {
  // Average token is ~4 characters
  return Math.ceil(text.length / 4);
}