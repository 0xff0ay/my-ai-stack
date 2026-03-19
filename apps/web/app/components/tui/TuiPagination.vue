<script setup lang="ts">
interface Props {
  current: number;
  total: number;
  showEdges?: boolean;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  showEdges: true,
  maxVisible: 5,
  size: 'md',
});

const emit = defineEmits<{
  change: [page: number];
}>();

const pages = computed(() => {
  const result: (number | string)[] = [];
  const halfVisible = Math.floor(props.maxVisible / 2);
  
  let start = Math.max(1, props.current - halfVisible);
  let end = Math.min(props.total, start + props.maxVisible - 1);
  
  if (end - start + 1 < props.maxVisible) {
    start = Math.max(1, end - props.maxVisible + 1);
  }
  
  if (props.showEdges && start > 1) {
    result.push(1);
    if (start > 2) result.push('...');
  }
  
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  
  if (props.showEdges && end < props.total) {
    if (end < props.total - 1) result.push('...');
    result.push(props.total);
  }
  
  return result;
});

const hasPrevious = computed(() => props.current > 1);
const hasNext = computed(() => props.current < props.total);

function goToPage(page: number | string) {
  if (typeof page === 'number' && page !== props.current) {
    emit('change', page);
  }
}

function previous() {
  if (hasPrevious.value) {
    emit('change', props.current - 1);
  }
}

function next() {
  if (hasNext.value) {
    emit('change', props.current + 1);
  }
}
</script>

<template>
  <nav class="tui-pagination" :class="`tui-pagination-${size}`" aria-label="Pagination">
    <button
      type="button"
      class="tui-pagination-button tui-pagination-prev"
      :disabled="!hasPrevious"
      @click="previous"
    >
      ← PREV
    </button>
    
    <div class="tui-pagination-pages">
      <button
        v-for="(page, index) in pages"
        :key="`${page}-${index}`"
        type="button"
        class="tui-pagination-button"
        :class="{ 
          'tui-pagination-button-active': page === current,
          'tui-pagination-button-ellipsis': page === '...'
        }"
        :disabled="page === '...'"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </div>
    
    <button
      type="button"
      class="tui-pagination-button tui-pagination-next"
      :disabled="!hasNext"
      @click="next"
    >
      NEXT →
    </button>
  </nav>
</template>

<style scoped>
.tui-pagination {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  font-family: var(--tui-font-mono);
}

.tui-pagination-pages {
  display: flex;
  gap: var(--tui-spacing-xs);
}

.tui-pagination-button {
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  color: var(--tui-text-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  font-family: inherit;
  font-size: var(--tui-font-size-sm);
  cursor: pointer;
  transition: var(--tui-transition);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 36px;
}

.tui-pagination-button:hover:not(:disabled) {
  border-color: var(--tui-primary);
  color: var(--tui-primary);
}

.tui-pagination-button-active {
  background: var(--tui-primary);
  color: var(--tui-bg-primary);
  border-color: var(--tui-primary);
}

.tui-pagination-button-active:hover {
  color: var(--tui-bg-primary) !important;
  opacity: 0.9;
}

.tui-pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-pagination-button-ellipsis {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.tui-pagination-sm .tui-pagination-button {
  padding: 4px 8px;
  font-size: var(--tui-font-size-xs);
  min-width: 28px;
}

.tui-pagination-lg .tui-pagination-button {
  padding: var(--tui-spacing-md) var(--tui-spacing-lg);
  font-size: var(--tui-font-size-base);
}

.tui-pagination-prev,
.tui-pagination-next {
  white-space: nowrap;
}
</style>
