<script setup lang="ts">
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  message: string;
  source?: string;
}

interface Props {
  logs: LogEntry[];
  maxLines?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showLevel?: boolean;
  showSource?: boolean;
  filter?: string;
  levelFilter?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  maxLines: 1000,
  autoScroll: true,
  showTimestamp: true,
  showLevel: true,
  showSource: false,
});

const emit = defineEmits<{
  clear: [];
}>();

const logContainer = ref<HTMLElement>();

const levelColors: Record<string, string> = {
  debug: 'var(--tui-text-muted)',
  info: 'var(--tui-info)',
  warn: 'var(--tui-warning)',
  error: 'var(--tui-error)',
  success: 'var(--tui-success)',
};

const levelIcons: Record<string, string> = {
  debug: '◆',
  info: 'ℹ',
  warn: '⚠',
  error: '✗',
  success: '✓',
};

const filteredLogs = computed(() => {
  let result = props.logs;
  
  if (props.filter) {
    const filterLower = props.filter.toLowerCase();
    result = result.filter(log => 
      log.message.toLowerCase().includes(filterLower) ||
      log.source?.toLowerCase().includes(filterLower)
    );
  }
  
  if (props.levelFilter?.length) {
    result = result.filter(log => props.levelFilter!.includes(log.level));
  }
  
  return result.slice(-props.maxLines);
});

function formatTime(timestamp: Date) {
  return timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function scrollToBottom() {
  if (props.autoScroll && logContainer.value) {
    nextTick(() => {
      logContainer.value!.scrollTop = logContainer.value!.scrollHeight;
    });
  }
}

watch(() => props.logs.length, scrollToBottom);
onMounted(scrollToBottom);
</script>

<template>
  <div class="tui-log">
    <div v-if="$slots.header" class="tui-log-header">
      <slot name="header" />
    </div>
    
    <div ref="logContainer" class="tui-log-container tui-scrollbar">
      <div class="tui-log-entries">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="tui-log-entry"
          :style="{ color: levelColors[log.level] }"
        >
          <span v-if="showTimestamp" class="tui-log-timestamp">
            [{{ formatTime(log.timestamp) }}]
          </span>
          
          <span v-if="showLevel" class="tui-log-level">
            {{ levelIcons[log.level] }}
          </span>
          
          <span v-if="showSource && log.source" class="tui-log-source">
            {{ log.source }}:
          </span>
          
          <span class="tui-log-message">{{ log.message }}</span>
        </div>
        
        <div v-if="filteredLogs.length === 0" class="tui-log-empty">
          No logs to display
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-log {
  display: flex;
  flex-direction: column;
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
}

.tui-log::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  border-bottom: 1px solid var(--tui-border-dim);
  background: var(--tui-bg-tertiary);
}

.tui-log-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--tui-spacing-sm) 0;
  max-height: 400px;
  min-height: 200px;
}

.tui-log-entries {
  display: flex;
  flex-direction: column;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  line-height: 1.6;
}

.tui-log-entry {
  display: flex;
  gap: var(--tui-spacing-sm);
  padding: 2px var(--tui-spacing-md);
  transition: background 0.1s ease;
}

.tui-log-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.tui-log-timestamp {
  color: var(--tui-text-muted);
  flex-shrink: 0;
}

.tui-log-level {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.tui-log-source {
  color: var(--tui-text-secondary);
  flex-shrink: 0;
}

.tui-log-message {
  flex: 1;
  word-break: break-word;
}

.tui-log-empty {
  padding: var(--tui-spacing-md);
  text-align: center;
  color: var(--tui-text-muted);
  font-style: italic;
}
</style>
