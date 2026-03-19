# @my-ai-stack/db

Database package for the AI Agent platform. Uses Drizzle ORM with PostgreSQL and pgvector.

## Structure

```
src/
├── schema/           # Database schemas
│   ├── auth.ts      # User, session, account tables
│   ├── agents.ts    # Agent, conversation, message tables
│   ├── ai.ts        # Memory, tool, workflow, document tables
│   ├── infra.ts     # API keys, usage logs, notifications
│   └── index.ts     # Schema exports
└── index.ts         # Database client
```

## Installation

```bash
bun install @my-ai-stack/db
```

## Usage

```typescript
import { db } from "@my-ai-stack/db";
import { agent } from "@my-ai-stack/db/schema";

// Query agents
const agents = await db.select().from(agent);

// Insert agent
await db.insert(agent).values({
  name: "My Agent",
  modelProvider: "openai",
  modelName: "gpt-4",
});
```

## Database Commands

```bash
# Generate migrations
bun drizzle-kit generate

# Run migrations
bun drizzle-kit migrate

# Open studio
bun drizzle-kit studio
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/my_aistack"
```
