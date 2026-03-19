<script setup lang="ts">
interface Props {
  modelValue: string;
  type?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="tui-input-wrapper">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="tui-input"
      :class="{ 'tui-input-error': error }"
      @input="onInput"
    />
    <span v-if="error" class="tui-input-error-text">{{ error }}</span>
  </div>
</template>

<style scoped>
.tui-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tui-input-error {
  border-color: var(--tui-error) !important;
}

.tui-input-error-text {
  font-size: 0.75rem;
  color: var(--tui-error);
}
</style>