<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  emit('click', event);
}
</script>

<template>
  <button
    :class="[
      'tui-button',
      `tui-button-${variant}`,
      `tui-button-${size}`,
      { 'tui-button-loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="tui-spinner tui-spinner-sm" />
    <slot />
  </button>
</template>

<style scoped>
.tui-button-sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}

.tui-button-lg {
  font-size: 1.125rem;
  padding: 12px 24px;
}

.tui-button-loading {
  position: relative;
  color: transparent;
}

.tui-button-loading :deep(.tui-spinner) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--tui-text-primary);
}

.tui-spinner-sm {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

.tui-button-primary {
  background: var(--tui-primary);
  color: var(--tui-bg-primary);
  border-color: var(--tui-primary);
}

.tui-button-success {
  background: var(--tui-success);
  color: var(--tui-bg-primary);
  border-color: var(--tui-success);
}

.tui-button-warning {
  background: var(--tui-warning);
  color: var(--tui-bg-primary);
  border-color: var(--tui-warning);
}
</style>