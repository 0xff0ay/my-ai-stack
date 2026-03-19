# Database Schema Documentation

## Overview

The database schema is built using **Drizzle ORM** with **PostgreSQL** and **pgvector** for vector storage.

## Schema Files

### 1. Auth Schema (`packages/db/src/schema/auth.ts`)

**Tables:**
- `user` - User accounts and profiles
- `session` - Active sessions
- `account` - OAuth provider accounts

### 2. Agents Schema (`packages/db/src/schema/agents.ts`)

**Tables:**
- `agent` - AI agent configurations
- `conversation` - Chat sessions
- `message` - Chat messages with metadata

### 3. AI Schema (`packages/db/src/schema/ai.ts`)

**Tables:**
- `memory` - Vector-indexed memories
- `document` - Parsed documents
- `documentChunk` - Document chunks for RAG
- `tool` - Registered tools
- `agentTool` - Tool assignments to agents
- `workflow` - Automation workflows
- `workflowRun` - Workflow execution history

### 4. Infrastructure Schema (`packages/db/src/schema/infra.ts`)

**Tables:**
- `apiKey` - API key management
- `usageLog` - Token usage tracking
- `notification` - User notifications

### 5. Knowledge Schema (`packages/db/src/schema/knowledge.ts`)

**Tables:**
- `knowledgeNode` - Knowledge graph nodes
- `knowledgeEdge` - Knowledge graph relationships

## Table Details

### Agent Table
```typescript
{
  id: string
  userId: string
  name: string
  description: string
  systemPrompt: string
  modelProvider: "openai" | "anthropic" | "google" | "ollama"
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  contextWindow: number
  toolsEnabled: boolean
  memoryEnabled: boolean
  ragEnabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Memory Table
```typescript
{
  id: string
  userId: string
  agentId: string
  content: string
  type: "episodic" | "semantic" | "procedural"
  importance: "low" | "medium" | "high" | "critical"
  embedding: number[] // pgvector
  sourceType: string
  sourceId: string
  accessCount: number
  lastAccessedAt: Date
  createdAt: Date
  expiresAt: Date
}
```

### Tool Table
```typescript
{
  id: string
  userId: string
  name: string
  description: string
  code: string
  parameters: JSON
  status: "active" | "inactive" | "error"
  version: number
  isPublic: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Workflow Table
```typescript
{
  id: string
  userId: string
  name: string
  description: string
  nodes: JSON // Workflow nodes
  edges: JSON // Workflow connections
  triggerType: "manual" | "scheduled" | "webhook" | "event"
  scheduleConfig: JSON // For scheduled triggers
  isActive: boolean
  lastRunAt: Date
  createdAt: Date
  updatedAt: Date
}
```

## Indexes

All tables include appropriate indexes for:
- Primary keys
- Foreign key relationships
- Full-text search (using GIN indexes)
- Vector similarity search (using pgvector ivfflat)

## Relationships

```
user (1) ────► (*) agent
user (1) ────► (*) memory
user (1) ────► (*) conversation
agent (1) ────► (*) message
conversation (1) ────► (*) message
agent (*) ────► (*) tool (via agentTool)
```

## Migrations

Generate migrations:
```bash
cd packages/db
bun drizzle-kit generate
```

Run migrations:
```bash
bun drizzle-kit migrate
```

## TypeScript Types

All schemas export TypeScript types for use in the application:

```typescript
import { agent, type Agent } from "@my-ai-stack/db/schema";

// Insert type
const newAgent: typeof agent.$inferInsert = {
  name: "My Agent",
  modelProvider: "openai",
  modelName: "gpt-4",
};

// Select type
const agents: (typeof agent.$inferSelect)[] = await db.select().from(agent);
```
