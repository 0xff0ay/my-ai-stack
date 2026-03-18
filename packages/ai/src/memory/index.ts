// ============================================================================
// Memory System - Multi-tier memory architecture
// ============================================================================

import { nanoid } from "nanoid";

import type { Memory, MemoryType } from "../types.js";
import { EmbeddingService, createEmbeddingService } from "../embeddings/index.js";

// Memory importance thresholds
const HIGH_IMPORTANCE = 8;
const MEDIUM_IMPORTANCE = 5;
const LOW_IMPORTANCE = 2;

// Memory decay rates
const DECAY_RATE = 0.95; // Per access

// ============================================================================
// Memory Entry
// ============================================================================

export interface MemoryEntry {
  id: string;
  content: string;
  type: MemoryType;
  importance: number;
  accessCount: number;
  embedding?: number[];
  createdAt: Date;
  lastAccessedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Short-term Memory (Conversation Buffer)
// ============================================================================

export class ShortTermMemory {
  private buffer: Array<{ role: string; content: string; timestamp: Date }> = [];
  private maxSize: number;

  constructor(maxSize = 20) {
    this.maxSize = maxSize;
  }

  // Add to conversation buffer
  add(role: "user" | "assistant", content: string): void {
    this.buffer.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep buffer bounded
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize);
    }
  }

  // Get recent messages
  getRecent(count: number = 10): Array<{ role: string; content: string }> {
    return this.buffer.slice(-count);
  }

  // Get full buffer
  getAll(): Array<{ role: string; content: string }> {
    return [...this.buffer];
  }

  // Clear buffer
  clear(): void {
    this.buffer = [];
  }

  // Get as context string
  toContextString(): string {
    return this.buffer
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");
  }

  // Get token count estimate
  getTokenCount(): number {
    return Math.ceil(
      this.buffer.reduce((sum, m) => sum + m.content.length, 0) / 4
    );
  }
}

// ============================================================================
// Long-term Memory (Vector Store)
// ============================================================================

export class LongTermMemory {
  private memories: Map<string, MemoryEntry> = new Map();
  private embeddingService: EmbeddingService;
  private userId: string;
  private agentId?: string;

  constructor(
    userId: string,
    agentId?: string,
    embeddingService?: EmbeddingService
  ) {
    this.userId = userId;
    this.agentId = agentId;
    this.embeddingService = embeddingService || createEmbeddingService();
  }

  // Store a new memory
  async store(content: string, type: MemoryType = "episodic", importance = 5): Promise<MemoryEntry> {
    const memory: MemoryEntry = {
      id: `mem_${nanoid(12)}`,
      content,
      type,
      importance,
      accessCount: 0,
      createdAt: new Date(),
    };

    // Generate embedding for semantic search
    try {
      memory.embedding = await this.embeddingService.embed(content);
    } catch {
      // Embedding generation failed, store without embedding
    }

    this.memories.set(memory.id, memory);
    return memory;
  }

  // Retrieve relevant memories
  async retrieve(query: string, limit = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.embeddingService.embed(query);
    const memories = Array.from(this.memories.values());

    if (memories.length === 0) return [];

    // Calculate similarity scores
    const scored = memories
      .filter((m) => m.embedding)
      .map((m) => ({
        memory: m,
        score: this.embeddingService.cosineSimilarity(queryEmbedding, m.embedding!),
      }))
      .filter((m) => m.score > 0.5) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Update access counts
    for (const { memory } of scored) {
      memory.accessCount++;
      memory.lastAccessedAt = new Date();
    }

    return scored.map((s) => s.memory);
  }

  // Get all memories of a type
  getByType(type: MemoryType): MemoryEntry[] {
    return Array.from(this.memories.values()).filter((m) => m.type === type);
  }

  // Get all memories
  getAll(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  // Delete a memory
  delete(id: string): boolean {
    return this.memories.delete(id);
  }

  // Consolidate - apply importance decay and cleanup
  consolidate(): number {
    let deleted = 0;

    for (const [id, memory] of this.memories) {
      // Apply decay based on access
      if (memory.accessCount > 0) {
        memory.importance *= Math.pow(DECAY_RATE, memory.accessCount);
      }

      // Delete low-importance memories that haven't been accessed recently
      const daysSinceAccess = memory.lastAccessedAt
        ? (Date.now() - memory.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
        : (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (memory.importance < LOW_IMPORTANCE && daysSinceAccess > 30) {
        this.memories.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  // Get importance distribution
  getImportanceStats(): { high: number; medium: number; low: number } {
    const memories = this.getAll();
    return {
      high: memories.filter((m) => m.importance >= HIGH_IMPORTANCE).length,
      medium: memories.filter((m) => m.importance >= MEDIUM_IMPORTANCE && m.importance < HIGH_IMPORTANCE)
        .length,
      low: memories.filter((m) => m.importance < LOW_IMPORTANCE).length,
    };
  }
}

// ============================================================================
// Working Memory (Current Task Context)
// ============================================================================

export class WorkingMemory {
  private context: Map<string, unknown> = new Map();
  private taskStack: Array<{ task: string; status: "pending" | "in_progress" | "completed" }> = [];
  private variables: Map<string, unknown> = new Map();

  // Set context value
  set(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  // Get context value
  get<T = unknown>(key: string): T | undefined {
    return this.context.get(key) as T | undefined;
  }

  // Delete context value
  delete(key: string): boolean {
    return this.context.delete(key);
  }

  // Get all context
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.context);
  }

  // Clear all context
  clear(): void {
    this.context.clear();
    this.taskStack = [];
    this.variables.clear();
  }

  // Task management
  pushTask(task: string): void {
    this.taskStack.push({ task, status: "pending" });
  }

  completeTask(): void {
    const task = this.taskStack.find((t) => t.status === "in_progress");
    if (task) {
      task.status = "completed";
    }
  }

  getCurrentTask(): string | undefined {
    const task = this.taskStack.find((t) => t.status === "in_progress");
    return task?.task;
  }

  // Variable management
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  getVariable<T = unknown>(name: string): T | undefined {
    return this.variables.get(name) as T | undefined;
  }

  // Serialize to string for context
  toContextString(): string {
    const parts: string[] = [];

    if (this.taskStack.length > 0) {
      const current = this.taskStack.filter((t) => t.status === "in_progress");
      if (current.length > 0) {
        parts.push(`Current task: ${current[0].task}`);
      }
    }

    const contextObj = this.getAll();
    if (Object.keys(contextObj).length > 0) {
      parts.push(`Context: ${JSON.stringify(contextObj)}`);
    }

    return parts.join("\n");
  }
}

// ============================================================================
// Memory Manager - Coordinates all memory tiers
// ============================================================================

export class MemoryManager {
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;
  private working: WorkingMemory;

  constructor(userId: string, agentId?: string, embeddingService?: EmbeddingService) {
    this.shortTerm = new ShortTermMemory();
    this.longTerm = new LongTermMemory(userId, agentId, embeddingService);
    this.working = new WorkingMemory();
  }

  // Add to short-term memory
  addToShortTerm(role: "user" | "assistant", content: string): void {
    this.shortTerm.add(role, content);
  }

  // Store in long-term memory
  async storeMemory(
    content: string,
    type: MemoryType = "episodic",
    importance = 5
  ): Promise<MemoryEntry> {
    return this.longTerm.store(content, type, importance);
  }

  // Retrieve from long-term memory
  async retrieveMemories(query: string, limit = 5): Promise<MemoryEntry[]> {
    return this.longTerm.retrieve(query, limit);
  }

  // Get relevant context for current query
  async getContextForQuery(query: string): Promise<string> {
    // Get relevant long-term memories
    const memories = await this.longTerm.retrieve(query, 3);

    // Get recent short-term memory
    const recentShortTerm = this.shortTerm.getRecent(5);

    // Get working memory context
    const workingContext = this.working.toContextString();

    // Build context string
    const parts: string[] = [];

    if (workingContext) {
      parts.push(`Working context:\n${workingContext}`);
    }

    if (memories.length > 0) {
      parts.push(
        `Relevant memories:\n${memories.map((m) => `- ${m.content}`).join("\n")}`
      );
    }

    if (recentShortTerm.length > 0) {
      parts.push(
        `Recent conversation:\n${recentShortTerm.map((m) => `${m.role}: ${m.content}`).join("\n")}`
      );
    }

    return parts.join("\n\n");
  }

  // Mark important interaction for long-term storage
  async markForLongTerm(
    content: string,
    type: MemoryType = "episodic",
    importance = 7
  ): Promise<void> {
    await this.longTerm.store(content, type, importance);
  }

  // Consolidate memory (cleanup)
  consolidate(): { deleted: number; stats: { high: number; medium: number; low: number } } {
    const deleted = this.longTerm.consolidate();
    const stats = this.longTerm.getImportanceStats();
    return { deleted, stats };
  }

  // Clear all memory tiers
  clearAll(): void {
    this.shortTerm.clear();
    this.working.clear();
  }

  // Get short-term memory
  getShortTerm(): ShortTermMemory {
    return this.shortTerm;
  }

  // Get long-term memory
  getLongTerm(): LongTermMemory {
    return this.longTerm;
  }

  // Get working memory
  getWorking(): WorkingMemory {
    return this.working;
  }

  // Get total token count estimate
  getTotalTokenCount(): number {
    return this.shortTerm.getTokenCount();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Create memory manager for user/agent
export function createMemoryManager(
  userId: string,
  agentId?: string,
  embeddingService?: EmbeddingService
): MemoryManager {
  return new MemoryManager(userId, agentId, embeddingService);
}

// Determine importance from message content
export function estimateImportance(content: string): number {
  let importance = 5; // Base importance

  // Check for indicators of important content
  const importantIndicators = [
    /important/i,
    /remember/i,
    /don't forget/i,
    /crucial/i,
    /critical/i,
    /key point/i,
    /decision/i,
    /preference/i,
    /always/i,
    /never/i,
  ];

  for (const indicator of importantIndicators) {
    if (indicator.test(content)) {
      importance += 1;
    }
  }

  // Check message length (longer messages tend to be more important)
  if (content.length > 500) {
    importance += 1;
  }

  return Math.min(10, importance);
}