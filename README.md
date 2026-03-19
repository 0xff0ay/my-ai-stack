# My AI Stack - Advanced AI Agent Platform

> A comprehensive AI Agent platform with 34+ innovative features, built with the Better-T-Stack

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███╗   ███╗██╗   ██╗     █████╗ ██╗     ███████╗████████╗ █████╗ ██╗  ██║
║   ████╗ ████║╚██╗ ██╔╝    ██╔══██╗██║     ██╔════╝╚══██╔══╝██╔══██╗██║ ██╔╝║
║   ██╔████╔██║ ╚████╔╝     ███████║██║     ███████╗   ██║   ███████║█████╔╝ ║
║   ██║╚██╔╝██║  ╚██╔╝      ██╔══██║██║     ╚════██║   ██║   ██╔══██║██╔═██╗ ║
║   ██║ ╚═╝ ██║   ██║       ██║  ██║███████╗███████║   ██║   ██║  ██║██║  ██╗║
║   ╚═╝     ╚═╝   ╚═╝       ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝║
║                                                                           ║
║              🚀 Advanced AI Agent Platform (v1.0.0)                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## ✨ Features

### Core Architecture (7/7 Complete)
- ✅ **AI Agent Core** - Multi-model support (Claude, GPT-4, Gemini, Ollama)
- ✅ **Vector Search & RAG** - Hybrid search with chunking and re-ranking
- ✅ **Memory System** - Short/long-term memory with vector embeddings
- ✅ **Tools & Function Calling** - Dynamic registry and marketplace
- ✅ **TUI Components** - 35+ terminal-style UI components
- ✅ **Database Schema** - PostgreSQL + pgvector with Drizzle ORM
- ✅ **Type-Safe API** - oRPC routes with Zod validation

### Advanced Features (13/34 Implemented)
| # | Feature | Status | Module |
|---|---------|--------|--------|
| 5 | Agent Collaboration Network | ✅ | `packages/ai/src/collaboration` |
| 8 | Self-Healing System | ✅ | `packages/ai/src/resilience` |
| 13 | Edge Function Deployment | ✅ | `packages/ai/src/edge` |
| 15 | Observability Suite | ✅ | `packages/ai/src/observability` |
| 16 | Semantic Caching | ✅ | `packages/ai/src/cache` |
| 28 | Budget Optimizer | ✅ | `packages/ai/src/budget` |
| 29 | Privacy Guardian | ✅ | `packages/ai/src/privacy` |
| 20 | Workflow Automation | ✅ | `packages/api/src/routers/workflows` |
| 24 | Document Intelligence | ✅ | `packages/api/src/routers/documents` |
| 9 | Knowledge Graph | ✅ | `packages/api/src/routers/knowledge-graph` |

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Run database migrations
bun db:migrate

# Start Docker Compose (PostgreSQL + Redis)
docker-compose up -d
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Nuxt 4 + Vue 3 + TypeScript |
| **Runtime** | Bun |
| **API** | oRPC (type-safe RPC) |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL + pgvector |
| **Auth** | Better Auth |
| **Cache** | Redis |
| **Deployment** | Cloudflare Workers |

## 📁 Project Structure

```
my-ai-stack/
├── apps/
│   └── web/                    # Nuxt 4 frontend application
│       ├── app/
│       │   ├── components/     # Vue components
│       │   │   └── tui/        # TUI component library (35 components)
│       │   ├── assets/         # CSS, fonts, images
│       │   ├── layouts/        # Nuxt layouts
│       │   └── pages/          # Application routes
│       └── nuxt.config.ts
│
├── packages/
│   ├── db/                     # Database package
│   │   └── src/
│   │       ├── schema/         # Drizzle schema definitions
│   │       │   ├── auth.ts     # Users, sessions, accounts
│   │       │   ├── agents.ts   # Agents, conversations, messages
│   │       │   ├── ai.ts       # Memories, tools, workflows, documents
│   │       │   ├── infra.ts    # API keys, usage logs, notifications
│   │       │   └── knowledge.ts # Knowledge graph nodes and edges
│   │       └── index.ts        # Database client
│   │
│   ├── api/                    # API package
│   │   └── src/
│   │       ├── routers/        # oRPC routers
│   │       │   ├── index.ts    # Main app router
│   │       │   ├── agents.ts   # Agent CRUD operations
│   │       │   ├── chat.ts     # Streaming chat endpoints
│   │       │   ├── memories.ts # Memory management
│   │       │   ├── tools.ts    # Tool registry
│   │       │   ├── workflows.ts # Workflow automation
│   │       │   ├── documents.ts # Document management
│   │       │   └── knowledge-graph.ts # Knowledge graph queries
│   │       └── index.ts        # API configuration
│   │
│   └── ai/                     # AI engine package
│       └── src/
│           ├── index.ts        # Main exports
│           ├── agent.ts        # Agent runtime
│           ├── providers/      # AI provider implementations
│           ├── memory/         # Memory system
│           ├── rag.ts          # RAG engine
│           ├── tools/          # Tool system
│           ├── embeddings.ts   # Vector embeddings
│           ├── collaboration/  # Multi-agent orchestration
│           ├── edge/           # Cloudflare Workers
│           ├── cache/          # Semantic caching
│           ├── budget/         # Token tracking
│           ├── privacy/        # PII detection
│           ├── observability/  # Metrics & tracing
│           └── resilience/     # Circuit breakers
│
├── docker-compose.yml          # Local development services
├── turbo.json                  # Turborepo configuration
└── README.md                   # This file
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/my_aistack"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# Cloudflare (for edge deployment)
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_API_TOKEN="..."
```

## 🛠️ Development

```bash
# Run all packages in development mode
bun dev

# Run linting
bun lint

# Type check
bun typecheck

# Run database migrations
bun db:generate
bun db:migrate

# Seed database
bun db:seed
```

## 📊 API Documentation

### REST Endpoints (oRPC)

| Endpoint | Description |
|----------|-------------|
| `POST /api/agents.list` | List all agents |
| `POST /api/agents.create` | Create new agent |
| `POST /api/chat.send` | Send message (streaming) |
| `POST /api/memories.search` | Search memories by vector |
| `POST /api/tools.execute` | Execute tool |
| `POST /api/workflows.trigger` | Trigger workflow |
| `POST /api/documents.process` | Process document |

### WebSocket Events

```javascript
// Connect to real-time collaboration
const ws = new WebSocket('wss://api.my-aistack.com/ws');

// Join collaboration session
ws.send(JSON.stringify({
  type: 'join_session',
  sessionId: 'sess_123'
}));

// Listen for agent messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.agentId, ':', data.message);
};
```

## 🎨 TUI Design System

The Terminal UI design system provides a cyberpunk/hacker aesthetic:

```vue
<template>
  <TuiPanel title="Agent Console">
    <TuiMatrixRain v-if="loading" />
    <TuiTerminal :lines="logs" />
    <TuiPrompt v-model="input" @submit="send" />
  </TuiPanel>
</template>
```

**Available Components:**
- Layout: `TuiPanel`, `TuiSplitPane`, `TuiTabs`
- Display: `TuiTerminal`, `TuiAsciiArt`, `TuiMatrixRain`, `TuiProgress`
- Input: `TuiPrompt`, `TuiCommandPalette`, `TuiFilePicker`
- Data: `TuiTable`, `TuiTree`, `TuiChart`, `TuiTimeline`
- Feedback: `TuiAlert`, `TuiToast`, `TuiSpinner`, `TuiBadge`

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| API Response (p95) | < 100ms |
| Agent Response | < 2s (streaming < 500ms) |
| DB Queries (p95) | < 50ms |
| Memory per Agent | < 512MB |
| Concurrent Users | 10,000+ |
| WebSocket Connections | 50,000+ |

## 🧪 Testing

```bash
# Run unit tests
bun test

# Run integration tests
bun test:integration

# Run E2E tests
bun test:e2e
```

## 🚢 Deployment

### Cloudflare Workers (Edge)

```bash
# Deploy to Cloudflare
bun run deploy:edge
```

### Docker

```bash
# Build and run
docker-compose up -d
```

## 📚 Documentation

- [Architecture](./apps/docs/src/content/docs/architecture.md)
- [API Reference](./apps/docs/src/content/docs/api.md)
- [Database Schema](./apps/docs/src/content/docs/schema.md)
- [TUI Components](./apps/docs/src/content/docs/tui.md)
- [Contributing](./apps/docs/src/content/docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

---

<p align="center">
  Built with ❤️ using the <strong>Better-T-Stack</strong>
</p>

---

## Original Better-T-Stack README

<details>
<summary>Click to expand original project setup instructions</summary>

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack.

### Original Features
- **TypeScript** - For type safety
- **Nuxt** - The Intuitive Vue Framework
- **oRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Better-Auth** - Authentication
- **Turborepo** - Optimized monorepo

### Original Scripts
- `bun run dev`: Start all applications
- `bun run build`: Build all applications
- `bun run db:push`: Push schema changes
- `bun run check`: Format and lint

</details>
