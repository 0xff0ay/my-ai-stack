# 🎮 My AI Stack - Virtual AI Agent Platform

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=my-ai-stack&style=flat-square&color=ff6b6b&label=Profile+Views" alt="Profile Views">
  <img src="https://img.shields.io/github/stars/0xff0ay/my-ai-stack?style=flat-square&color=ffd93d" alt="Stars">
  <img src="https://img.shields.io/github/forks/0xff0ay/my-ai-stack?style=flat-square&color=6bcb77" alt="Forks">
  <img src="https://img.shields.io/github/license/0xff0ay/my-ai-stack?style=flat-square&color=4d96ff" alt="License">
  <img src="https://img.shields.io/github/last-commit/0xff0ay/my-ai-stack?style=flat-square&color=ff6b6b" alt="Last Commit">
</p>

> 🔮 A comprehensive AI Agent platform with 34+ innovative features, built with the Better-T-Stack ✨

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                  ║
║    █████╗  ██████╗ ██████╗███████╗     ██████╗ ███████╗ ██████╗ ██████╗  █████╗ ██████╗ ██████╗  ║
║   ██╔══██╗██╔════╝██╔════╝██╔════╝    ██╔═══██╗██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗ ║
║   ███████║██║     ██║     █████╗      ██║   ██║█████╗  ██║   ██║██████╔╝███████║██████╔╝██║  ██║ ║
║   ██╔══██║██║     ██║     ██╔══╝      ██║   ██║██╔══╝  ██║   ██║██╔══██╗██╔══██║██╔══██╗██║  ██║ ║
║   ██║  ██║╚██████╗╚██████╗███████╗    ╚██████╔╝██║     ╚██████╔╝██║  ██║██║  ██║██║  ██║██████╔╝ ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝     ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ║
║                                                                                                  ║
║                        🌀 🅼🆈 🅰🅸 🆂🆃🅰🅲🅺 🅿🅻🅰🆃🅵🅾🆁🅼 (v1.0.0) 🌀                                      ║
║                                                                                                  ║
║                           🎭 Created by 0xff & Lily Yang 🎭                                     ║
║                                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Quick Start

```bash
# 🌟 Install dependencies
bun install

# 🎬 Start development server
bun dev

# 🗄️ Run database migrations
bun db:migrate

# 🐳 Start Docker Compose (PostgreSQL + Redis)
docker-compose up -d

# 🎯 Build for production
bun build

# 🔍 Check code quality
bun check
```

---

## ✨ Features

### 🎯 Core Architecture (7/7 ✅)

| # | Feature | Status |
|---|---------|--------|
| 🧠 | **AI Agent Core** | ✅ |
| 🔍 | **Vector Search & RAG** | ✅ |
| 🧩 | **Memory System** | ✅ |
| 🛠️ | **Tools & Function Calling** | ✅ |
| 💻 | **TUI Components** | ✅ |
| 🗄️ | **Database Schema** | ✅ |
| 🔐 | **Type-Safe API** | ✅ |

### 🌟 Advanced Features (13/34 🚀)

| # | Feature | Module | Status |
|---|---------|--------|--------|
| 🤝 | Agent Collaboration Network | `collaboration` | ✅ |
| 🔄 | Self-Healing System | `resilience` | ✅ |
| 🌐 | Edge Function Deployment | `edge` | ✅ |
| 📊 | Observability Suite | `observability` | ✅ |
| 💾 | Semantic Caching | `cache` | ✅ |
| 💰 | Budget Optimizer | `budget` | ✅ |
| 🔒 | Privacy Guardian | `privacy` | ✅ |
| ⚡ | Workflow Automation | `workflows` | ✅ |
| 📄 | Document Intelligence | `documents` | ✅ |
| 🕸️ | Knowledge Graph | `knowledge-graph` | ✅ |
| 🔗 | Memory Sync | `memories` | ✅ |
| 🧰 | Tool Registry | `tools` | ✅ |
| 📡 | Real-time Events | `events` | ✅ |

---

## 🛠️ Tech Stack

<p align="center">

| Layer | Technology | Icon |
|-------|------------|------|
| 🎨 **Frontend** | Nuxt 4 + Vue 3 + TypeScript | ⚡️ |
| ⚡ **Runtime** | Bun | 🐰 |
| 🔌 **API** | oRPC (type-safe RPC) | 🔗 |
| 🗄️ **ORM** | Drizzle ORM | 🧊 |
| 💾 **Database** | PostgreSQL + pgvector | 🐘 |
| 🔐 **Auth** | Better Auth | 🛡️ |
| 🚀 **Cache** | Redis | 🔴 |
| ☁️ **Deployment** | Cloudflare Workers | ☁️ |
| 🎭 **AI Providers** | Claude, GPT-4, Gemini, Ollama | 🤖 |

</p>

---

## 📁 Project Structure

```
my-ai-stack/
├── 📂 apps/
│   ├── 🌐 web/                    # ✨ Nuxt 4 Frontend Application
│   │   ├── app/
│   │   │   ├── components/         # 🎨 Vue Components
│   │   │   │   └── tui/           # 💻 TUI Component Library (35+ 🎯)
│   │   │   ├── assets/            # 🎭 CSS, Fonts, Images
│   │   │   ├── layouts/           # 📐 Nuxt Layouts
│   │   │   └── pages/             # 🛤️ Application Routes
│   │   └── nuxt.config.ts
│   │
│   ├── 🖥️ desktop/                 # 🪟 Desktop App
│   │   └── README.md
│   │
│   └── 📱 native/                  # 📲 Mobile App (Expo)
│       └── README.md
│
├── 📦 packages/
│   ├── 🗄️ db/                     # 💾 Database Package
│   │   └── src/
│   │       ├── schema/             # 📋 Drizzle Schema
│   │       │   ├── auth.ts        # 👤 Users, Sessions, Accounts
│   │       │   ├── agents.ts     # 🤖 Agents, Conversations
│   │       │   ├── ai.ts         # 🧠 Memories, Tools, Workflows
│   │       │   └── infra.ts      # 🔧 API Keys, Usage Logs
│   │       └── index.ts           # 🔌 Database Client
│   │
│   ├── 🔌 api/                     # 🌐 API Package
│   │   └── src/
│   │       ├── routers/            # 🛤️ oRPC Routers
│   │       │   ├── index.ts      # 🏠 Main Router
│   │       │   ├── agents.ts     # 🤖 Agent CRUD
│   │       │   ├── chat.ts       # 💬 Streaming Chat
│   │       │   ├── memories.ts   # 🧠 Memory Management
│   │       │   ├── tools.ts      # 🛠️ Tool Registry
│   │       │   ├── workflows.ts  # ⚡ Workflow Automation
│   │       │   ├── documents.ts  # 📄 Document Intelligence
│   │       │   └── knowledge-graph.ts # 🕸️ Knowledge Graph
│   │       └── index.ts          # ⚙️ API Config
│   │
│   └── 🤖 ai/                      # 🧠 AI Engine Package
│       └── src/
│           ├── index.ts           # 📦 Main Exports
│           ├── agent.ts          # 🤖 Agent Runtime
│           ├── providers/        # 🔌 AI Providers
│           ├── memory/           # 🧠 Memory System
│           ├── rag.ts            # 🔍 RAG Engine
│           ├── tools/            # 🛠️ Tool System
│           ├── embeddings.ts    # 📊 Vector Embeddings
│           ├── collaboration/    # 🤝 Multi-Agent
│           ├── edge/            # 🌐 Cloudflare Workers
│           ├── cache/           # 💾 Semantic Cache
│           ├── budget/          # 💰 Token Tracking
│           ├── privacy/         # 🔒 PII Detection
│           ├── observability/   # 📊 Metrics & Tracing
│           └── resilience/      # 🔄 Circuit Breakers
│
├── 🐳 docker-compose.yml          # 🐳 Docker Services
├── ⚙️ turbo.json                  # 🌀 Turborepo Config
└── 📖 README.md                   # 📖 This File
```

---

## 🎨 TUI Design System

> 💻 Terminal UI Design System with Cyberpunk/Hacker Aesthetic

### 🎯 Available Components

| Category | Icon | Components |
|----------|------|------------|
| 📐 Layout | 📦 | `TuiPanel`, `TuiSplitPane`, `TuiTabs`, `TuiAccordion` |
| 📺 Display | 🖥️ | `TuiTerminal`, `TuiAsciiArt`, `TuiMatrixRain`, `TuiProgress` |
| ✏️ Input | ⌨️ | `TuiPrompt`, `TuiCommandPalette`, `TuiFilePicker`, `TuiInput` |
| 📊 Data | 📈 | `TuiTable`, `TuiTree`, `TuiChart`, `TuiTimeline` |
| 💬 Feedback | 💭 | `TuiAlert`, `TuiToast`, `TuiSpinner`, `TuiBadge` |
| 🎭 Special | 🌟 | `TuiChat`, `TuiMenu`, `TuiDropdown`, `TuiModal` |

```vue
<template>
  <TuiPanel title="🤖 Agent Console">
    <TuiMatrixRain v-if="loading" />
    <TuiTerminal :lines="logs" />
    <TuiPrompt v-model="input" @submit="send" />
  </TuiPanel>
</template>
```

---

## 🔧 Environment Variables

```env
# 🗄️ Database
DATABASE_URL="postgresql://user:pass@localhost:5432/my_aistack"

# 🔐 Better Auth
BETTER_AUTH_SECRET="your-secret-key"

# 🤖 AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."
OLLAMA_BASE_URL="http://localhost:11434"

# ☁️ Cloudflare (for edge deployment)
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_API_TOKEN="..."

# 🔴 Redis (optional)
REDIS_URL="redis://localhost:6379"
```

---

## 📊 API Documentation

### 🌐 REST Endpoints (oRPC)

| Endpoint | Description | Icon |
|----------|-------------|------|
| `POST /api/agents.list` | List all agents | 📋 |
| `POST /api/agents.create` | Create new agent | ➕ |
| `POST /api/chat.send` | Send message (streaming) | 💬 |
| `POST /api/memories.search` | Search memories by vector | 🔍 |
| `POST /api/tools.execute` | Execute tool | 🛠️ |
| `POST /api/workflows.trigger` | Trigger workflow | ⚡ |
| `POST /api/documents.process` | Process document | 📄 |

### 🔗 WebSocket Events

```javascript
// 🎯 Connect to real-time collaboration
const ws = new WebSocket('wss://api.my-aistack.com/ws');

// 🤝 Join collaboration session
ws.send(JSON.stringify({
  type: 'join_session',
  sessionId: 'sess_123'
}));

// 📥 Listen for agent messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`🤖 ${data.agentId}:`, data.message);
};
```

---

## 📈 Performance Targets

| Metric | Target | Icon |
|--------|--------|------|
| API Response (p95) | < 100ms | ⚡ |
| Agent Response | < 2s | 🤖 |
| DB Queries (p95) | < 50ms | 🗄️ |
| Memory per Agent | < 512MB | 💾 |
| Concurrent Users | 10,000+ | 👥 |
| WebSocket Connections | 50,000+ | 🔗 |

---

## 🧪 Testing

```bash
# 🧪 Run unit tests
bun test

# 🔄 Run integration tests
bun test:integration

# 🎯 Run E2E tests
bun test:e2e
```

---

## 🚢 Deployment

### ☁️ Cloudflare Workers (Edge)

```bash
# 🚀 Deploy to Cloudflare
bun run deploy:edge
```

### 🐳 Docker

```bash
# 🔨 Build and run
docker-compose up -d
```

---

## 🎭 Contributors

<p align="center">
  <img src="https://img.shields.io/github/contributors/0xff0ay/my-ai-stack?style=flat-square&color=ff6b6b" alt="Contributors">
</p>

| Avatar | Name | Role |
|--------|------|------|
| 🦊 | **0xff** | Creator & Lead Developer |
| 🌸 | **Lily Yang** | Co-Creator & Designer |
| 🤖 | **Contributors** | Community |

---

## 📚 Documentation

| Icon | Document |
|------|----------|
| 🏗️ | [Architecture](./apps/docs/src/content/docs/architecture.md) |
| 🔌 | [API Reference](./apps/docs/src/content/docs/api.md) |
| 🗄️ | [Database Schema](./apps/docs/src/content/docs/schema.md) |
| 💻 | [TUI Components](./apps/docs/src/content/docs/tui.md) |
| 🤝 | [Contributing](./apps/docs/src/content/docs/contributing.md) |

---

## 🤝 Contributing

```bash
# 🍴 Fork the repository
git clone https://github.com/0xff0ay/my-ai-stack.git

# 🌿 Create your feature branch
git checkout -b feature/amazing

# 💾 Commit your changes
git commit -m 'Add amazing feature ✨'

# 🚢 Push to the branch
git push origin feature/amazing

# 🎁 Open a Pull Request
```

---

## 📄 License

<p align="center">
  <img src="https://img.shields.io/github/license/0xff0ay/my-ai-stack?style=flat-square&color=4d96ff" alt="License">
</p>

MIT License - see [LICENSE](./LICENSE) file

---

## 🙏 Acknowledgments

<div align="center">

<p>
  Built with ❤️ using the <strong>Better-T-Stack</strong> 🛠️
</p>

<p>
  🔥 Powered by <strong>Vue</strong> + <strong>Nuxt</strong> + <strong>Bun</strong> + <strong>Drizzle</strong> + <strong>oRPC</strong> + <strong>Better Auth</strong>
</p>

<p>
  🌍 Made with 🎨 by <strong>0xff</strong> & <strong>Lily Yang</strong> from around the world 🌏
</p>

---

<p align="center">
  <strong>🌟 Star us on GitHub! 🌟</strong>
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=my-ai-stack&style=flat-square&color=ff6b6b" alt="Profile Views">
  <img src="https://img.shields.io/github/stars/0xff0ay/my-ai-stack?style=flat-square&color=ffd93d" alt="Stars">
  <img src="https://img.shields.io/github/forks/0xff0ay/my-ai-stack?style=flat-square&color=6bcb77" alt="Forks">
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

---

<div align="center">

```
🎭 🎮 🌀 𝑴𝒀 𝑨𝑰 𝑺𝑻𝑨𝑪𝑲 - 𝑽𝒊𝒓𝒕𝒖𝒂𝒍 𝑨𝑰 𝑨𝒈𝒆𝒏𝒕 𝑷𝒍𝒂𝒕𝒇𝒐𝒓𝒎 🌀 🎮 🎭
Created by 0xff & Lily Yang 🦊 🌸
Version 1.0.0 🎉
```

</div>
</div>