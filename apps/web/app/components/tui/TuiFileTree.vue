<script setup lang="ts">
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  expanded?: boolean;
  selected?: boolean;
  children?: FileNode[];
  size?: string;
  modified?: string;
  icon?: string;
}

interface Props {
  nodes: FileNode[];
  selectable?: boolean;
  multiSelect?: boolean;
  showIcons?: boolean;
  indentSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  selectable: true,
  multiSelect: false,
  showIcons: true,
  indentSize: 20,
});

const emit = defineEmits<{
  select: [node: FileNode];
  toggle: [node: FileNode];
  expand: [node: FileNode];
  collapse: [node: FileNode];
}>();

const expandedNodes = ref<Set<string>>(new Set());
const selectedNodes = ref<Set<string>>(new Set());

const fileIcons: Record<string, string> = {
  file: '📄',
  directory: '📁',
  js: '⚡',
  ts: '🔷',
  vue: '💚',
  json: '📋',
  md: '📝',
  css: '🎨',
  html: '🌐',
  py: '🐍',
  go: '🐹',
  rs: '🦀',
  git: '⚙️',
};

function getIcon(node: FileNode) {
  if (node.icon) return node.icon;
  if (node.type === 'directory') return expandedNodes.value.has(node.id) ? '📂' : '📁';
  
  const ext = node.name.split('.').pop()?.toLowerCase();
  return fileIcons[ext || ''] || fileIcons.file;
}

function isExpanded(node: FileNode) {
  return expandedNodes.value.has(node.id) || node.expanded;
}

function isSelected(node: FileNode) {
  return selectedNodes.value.has(node.id) || node.selected;
}

function toggleExpand(node: FileNode) {
  if (node.type !== 'directory') return;
  
  const newSet = new Set(expandedNodes.value);
  if (newSet.has(node.id)) {
    newSet.delete(node.id);
    emit('collapse', node);
  } else {
    newSet.add(node.id);
    emit('expand', node);
  }
  expandedNodes.value = newSet;
}

function handleSelect(node: FileNode) {
  if (!props.selectable || node.type === 'directory') return;
  
  const newSet = props.multiSelect 
    ? new Set(selectedNodes.value)
    : new Set<string>();
    
  if (newSet.has(node.id)) {
    newSet.delete(node.id);
  } else {
    newSet.add(node.id);
  }
  selectedNodes.value = newSet;
  emit('select', node);
}

function handleClick(node: FileNode) {
  if (node.type === 'directory') {
    toggleExpand(node);
  } else {
    handleSelect(node);
  }
}
</script>

<template>
  <div class="tui-file-tree">
    <ul class="tui-file-tree-list">
      <template v-for="node in nodes" :key="node.id">
        <li
          class="tui-file-tree-node"
          :class="{
            'tui-file-tree-node-selected': isSelected(node),
            'tui-file-tree-node-directory': node.type === 'directory'
          }"
        >
          <div
            class="tui-file-tree-row"
            :style="{ paddingLeft: `${indentSize}px` }"
            @click="handleClick(node)"
          >
            <span 
              v-if="node.type === 'directory' && node.children?.length" 
              class="tui-file-tree-toggle"
              :class="{ 'tui-file-tree-expanded': isExpanded(node) }"
            >
              ▶
            </span>
            <span v-else class="tui-file-tree-spacer" />
            
            <span v-if="showIcons" class="tui-file-tree-icon">{{ getIcon(node) }}</span>
            <span class="tui-file-tree-name">{{ node.name }}</span>
            
            <span v-if="node.size" class="tui-file-tree-meta">{{ node.size }}</span>
            <span v-if="node.modified" class="tui-file-tree-meta">{{ node.modified }}</span>
          </div>
          
          <ul v-if="node.type === 'directory' && isExpanded(node) && node.children?.length" class="tui-file-tree-children">
            <TuiFileTree
              :nodes="node.children"
              :selectable="selectable"
              :multi-select="multiSelect"
              :show-icons="showIcons"
              :indent-size="indentSize"
              @select="$emit('select', $event)"
              @toggle="$emit('toggle', $event)"
              @expand="$emit('expand', $event)"
              @collapse="$emit('collapse', $event)"
            />
          </ul>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.tui-file-tree {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
}

.tui-file-tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tui-file-tree-node {
  user-select: none;
}

.tui-file-tree-row {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-xs) 0;
  cursor: pointer;
  transition: var(--tui-transition);
  border-radius: 2px;
}

.tui-file-tree-row:hover {
  background: var(--tui-bg-tertiary);
}

.tui-file-tree-node-selected > .tui-file-tree-row {
  background: rgba(0, 255, 255, 0.1);
  color: var(--tui-primary);
}

.tui-file-tree-toggle {
  width: 16px;
  text-align: center;
  font-size: 0.625rem;
  color: var(--tui-text-muted);
  transition: transform 0.2s ease;
}

.tui-file-tree-expanded {
  transform: rotate(90deg);
}

.tui-file-tree-spacer {
  width: 16px;
}

.tui-file-tree-icon {
  flex-shrink: 0;
}

.tui-file-tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tui-file-tree-meta {
  color: var(--tui-text-muted);
  font-size: var(--tui-font-size-xs);
}

.tui-file-tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
