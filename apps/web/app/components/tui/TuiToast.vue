<script setup lang="ts">
interface Props {
  toasts?: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  toasts: () => [],
});

const emit = defineEmits<{
  dismiss: [id: string];
}>();

function dismiss(id: string) {
  emit('dismiss', id);
}

const icons: Record<string, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};
</script>

<template>
  <div class="tui-toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['tui-toast', `tui-toast-${toast.type}`]"
      >
        <span class="tui-toast-icon">{{ icons[toast.type] }}</span>
        <span class="tui-toast-message">{{ toast.message }}</span>
        <button class="tui-toast-dismiss" @click="dismiss(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tui-toast {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
}

.tui-toast-icon {
  font-weight: bold;
}

.tui-toast-success .tui-toast-icon {
  color: var(--tui-success);
}

.tui-toast-error .tui-toast-icon {
  color: var(--tui-error);
}

.tui-toast-warning .tui-toast-icon {
  color: var(--tui-warning);
}

.tui-toast-info .tui-toast-icon {
  color: var(--tui-info);
}

.tui-toast-message {
  flex: 1;
}

.tui-toast-dismiss {
  background: none;
  border: none;
  color: var(--tui-text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 4px;
}

.tui-toast-dismiss:hover {
  color: var(--tui-text-primary);
}

/* Transitions */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>