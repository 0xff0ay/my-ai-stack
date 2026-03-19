<script setup lang="ts">
interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  category?: string;
  action: () => void;
}

interface Props {
  commands: Command[];
  placeholder?: string;
  maxResults?: number;
  groups?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type a command or search...',
  maxResults: 10,
  groups: true,
});

const emit = defineEmits<{
  select: [command: Command];
  close: [];
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement>();

const filteredCommands = computed(() => {
  if (!searchQuery.value) return props.commands;
  
  const query = searchQuery.value.toLowerCase();
  return props.commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query) ||
    cmd.category?.toLowerCase().includes(query)
  ).slice(0, props.maxResults);
});

const groupedCommands = computed(() => {
  if (!props.groups) return { 'All': filteredCommands.value };
  
  const groups: Record<string, Command[]> = {};
  filteredCommands.value.forEach(cmd => {
    const category = cmd.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(cmd);
  });
  return groups;
});

function open() {
  isOpen.value = true;
  searchQuery.value = '';
  selectedIndex.value = 0;
  nextTick(() => {
    inputRef.value?.focus();
  });
}

function close() {
  isOpen.value = false;
  emit('close');
}

function selectCommand(command: Command) {
  command.action();
  emit('select', command);
  close();
}

function handleKeydown(event: KeyboardEvent) {
  const commands = filteredCommands.value;
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = (selectedIndex.value + 1) % commands.length;
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = (selectedIndex.value - 1 + commands.length) % commands.length;
      break;
    case 'Enter':
      event.preventDefault();
      if (commands[selectedIndex.value]) {
        selectCommand(commands[selectedIndex.value]);
      }
      break;
    case 'Escape':
      event.preventDefault();
      close();
      break;
  }
}

function handleShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    open();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleShortcut);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleShortcut);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="tui-palette">
      <div v-if="isOpen" class="tui-command-palette-overlay" @click="close">
        <div class="tui-command-palette" @click.stop>
          <div class="tui-command-palette-header">
            <span class="tui-command-palette-search-icon">⌘</span>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              class="tui-command-palette-input"
              :placeholder="placeholder"
              @keydown="handleKeydown"
            />
            <button type="button" class="tui-command-palette-close" @click="close">
              ESC
            </button>
          </div>
          
          <div class="tui-command-palette-results">
            <div v-if="filteredCommands.length === 0" class="tui-command-palette-empty">
              No commands found
            </div>
            
            <template v-else>
              <div 
                v-for="(cmds, category) in groupedCommands" 
                :key="category"
                class="tui-command-palette-group"
              >
                <div class="tui-command-palette-category">{{ category }}</div>
                
                <button
                  v-for="(command, index) in cmds"
                  :key="command.id"
                  type="button"
                  class="tui-command-palette-item"
                  :class="{ 
                    'tui-command-palette-item-selected': 
                      filteredCommands.indexOf(command) === selectedIndex 
                  }"
                  @click="selectCommand(command)"
                >
                  <span v-if="command.icon" class="tui-command-palette-icon">
                    {{ command.icon }}
                  </span>
                  <span class="tui-command-palette-label">{{ command.label }}</span>
                  <span v-if="command.shortcut" class="tui-command-palette-shortcut">
                    {{ command.shortcut }}
                  </span>
                </button>
              </div>
            </template>
          </div>
          
          <div class="tui-command-palette-footer">
            <span class="tui-command-palette-hint">
              <kbd>↑↓</kbd> to navigate
            </span>
            <span class="tui-command-palette-hint">
              <kbd>↵</kbd> to select
            </span>
            <span class="tui-command-palette-hint">
              <kbd>esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tui-command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 1000;
}

.tui-command-palette {
  background: var(--tui-bg-secondary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.tui-command-palette::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-command-palette-header {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-md);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-command-palette-search-icon {
  color: var(--tui-text-muted);
  font-size: var(--tui-font-size-lg);
}

.tui-command-palette-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--tui-text-primary);
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-base);
  outline: none;
}

.tui-command-palette-input::placeholder {
  color: var(--tui-text-muted);
}

.tui-command-palette-close {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-xs);
  padding: 4px 8px;
  background: var(--tui-bg-tertiary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  color: var(--tui-text-muted);
  cursor: pointer;
}

.tui-command-palette-results {
  flex: 1;
  overflow-y: auto;
  font-family: var(--tui-font-mono);
}

.tui-command-palette-empty {
  padding: var(--tui-spacing-xl);
  text-align: center;
  color: var(--tui-text-muted);
  font-style: italic;
}

.tui-command-palette-group {
  padding: var(--tui-spacing-sm) 0;
}

.tui-command-palette-category {
  padding: var(--tui-spacing-xs) var(--tui-spacing-md);
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.tui-command-palette-item {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  width: 100%;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: transparent;
  border: none;
  color: var(--tui-text-primary);
  font-family: inherit;
  font-size: var(--tui-font-size-sm);
  cursor: pointer;
  transition: var(--tui-transition);
  text-align: left;
}

.tui-command-palette-item:hover,
.tui-command-palette-item-selected {
  background: var(--tui-bg-tertiary);
  color: var(--tui-primary);
}

.tui-command-palette-icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.tui-command-palette-label {
  flex: 1;
}

.tui-command-palette-shortcut {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  background: var(--tui-bg-primary);
  padding: 2px 6px;
  border-radius: 2px;
}

.tui-command-palette-footer {
  display: flex;
  gap: var(--tui-spacing-md);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  border-top: 1px solid var(--tui-border-dim);
  background: var(--tui-bg-tertiary);
}

.tui-command-palette-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
}

.tui-command-palette-hint kbd {
  font-family: var(--tui-font-mono);
  padding: 2px 4px;
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  font-size: 10px;
}

.tui-palette-enter-active,
.tui-palette-leave-active {
  transition: all 0.2s ease;
}

.tui-palette-enter-from,
.tui-palette-leave-to {
  opacity: 0;
}

.tui-palette-enter-from .tui-command-palette,
.tui-palette-leave-to .tui-command-palette {
  transform: scale(0.95) translateY(-10px);
}
</style>
