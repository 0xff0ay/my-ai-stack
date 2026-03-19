<script setup lang="ts">
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  options: Option[];
  name: string;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  direction: 'vertical',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function select(value: string) {
  if (!props.disabled) {
    emit('update:modelValue', value);
  }
}

function isSelected(value: string) {
  return props.modelValue === value;
}
</script>

<template>
  <div 
    class="tui-radio-group" 
    :class="{ 
      'tui-radio-group-disabled': disabled,
      [`tui-radio-group-${direction}`]: true 
    }"
    role="radiogroup"
  >
    <label
      v-for="option in options"
      :key="option.value"
      class="tui-radio-wrapper"
      :class="{ 
        'tui-radio-wrapper-disabled': option.disabled || disabled,
        'tui-radio-wrapper-checked': isSelected(option.value)
      }"
    >
      <div
        class="tui-radio"
        :class="{ 'tui-radio-checked': isSelected(option.value) }"
        role="radio"
        :aria-checked="isSelected(option.value)"
        tabindex="0"
        @click="!option.disabled && select(option.value)"
        @keydown.space.prevent="!option.disabled && select(option.value)"
        @keydown.enter.prevent="!option.disabled && select(option.value)"
      >
        <span v-if="isSelected(option.value)" class="tui-radio-dot" />
      </div>
      <span class="tui-radio-label">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.tui-radio-group {
  display: flex;
  gap: var(--tui-spacing-md);
}

.tui-radio-group-vertical {
  flex-direction: column;
}

.tui-radio-group-horizontal {
  flex-direction: row;
  flex-wrap: wrap;
}

.tui-radio-group-disabled {
  opacity: 0.5;
}

.tui-radio-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  cursor: pointer;
  user-select: none;
}

.tui-radio-wrapper-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tui-radio-wrapper-checked .tui-radio-label {
  color: var(--tui-primary);
}

.tui-radio {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 50%;
  transition: var(--tui-transition);
  flex-shrink: 0;
}

.tui-radio:hover:not(.tui-radio-wrapper-disabled *) {
  border-color: var(--tui-primary-dim);
}

.tui-radio:focus {
  outline: none;
  box-shadow: 0 0 5px var(--tui-primary-dim);
}

.tui-radio-checked {
  border-color: var(--tui-primary);
  background: rgba(0, 255, 255, 0.1);
}

.tui-radio-dot {
  width: 8px;
  height: 8px;
  background: var(--tui-primary);
  border-radius: 50%;
}

.tui-radio-label {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
}
</style>
