<script setup lang="ts">
interface Props {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  indeterminate: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<template>
  <label 
    class="tui-checkbox-wrapper" 
    :class="{ 'tui-checkbox-disabled': disabled }"
  >
    <div
      class="tui-checkbox"
      :class="{ 
        'tui-checkbox-checked': modelValue,
        'tui-checkbox-indeterminate': indeterminate 
      }"
      role="checkbox"
      :aria-checked="indeterminate ? 'mixed' : modelValue"
      tabindex="0"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
    >
      <span v-if="modelValue && !indeterminate" class="tui-checkbox-icon">✓</span>
      <span v-else-if="indeterminate" class="tui-checkbox-icon">−</span>
    </div>
    <span v-if="label" class="tui-checkbox-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.tui-checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  cursor: pointer;
}

.tui-checkbox-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tui-checkbox {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  transition: var(--tui-transition);
  flex-shrink: 0;
}

.tui-checkbox:hover:not(.tui-checkbox-disabled *) {
  border-color: var(--tui-primary-dim);
}

.tui-checkbox:focus {
  outline: none;
  box-shadow: 0 0 5px var(--tui-primary-dim);
}

.tui-checkbox-checked {
  background: var(--tui-primary);
  border-color: var(--tui-primary);
}

.tui-checkbox-indeterminate {
  background: var(--tui-primary-dim);
  border-color: var(--tui-primary-dim);
}

.tui-checkbox-icon {
  font-size: 12px;
  font-weight: bold;
  color: var(--tui-bg-primary);
  line-height: 1;
}

.tui-checkbox-label {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
  user-select: none;
}
</style>
