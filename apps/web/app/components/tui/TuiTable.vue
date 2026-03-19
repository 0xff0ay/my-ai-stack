<script setup lang="ts" generic="T extends Record<string, any>">
interface Column {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface Props {
  data: T[];
  columns: Column[];
  loading?: boolean;
  emptyText?: string;
  striped?: boolean;
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'No data available',
  striped: true,
  hoverable: true,
});

const sortKey = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortedData = computed(() => {
  if (!sortKey.value) return props.data;
  
  return [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value!];
    const bVal = b[sortKey.value!];
    
    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

function handleSort(column: Column) {
  if (!column.sortable) return;
  
  if (sortKey.value === column.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = column.key;
    sortOrder.value = 'asc';
  }
}

function getSortIcon(column: Column) {
  if (!column.sortable || sortKey.value !== column.key) return '⇅';
  return sortOrder.value === 'asc' ? '▲' : '▼';
}
</script>

<template>
  <div class="tui-table-wrapper">
    <table class="tui-table" :class="{ 'tui-table-striped': striped, 'tui-table-hoverable': hoverable }">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width, textAlign: column.align || 'left' }"
            :class="{ 'tui-table-sortable': column.sortable, 'tui-table-sorted': sortKey === column.key }"
            @click="handleSort(column)"
          >
            {{ column.title }}
            <span v-if="column.sortable" class="tui-table-sort-icon">
              {{ getSortIcon(column) }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="tui-table-loading">
            <div class="tui-spinner" />
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length" class="tui-table-empty">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-for="(row, index) in sortedData" :key="index">
          <td
            v-for="column in columns"
            :key="column.key"
            :style="{ textAlign: column.align || 'left' }"
          >
            <slot :name="column.key" :row="row" :value="row[column.key]">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.tui-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--tui-border);
  border-radius: 4px;
}

.tui-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
}

.tui-table th,
.tui-table td {
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-table th {
  color: var(--tui-text-secondary);
  text-transform: uppercase;
  font-size: var(--tui-font-size-xs);
  letter-spacing: 0.1em;
  background: var(--tui-bg-tertiary);
  font-weight: 600;
  white-space: nowrap;
}

.tui-table-sortable {
  cursor: pointer;
  user-select: none;
}

.tui-table-sortable:hover {
  color: var(--tui-primary);
}

.tui-table-sorted {
  color: var(--tui-primary);
}

.tui-table-sort-icon {
  margin-left: var(--tui-spacing-xs);
  font-size: 0.625rem;
  color: var(--tui-primary);
}

.tui-table tbody tr:last-child td {
  border-bottom: none;
}

.tui-table-striped tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.tui-table-hoverable tbody tr:hover {
  background: var(--tui-bg-tertiary);
}

.tui-table-loading {
  text-align: center;
  padding: var(--tui-spacing-xl);
}

.tui-table-empty {
  text-align: center;
  padding: var(--tui-spacing-xl);
  color: var(--tui-text-muted);
  font-style: italic;
}
</style>
