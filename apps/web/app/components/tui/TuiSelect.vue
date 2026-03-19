<script setup lang="ts">
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isOpen = ref(false);
const selectedOption = computed(() => 
  props.options.find(opt => opt.value === props.modelValue)
);

function toggle() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function select(option: Option) {
  if (option.disabled) return;
  emit('update:modelValue', option.value);
  isOpen.value = false;
}

function close() {
  isOpen.value = false;
}

onClickOutside(ref(null), close);
</script>

<template>
  <div class="tui-select-wrapper" :class="{ 'tui-select-open': isOpen, 'tui-select-disabled': disabled }">
    <button
      type="button"
      class="tui-select-trigger"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="tui-select-value">
        {{ selectedOption?.label || placeholder }}
      </span>
      <span class="tui-select-arrow">▼</span>
    </button>
    
    <Transition name="tui-select-dropdown">
      <div v-if="isOpen" class="tui-select-dropdown">
        <div class="tui-select-options">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="tui-select-option"
            :class="{ 
              'tui-select-option-selected': option.value === modelValue,
              'tui-select-option-disabled': option.disabled 
            }"
            :disabled="option.disabled"
            @click="select(option)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tui-select-wrapper {
  position: relative;
}

.tui-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-primary);
  color: var(--tui-text-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-base);
  cursor: pointer;
  transition: var(--tui-transition);
  text-align: left;
}

.tui-select-trigger:hover:not(:disabled) {
  border-color: var(--tui-primary);
}

.tui-select-open .tui-select-trigger {
  border-color: var(--tui-primary);
  box-shadow: 0 0 5px var(--tui-primary-dim);
}

.tui-select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tui-select-value {
  flex: 1;
}

.tui-select-arrow {
  font-size: 0.625rem;
  color: var(--tui-primary);
  transition: transform 0.2s ease;
}

.tui-select-open .tui-select-arrow {
  transform: rotate(180deg);
}

.tui-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--tui-bg-elevated);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
}

.tui-select-options {
  display: flex;
  flex-direction: column;
  padding: var(--tui-spacing-xs);
}

.tui-select-option {
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: transparent;
  color: var(--tui-text-primary);
  border: none;
  border-radius: 2px;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: var(--tui-transition);
}

.tui-select-option:hover:not(:disabled) {
  background: var(--tui-bg-tertiary);
}

.tui-select-option-selected {
  background: var(--tui-bg-tertiary);
  color: var(--tui-primary);
}

.tui-select-option-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-select-dropdown-enter-active,
.tui-select-dropdown-leave-active {
  transition: all 0.2s ease;
}

.tui-select-dropdown-enter-from,
.tui-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
