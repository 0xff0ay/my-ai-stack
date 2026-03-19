# @my-ai-stack/ai

AI engine package providing the core intelligence layer for the platform.

## Structure

```
src/
├── index.ts              # Main exports
├── agent.ts              # Agent runtime
├── providers/            # AI provider implementations
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── google.ts
│   └── ollama.ts
├── memory/               # Memory system
│   ├── short-term.ts
│   ├── long-term.ts
│   └── index.ts
├── rag.ts                # RAG engine
├── tools/                # Tool system
│   ├── registry.ts
│   └── executor.ts
├── embeddings.ts         # Vector embeddings
├── collaboration/        # Multi-agent orchestration
├── edge/                 # Cloudflare Workers deployment
├── cache/                # Semantic caching
├── budget/               # Token tracking
├── privacy/              # PII detection & masking
├── observability/        # Metrics & tracing
└── resilience/           # Circuit breakers & self-healing
```

## Installation

```bash
bun install @my-ai-stack/ai
```

## Usage

### Agent Runtime

```typescript
import { Agent } from "@my-ai-stack/ai";

const agent = new Agent({
  name: "My Agent",
  modelProvider: "openai",
  modelName: "gpt-4",
  systemPrompt: "You are a helpful assistant.",
});

const response = await agent.send("Hello!");
```

### Memory System

```typescript
import { ShortTermMemory, LongTermMemory } from "@my-ai-stack/ai/memory";

// Short-term conversation buffer
const stm = new ShortTermMemory({ maxSize: 10 });

// Long-term vector storage
const ltm = new LongTermMemory({
  embeddingService: openaiEmbeddings,
});

// Store memory
await ltm.store("Important fact", { agentId: "agent_123" });

// Search memories
const results = await ltm.search("relevant query", 5);
```

### RAG Engine

```typescript
import { RAGEngine } from "@my-ai-stack/ai";

const rag = new RAGEngine({
  chunker: new DocumentChunker(),
  retriever: new VectorRetriever(),
});

const answer = await rag.query("What is the project deadline?");
```

### Tool System

```typescript
import { ToolRegistry } from "@my-ai-stack/ai/tools";

const registry = new ToolRegistry();

// Register tool
registry.register({
  name: "calculator",
  description: "Perform calculations",
  execute: (input) => eval(input.expression),
});

// Execute tool
const result = await registry.execute("calculator", { expression: "2+2" });
```

### Privacy Guardian

```typescript
import { PrivacyGuardian } from "@my-ai-stack/ai/privacy";

const guardian = new PrivacyGuardian();

// Process text for PII
const result = guardian.process("Contact me at john@example.com");
console.log(result.processed); // "Contact me at jo***@ex***.com"
console.log(result.hasPII);    // true
```

### Budget Optimizer

```typescript
import { BudgetOptimizer } from "@my-ai-stack/ai/budget";

const budget = new BudgetOptimizer({ monthlyLimit: 100 });

// Record usage
budget.recordUsage({
  model: "gpt-4",
  promptTokens: 1000,
  completionTokens: 500,
});

// Get recommendations
const recommendations = budget.getRecommendations();
```

### Observability

```typescript
import { observability } from "@my-ai-stack/ai/observability";

// Record metrics
observability.metrics.increment("requests");
observability.metrics.histogram("response_time", 150);

// Create trace
const span = observability.tracer.startTrace("agent_request");
observability.tracer.endSpan(span.id);

// Log
observability.logger.info("Agent started", { agentId: "123" });
```

## Features Implemented

| Feature | Module | Status |
|---------|--------|--------|
| Multi-model support | `providers/` | ✅ |
| Memory system | `memory/` | ✅ |
| RAG engine | `rag.ts` | ✅ |
| Tool registry | `tools/` | ✅ |
| Collaboration | `collaboration/` | ✅ |
| Edge deployment | `edge/` | ✅ |
| Semantic caching | `cache/` | ✅ |
| Budget tracking | `budget/` | ✅ |
| Privacy (PII) | `privacy/` | ✅ |
| Observability | `observability/` | ✅ |
| Self-healing | `resilience/` | ✅ |
