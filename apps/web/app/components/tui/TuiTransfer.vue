<script setup lang="ts">
interface TransferItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  items: TransferItem[];
  modelValue: string[];
  titles?: [string, string];
  showSelectAll?: boolean;
  filterable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  titles: () => ['Available', 'Selected'],
  showSelectAll: true,
  filterable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const leftFilter = ref('');
const rightFilter = ref('');
const selectedLeft = ref<Set<string>>(new Set());
const selectedRight = ref<Set<string>>(new Set());

const leftItems = computed(() => 
  props.items.filter(item => !props.modelValue.includes(item.id))
);

const rightItems = computed(() => 
  props.items.filter(item => props.modelValue.includes(item.id))
);

const filteredLeft = computed(() => {
  if (!leftFilter.value) return leftItems.value;
  return leftItems.value.filter(item => 
    item.label.toLowerCase().includes(leftFilter.value.toLowerCase())
  );
});

const filteredRight = computed(() => {
  if (!rightFilter.value) return rightItems.value;
  return rightItems.value.filter(item => 
    item.label.toLowerCase().includes(rightFilter.value.toLowerCase())
  );
});

function moveToRight() {
  const newValue = [...props.modelValue];
  selectedLeft.value.forEach(id => {
    if (!newValue.includes(id)) {
      newValue.push(id);
    }
  });
  emit('update:modelValue', newValue);
  selectedLeft.value.clear();
}

function moveToLeft() {
  const newValue = props.modelValue.filter(id => !selectedRight.value.has(id));
  emit('update:modelValue', newValue);
  selectedRight.value.clear();
}

function moveAllToRight() {
  const available = leftItems.value.filter(i => !i.disabled).map(i => i.id);
  emit('update:modelValue', [...props.modelValue, ...available]);
}

function moveAllToLeft() {
  emit('update:modelValue', []);
}

function toggleSelection(set: Set<string>, id: string, disabled?: boolean) {
  if (disabled) return;
  const newSet = new Set(set);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  return newSet;
}

function selectLeft(id: string, disabled?: boolean) {
  const newSet = toggleSelection(selectedLeft.value, id, disabled);
  if (newSet) selectedLeft.value = newSet;
}

function selectRight(id: string, disabled?: boolean) {
  const newSet = toggleSelection(selectedRight.value, id, disabled);
  if (newSet) selectedRight.value = newSet;
}
</script>

<template>
  <div class="tui-transfer">
    <div class="tui-transfer-panel">
      <div class="tui-transfer-header">
        <span class="tui-transfer-title">{{ titles[0] }}</span>
        <span class="tui-transfer-count">{{ leftItems.length }}</span>
      </div>
      
      <input
        v-if="filterable"
        v-model="leftFilter"
        type="text"
        class="tui-transfer-filter"
        placeholder="Filter..."
      />
      
      <div class="tui-transfer-list">
        <label
          v-for="item in filteredLeft"
          :key="item.id"
          class="tui-transfer-item"
          :class="{ 'tui-transfer-item-disabled': item.disabled }"
        >
          <input
            type="checkbox"
            :checked="selectedLeft.has(item.id)"
            :disabled="item.disabled"
            @change="selectLeft(item.id, item.disabled)"
          />
          <span class="tui-transfer-item-label">{{ item.label }}</span>
        </label>
      </div>
    </div>
    
    <div class="tui-transfer-operations">
      <button 
        type="button"
        class="tui-transfer-btn"
        :disabled="selectedLeft.size === 0"
        @click="moveToRight"
      >
        →
      </button>
      <button 
        type="button"
        class="tui-transfer-btn"
        :disabled="selectedRight.size === 0"
        @click="moveToLeft"
      >
        ←
      </button>
    </div>
    
    <div class="tui-transfer-panel">
      <div class="tui-transfer-header">
        <span class="tui-transfer-title">{{ titles[1] }}</span>
        <span class="tui-transfer-count">{{ rightItems.length }}</span>
      </div>
      
      <input
        v-if="filterable"
        v-model="rightFilter"
        type="text"
        class="tui-transfer-filter"
        placeholder="Filter..."
      />
      
      <div class="tui-transfer-list">
        <label
          v-for="item in filteredRight"
          :key="item.id"
          class="tui-transfer-item"
          :class="{ 'tui-transfer-item-disabled': item.disabled }"
        >
          <input
            type="checkbox"
            :checked="selectedRight.has(item.id)"
            :disabled="item.disabled"
            @change="selectRight(item.id, item.disabled)"
          />
          <span class="tui-transfer-item-label">{{ item.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-transfer {
  display: flex;
  gap: var(--tui-spacing-sm);
  align-items: stretch;
  font-family: var(--tui-font-mono);
}

.tui-transfer-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  background: var(--tui-bg-secondary);
  min-height: 300px;
}

.tui-transfer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-transfer-title {
  font-size: var(--tui-font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-transfer-count {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  background: var(--tui-bg-secondary);
  padding: 2px 8px;
  border-radius: 2px;
}

.tui-transfer-filter {
  margin: var(--tui-spacing-sm) var(--tui-spacing-md);
  padding: var(--tui-spacing-sm);
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  color: var(--tui-text-primary);
  font-family: inherit;
  font-size: var(--tui-font-size-sm);
}

.tui-transfer-filter:focus {
  outline: none;
  border-color: var(--tui-primary);
}

.tui-transfer-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--tui-spacing-xs);
}

.tui-transfer-item {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-sm);
  cursor: pointer;
  border-radius: 2px;
  transition: var(--tui-transition);
}

.tui-transfer-item:hover:not(.tui-transfer-item-disabled) {
  background: var(--tui-bg-tertiary);
}

.tui-transfer-item-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-transfer-item-label {
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
}

.tui-transfer-operations {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--tui-spacing-sm);
}

.tui-transfer-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tui-bg-tertiary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  color: var(--tui-text-primary);
  font-size: var(--tui-font-size-lg);
  cursor: pointer;
  transition: var(--tui-transition);
}

.tui-transfer-btn:hover:not(:disabled) {
  border-color: var(--tui-primary);
  color: var(--tui-primary);
}

.tui-transfer-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
