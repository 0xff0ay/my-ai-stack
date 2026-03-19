# My AI Stack Web Application

Nuxt 4 frontend application for the AI Agent platform with TUI (Terminal UI) design system.

## Features

- **TUI Design System** - 35+ cyberpunk/terminal-style components
- **Real-time Chat** - WebSocket-powered streaming conversations
- **Agent Management** - Create, configure, and deploy AI agents
- **Knowledge Base** - Document upload and semantic search
- **Workflow Builder** - Visual automation designer
- **Dark Mode** - Synthwave color palette optimized for long sessions

## Tech Stack

- **Nuxt 4** - Vue 3 meta-framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Pinia** - State management
- **VueUse** - Composition utilities

## Directory Structure

```
app/
├── components/
│   ├── tui/              # 35 TUI components
│   │   ├── TuiPanel.vue
│   │   ├── TuiTerminal.vue
│   │   ├── TuiMatrixRain.vue
│   │   └── ...
│   └── ui/               # Shadcn/ui components
├── assets/
│   └── css/
│       └── tui.css       # TUI design system styles
├── layouts/
│   └── default.vue
├── pages/
│   ├── index.vue
│   ├── agents/
│   ├── chat/
│   ├── documents/
│   └── workflows/
├── composables/           # Vue composables
└── utils/               # Utility functions
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun run build

# Type check
bun run typecheck
```

The development server runs at `http://localhost:3001`.

## TUI Components

The Terminal UI design system provides a cyberpunk aesthetic:

```vue
<template>
  <TuiPanel title="Agent Console">
    <TuiMatrixRain v-if="loading" />
    <TuiTerminal :lines="logs" :typing="true" />
    <TuiPrompt v-model="input" @submit="sendMessage" />
  </TuiPanel>
</template>
```

### Available Components

**Layout:**
- `TuiPanel` - Terminal-style panels
- `TuiSplitPane` - Resizable panes
- `TuiTabs` - Terminal tabs

**Display:**
- `TuiTerminal` - Scrollable terminal output
- `TuiMatrixRain` - Matrix animation
- `TuiAsciiArt` - ASCII art with effects
- `TuiProgress` - Block progress bars

**Input:**
- `TuiPrompt` - Command-line input
- `TuiCommandPalette` - Quick command finder
- `TuiFilePicker` - Terminal file picker

**Data:**
- `TuiTable` - Data tables
- `TuiTree` - Tree view
- `TuiChart` - Charts
- `TuiTimeline` - Timeline view

## Environment Variables

```env
NUXT_PUBLIC_API_URL="http://localhost:3001"
NUXT_PUBLIC_WS_URL="ws://localhost:3001"
```

## API Integration

The app uses oRPC client for type-safe API calls:

```typescript
const { data: agents } = await useFetch('/api/agents.list', {
  method: 'POST',
  body: { limit: 10 }
})
```
