<script setup lang="ts">
interface Props {
  data: any;
  name?: string;
  expandLevel?: number;
  theme?: 'dark' | 'light';
}

const props = withDefaults(defineProps<Props>(), {
  name: 'root',
  expandLevel: 1,
  theme: 'dark',
});

const expanded = ref<Set<string>>(new Set());

const typeColors: Record<string, string> = {
  string: '#00ff88',
  number: '#ffaa00',
  boolean: '#00aaff',
  null: '#ff6666',
  key: '#00ffff',
};

function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isExpandable(value: any): boolean {
  const type = getType(value);
  return type === 'object' || type === 'array';
}

function getPreview(value: any): string {
  const type = getType(value);
  if (type === 'array') return `Array(${value.length})`;
  if (type === 'object') return `{${Object.keys(value).length}}`;
  return String(value);
}

function toggle(path: string) {
  const newSet = new Set(expanded.value);
  if (newSet.has(path)) {
    newSet.delete(path);
  } else {
    newSet.add(path);
  }
  expanded.value = newSet;
}

function isExpanded(path: string, level: number): boolean {
  return expanded.value.has(path) || level < props.expandLevel;
}

function formatValue(value: any): string {
  const type = getType(value);
  if (type === 'string') return `"${value}"`;
  if (type === 'null') return 'null';
  return String(value);
}

function getValueColor(value: any): string {
  const type = getType(value);
  if (type === 'string') return typeColors.string;
  if (type === 'number') return typeColors.number;
  if (type === 'boolean') return typeColors.boolean;
  if (type === 'null') return typeColors.null;
  return typeColors.key;
}
</script>

<template>
  <div class="tui-json-viewer" :class="`tui-json-viewer-${theme}`">
    <div class="tui-json-content">
      <JsonNode
        :data="data"
        :name="name"
        :path="name"
        :level="0"
        :expanded="expanded"
        :expand-level="expandLevel"
        @toggle="toggle"
      />
    </div>
  </div>
</template>

<script lang="ts">
// Recursive component for JSON nodes
interface JsonNodeProps {
  data: any;
  name: string;
  path: string;
  level: number;
  expanded: Set<string>;
  expandLevel: number;
}

const JsonNode = defineComponent({
  name: 'JsonNode',
  props: {
    data: { type: null as any, required: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    level: { type: Number, required: true },
    expanded: { type: Object as () => Set<string>, required: true },
    expandLevel: { type: Number, required: true },
  },
  emits: ['toggle'],
  setup(props: JsonNodeProps, { emit }) {
    const typeColors = {
      string: '#00ff88',
      number: '#ffaa00',
      boolean: '#00aaff',
      null: '#ff6666',
      key: '#00ffff',
    };

    function getType(value: any): string {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    }

    function isExpandable(value: any): boolean {
      const type = getType(value);
      return type === 'object' || type === 'array';
    }

    function getPreview(value: any): string {
      const type = getType(value);
      if (type === 'array') return `Array(${value.length})`;
      if (type === 'object') return `{${Object.keys(value).length}}`;
      return String(value);
    }

    function isExpanded(): boolean {
      return props.expanded.has(props.path) || props.level < props.expandLevel;
    }

    function formatValue(value: any): string {
      const type = getType(value);
      if (type === 'string') return `"${value}"`;
      if (type === 'null') return 'null';
      return String(value);
    }

    function getValueColor(value: any): string {
      const type = getType(value);
      if (type === 'string') return typeColors.string;
      if (type === 'number') return typeColors.number;
      if (type === 'boolean') return typeColors.boolean;
      if (type === 'null') return typeColors.null;
      return typeColors.key;
    }

    function toggle() {
      emit('toggle', props.path);
    }

    return {
      getType,
      isExpandable,
      getPreview,
      isExpanded,
      formatValue,
      getValueColor,
      toggle,
    };
  },
  template: `
    <div class="tui-json-node">
      <div class="tui-json-line" :style="{ paddingLeft: level * 20 + 'px' }">
        <span 
          v-if="isExpandable(data)" 
          class="tui-json-toggle"
          @click="toggle"
        >
          {{ isExpanded() ? '▼' : '▶' }}
        </span>
        <span v-else class="tui-json-spacer" />
        
        <span class="tui-json-key">{{ name }}:</span>
        
        <template v-if="!isExpandable(data)">
          <span class="tui-json-value" :style="{ color: getValueColor(data) }">
            {{ formatValue(data) }}
          </span>
        </template>
        
        <template v-else-if="!isExpanded()">
          <span class="tui-json-preview">{{ getPreview(data) }}</span>
        </template>
      </div>
      
      <template v-if="isExpandable(data) && isExpanded()">
        <div v-for="(value, key) in data" :key="path + '.' + key">
          <JsonNode
            :data="value"
            :name="getType(data) === 'array' ? key : key"
            :path="path + '.' + key"
            :level="level + 1"
            :expanded="expanded"
            :expand-level="expandLevel"
            @toggle="$emit('toggle', $event)"
          />
        </div>
        <div 
          class="tui-json-line tui-json-close" 
          :style="{ paddingLeft: level * 20 + 'px' }"
        >
          {{ getType(data) === 'array' ? ']' : '}' }}
        </div>
      </template>
    </div>
  `,
});
</script>

<style scoped>
.tui-json-viewer {
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--tui-font-mono);
}

.tui-json-viewer::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-json-content {
  padding: var(--tui-spacing-md);
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.tui-json-node {
  line-height: 1.6;
}

.tui-json-line {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  white-space: nowrap;
}

.tui-json-toggle {
  cursor: pointer;
  color: var(--tui-text-muted);
  font-size: 0.625rem;
  width: 12px;
  text-align: center;
  user-select: none;
}

.tui-json-toggle:hover {
  color: var(--tui-primary);
}

.tui-json-spacer {
  width: 12px;
}

.tui-json-key {
  color: var(--tui-primary);
}

.tui-json-value {
  font-size: var(--tui-font-size-sm);
}

.tui-json-preview {
  color: var(--tui-text-muted);
  font-size: var(--tui-font-size-xs);
}

.tui-json-close {
  color: var(--tui-text-secondary);
}
</style>
