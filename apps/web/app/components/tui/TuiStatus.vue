<script setup lang="ts">
interface Props {
  status: 'online' | 'offline' | 'busy' | 'away' | 'idle' | 'error' | 'warning' | 'success';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  pulse: false,
});
</script>

<template>
  <span class="tui-status" :class="`tui-status-${status} tui-status-${size}`">
    <span class="tui-status-dot" :class="{ 'tui-status-pulse': pulse }" />
    <span v-if="label" class="tui-status-label">{{ label }}</span>
  </span>
</template>

<style scoped>
.tui-status {
  display: inline-flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  font-family: var(--tui-font-mono);
}

.tui-status-label {
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-status-sm .tui-status-dot {
  width: 8px;
  height: 8px;
}

.tui-status-sm .tui-status-label {
  font-size: var(--tui-font-size-xs);
}

.tui-status-md .tui-status-dot {
  width: 10px;
  height: 10px;
}

.tui-status-lg .tui-status-dot {
  width: 14px;
  height: 14px;
}

.tui-status-dot {
  border-radius: 50%;
  flex-shrink: 0;
}

/* Status colors */
.tui-status-online .tui-status-dot {
  background: var(--tui-success);
  box-shadow: 0 0 5px var(--tui-success);
}

.tui-status-offline .tui-status-dot {
  background: var(--tui-text-muted);
}

.tui-status-busy .tui-status-dot {
  background: var(--tui-error);
  box-shadow: 0 0 5px var(--tui-error);
}

.tui-status-away .tui-status-dot {
  background: var(--tui-warning);
  box-shadow: 0 0 5px var(--tui-warning);
}

.tui-status-idle .tui-status-dot {
  background: var(--tui-text-secondary);
}

.tui-status-success .tui-status-dot {
  background: var(--tui-success);
  box-shadow: 0 0 5px var(--tui-success);
}

.tui-status-warning .tui-status-dot {
  background: var(--tui-warning);
  box-shadow: 0 0 5px var(--tui-warning);
}

.tui-status-error .tui-status-dot {
  background: var(--tui-error);
  box-shadow: 0 0 5px var(--tui-error);
}

/* Pulse animation */
.tui-status-pulse {
  animation: status-pulse 2s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}
</style>
