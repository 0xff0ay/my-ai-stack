<script setup lang="ts">
interface Props {
  modelValue: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  labelPosition: 'right',
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
    class="tui-switch-wrapper" 
    :class="{ 
      'tui-switch-disabled': disabled,
      [`tui-switch-${size}`]: true,
      [`tui-switch-label-${labelPosition}`]: true
    }"
  >
    <span v-if="label && labelPosition === 'left'" class="tui-switch-label">{{ label }}</span>
    
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      class="tui-switch"
      :class="{ 'tui-switch-checked': modelValue }"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="tui-switch-thumb">
        <span v-if="modelValue" class="tui-switch-indicator">I</span>
        <span v-else class="tui-switch-indicator">O</span>
      </span>
    </button>
    
    <span v-if="label && labelPosition === 'right'" class="tui-switch-label">{{ label }}</span>
  </label>
</template>

<style scoped>
.tui-switch-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  cursor: pointer;
}

.tui-switch-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tui-switch-label {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
  user-select: none;
}

.tui-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: var(--tui-bg-tertiary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  cursor: pointer;
  transition: var(--tui-transition);
  padding: 2px;
}

.tui-switch:hover:not(:disabled) {
  border-color: var(--tui-primary-dim);
}

.tui-switch-checked {
  background: rgba(0, 255, 255, 0.1);
  border-color: var(--tui-primary);
  box-shadow: 0 0 5px var(--tui-primary-dim);
}

.tui-switch-sm {
  --switch-width: 36px;
  --switch-height: 20px;
  --thumb-size: 14px;
}

.tui-switch-md {
  --switch-width: 44px;
  --switch-height: 24px;
  --thumb-size: 18px;
}

.tui-switch-lg {
  --switch-width: 56px;
  --switch-height: 30px;
  --thumb-size: 24px;
}

.tui-switch {
  width: var(--switch-width);
  height: var(--switch-height);
}

.tui-switch-thumb {
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: var(--tui-text-muted);
  border-radius: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  transform: translateX(0);
}

.tui-switch-checked .tui-switch-thumb {
  transform: translateX(calc(var(--switch-width) - var(--thumb-size) - 6px));
  background: var(--tui-primary);
}

.tui-switch-indicator {
  font-family: var(--tui-font-mono);
  font-size: 8px;
  font-weight: bold;
  color: var(--tui-bg-primary);
  line-height: 1;
}

.tui-switch:disabled {
  cursor: not-allowed;
}
</style>
