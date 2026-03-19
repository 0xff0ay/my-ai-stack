# @my-ai-stack/api

Type-safe API layer using oRPC. Provides REST endpoints for the AI Agent platform.

## Structure

```
src/
├── routers/           # oRPC route definitions
│   ├── index.ts      # Main app router
│   ├── agents.ts     # Agent CRUD
│   ├── chat.ts       # Streaming chat
│   ├── conversations.ts
│   ├── memories.ts
│   ├── tools.ts
│   ├── workflows.ts
│   ├── documents.ts
│   └── knowledge-graph.ts
└── index.ts          # API configuration
```

## Installation

```bash
bun install @my-ai-stack/api
```

## Usage

```typescript
import { createORPCClient } from "@orpc/client";
import type { AppRouter } from "@my-ai-stack/api";

const client = createORPCClient<AppRouter>({
  baseURL: "http://localhost:3001",
});

// Call API
const agents = await client.agents.list({ limit: 10 });
```

## Routers

| Router | Endpoints |
|--------|-----------|
| `agents` | list, create, update, delete |
| `chat` | send (streaming) |
| `conversations` | list, create, messages |
| `memories` | list, create, search, delete |
| `tools` | list, create, execute, update |
| `workflows` | list, create, trigger, runs |
| `documents` | list, create, process, search |
| `knowledgeGraph` | createNode, createEdge, search |

## Adding New Routes

```typescript
// src/routers/my-feature.ts
import { protectedProcedure } from "../index";
import { z } from "zod";

export const myFeatureRouter = {
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      return { id: input.id, data: "result" };
    }),
};
```

Then add to main router:
```typescript
// src/routers/index.ts
import { myFeatureRouter } from "./my-feature";

export const appRouter = {
  // ... other routers
  myFeature: myFeatureRouter,
};
```
