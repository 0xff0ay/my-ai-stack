# TUI Component Library

The Terminal UI (TUI) component library provides a cyberpunk/hacker aesthetic for the AI Agent platform.

## Design Philosophy

- **Cyberpunk aesthetic**: Neon accents on dark backgrounds
- **Terminal inspiration**: Monospace fonts, ASCII art, box-drawing characters
- **Keyboard-first**: Vim-style navigation (hjkl)
- **Visual feedback**: Matrix rain, glitch effects, animated spinners

## Color Palette

```css
:root {
  /* Synthwave palette */
  --tui-cyan: #00f0ff;
  --tui-purple: #b829dd;
  --tui-pink: #ff0080;
  --tui-green: #00ff9f;
  --tui-yellow: #f0e800;
  --tui-red: #ff3333;
  
  /* Backgrounds */
  --tui-bg-primary: #0a0a0f;
  --tui-bg-secondary: #141419;
  --tui-bg-tertiary: #1e1e24;
}
```

## Component Categories

### Layout Components

#### TuiPanel
Main container with terminal-style borders.

```vue
<TuiPanel title="Agent Console" variant="primary">
  <p>Panel content here</p>
</TuiPanel>
```

**Props:**
- `title`: Panel title
- `variant`: `primary` | `secondary` | `accent`
- `collapsible`: Enable collapse/expand

#### TuiSplitPane
Resizable split view.

```vue
<TuiSplitPane direction="horizontal" :defaultSize="30">
  <template #left>Sidebar</template>
  <template #right>Main content</template>
</TuiSplitPane>
```

#### TuiTabs
Terminal-style tab navigation.

```vue
<TuiTabs v-model="activeTab">
  <TuiTab value="chat" label="Chat">
    Chat content
  </TuiTab>
  <TuiTab value="settings" label="Settings">
    Settings content
  </TuiTab>
</TuiTabs>
```

### Display Components

#### TuiTerminal
Scrollable terminal output.

```vue
<TuiTerminal :lines="logs" :typing="true" />
```

**Props:**
- `lines`: Array of strings to display
- `typing`: Enable typewriter effect
- `maxLines`: Maximum lines to show

#### TuiMatrixRain
Matrix-style falling characters.

```vue
<TuiMatrixRain 
  :active="loading" 
  :density="0.1"
  :speed="50"
/>
```

#### TuiAsciiArt
ASCII art display with animation.

```vue
<TuiAsciiArt :text="'HELLO'" effect="glitch" />
```

#### TuiProgress
Block-based progress bar.

```vue
<TuiProgress :value="75" :max="100" variant="cyan" />
```

### Input Components

#### TuiPrompt
Command-line style input.

```vue
<TuiPrompt 
  v-model="command"
  :prefix="'> '" 
  @submit="executeCommand"
/>
```

#### TuiCommandPalette
Quick command finder.

```vue
<TuiCommandPalette 
  :commands="commands"
  :open="paletteOpen"
  @select="runCommand"
/>
```

### Data Components

#### TuiTable
Terminal-style data table.

```vue
<TuiTable :data="agents" :columns="columns">
  <template #status="{ row }">
    <TuiBadge :variant="row.status">{{ row.status }}</TuiBadge>
  </template>
</TuiTable>
```

#### TuiTree
Hierarchical tree view.

```vue
<TuiTree :data="fileSystem" />
```

### Feedback Components

#### TuiAlert
Alert messages with icons.

```vue
<TuiAlert type="error" title="System Error">
  An unexpected error occurred
</TuiAlert>
```

#### TuiToast
Notification toasts.

```vue
<TuiToast 
  message="Agent deployed"
  type="success"
  :duration="3000"
/>
```

## Usage Example

```vue
<template>
  <div class="agent-console">
    <TuiPanel title="AI Agent Control Center" variant="primary">
      <TuiSplitPane direction="horizontal" :defaultSize="25">
        <template #left>
          <TuiTree :data="agentTree" @select="selectAgent" />
        </template>
        
        <template #right>
          <TuiTabs v-model="activeTab">
            <TuiTab value="chat" label="💬 Chat">
              <TuiTerminal :lines="messages" />
              <TuiPrompt 
                v-model="input" 
                prefix="> " 
                @submit="sendMessage"
              />
            </TuiTab>
            
            <TuiTab value="memory" label="🧠 Memory">
              <TuiTable :data="memories" :columns="memoryColumns" />
            </TuiTab>
            
            <TuiTab value="tools" label="🔧 Tools">
              <TuiTree :data="toolTree" />
            </TuiTab>
          </TuiTabs>
        </template>
      </TuiSplitPane>
    </TuiPanel>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('chat')
const input = ref('')
const messages = ref([])

function sendMessage(text) {
  messages.value.push(`> ${text}`)
  // ... agent response
}
</script>

<style>
.agent-console {
  height: 100vh;
  background: var(--tui-bg-primary);
  font-family: 'JetBrains Mono', monospace;
}
</style>
```

## All 35 Components

1. TuiAccordion
2. TuiAlert
3. TuiAsciiArt
4. TuiBadge
5. TuiBreadcrumb
6. TuiButton
7. TuiCalendar
8. TuiCard
9. TuiChart
10. TuiCheckbox
11. TuiCommandPalette
12. TuiDataGrid
13. TuiDialog
14. TuiDropdown
15. TuiFilePicker
16. TuiIcon
17. TuiInput
18. TuiMatrixRain
19. TuiMenu
20. TuiModal
21. TuiPanel
22. TuiProgress
23. TuiPrompt
24. TuiRadio
25. TuiScrollArea
26. TuiSelect
27. TuiSkeleton
28. TuiSpinner
29. TuiSplitPane
30. TuiTable
31. TuiTabs
32. TuiTerminal
33. TuiTimeline
34. TuiToast
35. TuiTree
