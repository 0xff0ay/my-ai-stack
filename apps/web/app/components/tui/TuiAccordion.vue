<script setup lang="ts">
interface Item {
  id: string;
  title: string;
  content?: string;
  disabled?: boolean;
}

interface Props {
  items: Item[];
  modelValue?: string[];
  multiple?: boolean;
  bordered?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: false,
  bordered: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const openItems = ref<Set<string>>(new Set(props.modelValue));

function toggleItem(id: string, disabled?: boolean) {
  if (disabled) return;
  
  const newSet = new Set(openItems.value);
  
  if (props.multiple) {
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
  } else {
    if (newSet.has(id)) {
      newSet.clear();
    } else {
      newSet.clear();
      newSet.add(id);
    }
  }
  
  openItems.value = newSet;
  emit('update:modelValue', Array.from(newSet));
}

function isOpen(id: string) {
  return openItems.value.has(id);
}
</script>

<template>
  <div class="tui-accordion" :class="{ 'tui-accordion-bordered': bordered }">
    <div
      v-for="item in items"
      :key="item.id"
      class="tui-accordion-item"
      :class="{ 
        'tui-accordion-item-open': isOpen(item.id),
        'tui-accordion-item-disabled': item.disabled 
      }"
    >
      <button
        type="button"
        class="tui-accordion-trigger"
        :disabled="item.disabled"
        @click="toggleItem(item.id, item.disabled)"
      >
        <span class="tui-accordion-title">{{ item.title }}</span>
        <span class="tui-accordion-icon">
          {{ isOpen(item.id) ? '▼' : '▶' }}
        </span>
      </button>
      
      <Transition name="tui-accordion">
        <div v-if="isOpen(item.id)" class="tui-accordion-content">
          <div class="tui-accordion-inner">
            <slot :item="item" :content="item.content">
              {{ item.content }}
            </slot>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.tui-accordion {
  display: flex;
  flex-direction: column;
}

.tui-accordion-bordered {
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
}

.tui-accordion-item {
  display: flex;
  flex-direction: column;
}

.tui-accordion-bordered .tui-accordion-item:not(:last-child) {
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-accordion-item-disabled {
  opacity: 0.5;
}

.tui-accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tui-spacing-md);
  padding: var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  border: none;
  color: var(--tui-text-primary);
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  cursor: pointer;
  transition: var(--tui-transition);
  text-align: left;
}

.tui-accordion-trigger:hover:not(:disabled) {
  background: var(--tui-bg-elevated);
  color: var(--tui-primary);
}

.tui-accordion-trigger:disabled {
  cursor: not-allowed;
}

.tui-accordion-item-open .tui-accordion-trigger {
  background: var(--tui-bg-elevated);
  color: var(--tui-primary);
}

.tui-accordion-title {
  flex: 1;
  font-weight: 500;
}

.tui-accordion-icon {
  font-size: 0.625rem;
  color: var(--tui-primary);
  transition: transform 0.2s ease;
}

.tui-accordion-content {
  overflow: hidden;
}

.tui-accordion-inner {
  padding: var(--tui-spacing-md);
  background: var(--tui-bg-secondary);
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-secondary);
  line-height: 1.6;
}

.tui-accordion-enter-active,
.tui-accordion-leave-active {
  transition: all 0.3s ease;
}

.tui-accordion-enter-from,
.tui-accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.tui-accordion-enter-to,
.tui-accordion-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
