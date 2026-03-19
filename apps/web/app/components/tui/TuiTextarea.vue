<script setup lang="ts">
interface Props {
  modelValue: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  placeholder: '',
  disabled: false,
  resize: 'vertical',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const charCount = computed(() => props.modelValue.length);

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="tui-textarea-wrapper">
    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      class="tui-textarea"
      :class="{ 
        'tui-textarea-error': error,
        [`tui-textarea-resize-${resize}`]: true 
      }"
      @input="onInput"
    />
    <div class="tui-textarea-footer">
      <span v-if="error" class="tui-textarea-error-text">{{ error }}</span>
      <span v-if="maxLength" class="tui-textarea-counter">
        {{ charCount }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.tui-textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-textarea {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-base);
  padding: var(--tui-spacing-md);
  background: var(--tui-bg-primary);
  color: var(--tui-text-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  outline: none;
  width: 100%;
  transition: var(--tui-transition);
  line-height: 1.5;
}

.tui-textarea:focus {
  border-color: var(--tui-primary);
  box-shadow: 0 0 5px var(--tui-primary-dim);
}

.tui-textarea::placeholder {
  color: var(--tui-text-muted);
}

.tui-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tui-textarea-error {
  border-color: var(--tui-error) !important;
}

.tui-textarea-resize-none {
  resize: none;
}

.tui-textarea-resize-vertical {
  resize: vertical;
}

.tui-textarea-resize-horizontal {
  resize: horizontal;
}

.tui-textarea-resize-both {
  resize: both;
}

.tui-textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--tui-font-size-xs);
}

.tui-textarea-error-text {
  color: var(--tui-error);
}

.tui-textarea-counter {
  color: var(--tui-text-muted);
  margin-left: auto;
}
</style>
