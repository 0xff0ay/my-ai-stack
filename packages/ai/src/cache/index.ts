// ============================================================================
// Semantic Caching - Vector similarity cache
// ============================================================================

// Cache entry with vector embedding
export interface CacheEntry<T> {
  key: string;
  value: T;
  embedding: number[];
  timestamp: Date;
  accessCount: number;
  lastAccessedAt: Date;
  ttl: number; // milliseconds
  tags: string[];
}

// Cache options
export interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number; // milliseconds
  similarityThreshold?: number; // 0-1
  vectorDimension?: number;
}

// Search result
export interface CacheSearchResult<T> {
  entry: CacheEntry<T>;
  similarity: number;
  isExactMatch: boolean;
}

// ============================================================================
// Vector similarity functions
// ============================================================================

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Calculate Euclidean distance
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }

  return Math.sqrt(sum);
}

// ============================================================================
// Semantic Cache
// ============================================================================

export class SemanticCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private similarityThreshold: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1000; // 1 hour
    this.similarityThreshold = options.similarityThreshold || 0.85;
  }

  // Generate cache key from text
  private generateKey(text: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // Set cache entry
  set(
    text: string,
    value: T,
    embedding: number[],
    options: {
      ttl?: number;
      tags?: string[];
    } = {}
  ): CacheEntry<T> {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(text);
    const now = new Date();

    const entry: CacheEntry<T> = {
      key,
      value,
      embedding,
      timestamp: now,
      accessCount: 0,
      lastAccessedAt: now,
      ttl: options.ttl || this.defaultTTL,
      tags: options.tags || [],
    };

    this.cache.set(key, entry);
    return entry;
  }

  // Get cache entry by exact text match
  get(text: string): CacheEntry<T> | undefined {
    const key = this.generateKey(text);
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = new Date();

    return entry;
  }

  // Search by vector similarity
  search(embedding: number[], limit = 5): CacheSearchResult<T>[] {
    const results: CacheSearchResult<T>[] = [];

    for (const entry of this.cache.values()) {
      // Skip expired entries
      if (this.isExpired(entry)) {
        continue;
      }

      const similarity = cosineSimilarity(embedding, entry.embedding);

      if (similarity >= this.similarityThreshold) {
        results.push({
          entry,
          similarity,
          isExactMatch: similarity > 0.99,
        });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  // Find similar entries
  findSimilar(text: string, embedding: number[]): CacheSearchResult<T> | undefined {
    const results = this.search(embedding, 1);
    return results.length > 0 ? results[0] : undefined;
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp.getTime();
    return age > entry.ttl;
  }

  // Evict least recently used entry
  private evictLRU(): void {
    let oldest: CacheEntry<T> | undefined;
    let oldestKey: string | undefined;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessedAt < oldest.lastAccessedAt) {
        oldest = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Delete entry
  delete(text: string): boolean {
    const key = this.generateKey(text);
    return this.cache.delete(key);
  }

  // Delete by key
  deleteByKey(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all entries
  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  clearExpired(): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Get cache stats
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    expiredEntries: number;
  } {
    let totalAccesses = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      if (this.isExpired(entry)) {
        expiredEntries++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccesses > 0 ? totalAccesses / (totalAccesses + this.cache.size) : 0,
      totalAccesses,
      expiredEntries,
    };
  }

  // Get all entries
  getAll(): CacheEntry<T>[] {
    return Array.from(this.cache.values()).filter((e) => !this.isExpired(e));
  }

  // Get entries by tag
  getByTag(tag: string): CacheEntry<T>[] {
    return this.getAll().filter((e) => e.tags.includes(tag));
  }

  // Update TTL for an entry
  updateTTL(text: string, newTTL: number): boolean {
    const key = this.generateKey(text);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    entry.ttl = newTTL;
    return true;
  }

  // Warm cache with entries
  warm(entries: Array<{ text: string; value: T; embedding: number[]; tags?: string[] }>): void {
    for (const entry of entries) {
      this.set(entry.text, entry.value, entry.embedding, { tags: entry.tags });
    }
  }
}

// ============================================================================
// Multi-tier Cache
// ============================================================================

export interface TieredCacheOptions extends CacheOptions {
  l1Size?: number; // In-memory cache
  l2Size?: number; // Redis/simulated cache
  l3Size?: number; // Disk/persistent cache
}

export class TieredSemanticCache<T> {
  private l1: SemanticCache<T>; // Memory
  private l2: SemanticCache<T>; // Redis
  private l3: SemanticCache<T>; // Disk

  private l1Hits = 0;
  private l2Hits = 0;
  private l3Hits = 0;
  private misses = 0;

  constructor(options: TieredCacheOptions = {}) {
    this.l1 = new SemanticCache<T>({
      maxSize: options.l1Size || 100,
      defaultTTL: options.defaultTTL,
      similarityThreshold: options.similarityThreshold,
    });

    this.l2 = new SemanticCache<T>({
      maxSize: options.l2Size || 1000,
      defaultTTL: options.defaultTTL ? options.defaultTTL * 2 : undefined,
      similarityThreshold: options.similarityThreshold,
    });

    this.l3 = new SemanticCache<T>({
      maxSize: options.l3Size || 10000,
      defaultTTL: options.defaultTTL ? options.defaultTTL * 4 : undefined,
      similarityThreshold: options.similarityThreshold,
    });
  }

  // Get from cache (checks all tiers)
  async get(text: string, embedding: number[]): Promise<T | undefined> {
    // Check L1 (memory)
    const l1Result = this.l1.get(text);
    if (l1Result) {
      this.l1Hits++;
      return l1Result.value;
    }

    // Check L1 by similarity
    const l1Similar = this.l1.findSimilar(text, embedding);
    if (l1Similar && l1Similar.similarity > 0.95) {
      this.l1Hits++;
      return l1Similar.entry.value;
    }

    // Check L2 (Redis)
    const l2Result = this.l2.get(text);
    if (l2Result) {
      this.l2Hits++;
      // Promote to L1
      this.l1.set(text, l2Result.value, l2Result.embedding, { tags: l2Result.tags });
      return l2Result.value;
    }

    const l2Similar = this.l2.findSimilar(text, embedding);
    if (l2Similar && l2Similar.similarity > 0.95) {
      this.l2Hits++;
      // Promote to L1
      this.l1.set(text, l2Similar.entry.value, l2Similar.entry.embedding, {
        tags: l2Similar.entry.tags,
      });
      return l2Similar.entry.value;
    }

    // Check L3 (Disk)
    const l3Result = this.l3.get(text);
    if (l3Result) {
      this.l3Hits++;
      // Promote to L1 and L2
      this.l1.set(text, l3Result.value, l3Result.embedding, { tags: l3Result.tags });
      this.l2.set(text, l3Result.value, l3Result.embedding, { tags: l3Result.tags });
      return l3Result.value;
    }

    const l3Similar = this.l3.findSimilar(text, embedding);
    if (l3Similar && l3Similar.similarity > 0.95) {
      this.l3Hits++;
      // Promote to L1 and L2
      this.l1.set(text, l3Similar.entry.value, l3Similar.entry.embedding, {
        tags: l3Similar.entry.tags,
      });
      this.l2.set(text, l3Similar.entry.value, l3Similar.entry.embedding, {
        tags: l3Similar.entry.tags,
      });
      return l3Similar.entry.value;
    }

    this.misses++;
    return undefined;
  }

  // Set in all tiers
  set(
    text: string,
    value: T,
    embedding: number[],
    options: { ttl?: number; tags?: string[] } = {}
  ): void {
    this.l1.set(text, value, embedding, options);
    this.l2.set(text, value, embedding, { ...options, ttl: options.ttl ? options.ttl * 2 : undefined });
    this.l3.set(text, value, embedding, { ...options, ttl: options.ttl ? options.ttl * 4 : undefined });
  }

  // Get tiered cache stats
  getStats(): {
    l1: ReturnType<SemanticCache<T>["getStats"]>;
    l2: ReturnType<SemanticCache<T>["getStats"]>;
    l3: ReturnType<SemanticCache<T>["getStats"]>;
    l1HitRate: number;
    l2HitRate: number;
    l3HitRate: number;
    overallHitRate: number;
  } {
    const total = this.l1Hits + this.l2Hits + this.l3Hits + this.misses;

    return {
      l1: this.l1.getStats(),
      l2: this.l2.getStats(),
      l3: this.l3.getStats(),
      l1HitRate: total > 0 ? this.l1Hits / total : 0,
      l2HitRate: total > 0 ? this.l2Hits / total : 0,
      l3HitRate: total > 0 ? this.l3Hits / total : 0,
      overallHitRate: total > 0 ? (this.l1Hits + this.l2Hits + this.l3Hits) / total : 0,
    };
  }

  // Clear all tiers
  clear(): void {
    this.l1.clear();
    this.l2.clear();
    this.l3.clear();
    this.l1Hits = 0;
    this.l2Hits = 0;
    this.l3Hits = 0;
    this.misses = 0;
  }
}

// ============================================================================
// Export singleton
// ============================================================================

export const semanticCache = new SemanticCache<string>({
  maxSize: 10000,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  similarityThreshold: 0.85,
});
