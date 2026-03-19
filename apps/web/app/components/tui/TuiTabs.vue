<script setup lang="ts">
interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  tabs: Tab[];
  variant?: 'default' | 'pills' | 'underline';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const activeTab = computed(() => 
  props.tabs.find(tab => tab.id === props.modelValue)
);

function selectTab(tab: Tab) {
  if (tab.disabled) return;
  emit('update:modelValue', tab.id);
}
</script>

<template>
  <div class="tui-tabs" :class="`tui-tabs-${variant}`">
    <div class="tui-tabs-list" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tui-tab"
        :class="{ 
          'tui-tab-active': tab.id === modelValue,
          'tui-tab-disabled': tab.disabled 
        }"
        role="tab"
        :aria-selected="tab.id === modelValue"
        :disabled="tab.disabled"
        @click="selectTab(tab)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tui-tabs-content">
      <slot :active-tab="activeTab" />
    </div>
  </div>
</template>

<style scoped>
.tui-tabs {
  display: flex;
  flex-direction: column;
}

.tui-tabs-list {
  display: flex;
  gap: var(--tui-spacing-xs);
  border-bottom: 1px solid var(--tui-border);
}

.tui-tab {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: transparent;
  color: var(--tui-text-secondary);
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: var(--tui-transition);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-tab:hover:not(:disabled) {
  color: var(--tui-text-primary);
  background: var(--tui-bg-tertiary);
}

.tui-tab-active {
  color: var(--tui-primary) !important;
  border-bottom-color: var(--tui-primary);
}

.tui-tab-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-tabs-content {
  padding: var(--tui-spacing-md) 0;
}

/* Pills Variant */
.tui-tabs-pills .tui-tabs-list {
  border-bottom: none;
  gap: var(--tui-spacing-sm);
}

.tui-tabs-pills .tui-tab {
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  border-bottom-width: 1px;
}

.tui-tabs-pills .tui-tab:hover:not(:disabled) {
  border-color: var(--tui-primary);
}

.tui-tabs-pills .tui-tab-active {
  background: var(--tui-primary);
  color: var(--tui-bg-primary) !important;
  border-color: var(--tui-primary);
}

/* Underline Variant */
.tui-tabs-underline .tui-tabs-list {
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-tabs-underline .tui-tab {
  border-bottom-width: 1px;
  margin-bottom: -1px;
}

.tui-tabs-underline .tui-tab-active {
  border-bottom-color: var(--tui-primary);
  background: var(--tui-bg-tertiary);
}
</style>
