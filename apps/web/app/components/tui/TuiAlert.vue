<script setup lang="ts">
interface Props {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  icon?: boolean;
  variant?: 'default' | 'outline' | 'filled';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: false,
  icon: true,
  variant: 'default',
});

const emit = defineEmits<{
  dismiss: [];
}>();

const icons: Record<string, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✗',
};

function dismiss() {
  emit('dismiss');
}
</script>

<template>
  <div 
    class="tui-alert" 
    :class="`tui-alert-${type} tui-alert-${variant}`"
    role="alert"
  >
    <span v-if="icon" class="tui-alert-icon">{{ icons[type] }}</span>
    
    <div class="tui-alert-content">
      <h4 v-if="title" class="tui-alert-title">{{ title }}</h4>
      <div class="tui-alert-message">
        <slot />
      </div>
    </div>
    
    <button v-if="dismissible" type="button" class="tui-alert-dismiss" @click="dismiss">
      ✕
    </button>
  </div>
</template>

<style scoped>
.tui-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-md);
  border-radius: 4px;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  border: 1px solid var(--tui-border);
}

.tui-alert-icon {
  font-size: 1.125rem;
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1;
}

.tui-alert-content {
  flex: 1;
  min-width: 0;
}

.tui-alert-title {
  margin: 0 0 var(--tui-spacing-xs) 0;
  font-size: var(--tui-font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-alert-message {
  line-height: 1.5;
}

.tui-alert-dismiss {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  opacity: 0.6;
  transition: var(--tui-transition);
  flex-shrink: 0;
}

.tui-alert-dismiss:hover {
  opacity: 1;
}

/* Type variants - Default */
.tui-alert-info {
  background: rgba(0, 170, 255, 0.1);
  border-color: var(--tui-info);
  color: var(--tui-info);
}

.tui-alert-info .tui-alert-title,
.tui-alert-info .tui-alert-message {
  color: var(--tui-text-primary);
}

.tui-alert-success {
  background: rgba(0, 255, 0, 0.1);
  border-color: var(--tui-success);
  color: var(--tui-success);
}

.tui-alert-success .tui-alert-title,
.tui-alert-success .tui-alert-message {
  color: var(--tui-text-primary);
}

.tui-alert-warning {
  background: rgba(255, 170, 0, 0.1);
  border-color: var(--tui-warning);
  color: var(--tui-warning);
}

.tui-alert-warning .tui-alert-title,
.tui-alert-warning .tui-alert-message {
  color: var(--tui-text-primary);
}

.tui-alert-error {
  background: rgba(255, 51, 51, 0.1);
  border-color: var(--tui-error);
  color: var(--tui-error);
}

.tui-alert-error .tui-alert-title,
.tui-alert-error .tui-alert-message {
  color: var(--tui-text-primary);
}

/* Outline variant */
.tui-alert-outline {
  background: transparent;
}

/* Filled variant */
.tui-alert-filled.tui-alert-info {
  background: var(--tui-info);
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-info .tui-alert-title,
.tui-alert-filled.tui-alert-info .tui-alert-message {
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-success {
  background: var(--tui-success);
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-success .tui-alert-title,
.tui-alert-filled.tui-alert-success .tui-alert-message {
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-warning {
  background: var(--tui-warning);
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-warning .tui-alert-title,
.tui-alert-filled.tui-alert-warning .tui-alert-message {
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-error {
  background: var(--tui-error);
  color: var(--tui-bg-primary);
}

.tui-alert-filled.tui-alert-error .tui-alert-title,
.tui-alert-filled.tui-alert-error .tui-alert-message {
  color: var(--tui-bg-primary);
}
</style>
