<script setup lang="ts">
interface Props {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showLabel: true,
  variant: 'default',
});

const percentage = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)));
</script>

<template>
  <div class="tui-progress">
    <div
      :class="['tui-progress-bar', `tui-progress-bar-${variant}`]"
      :style="{ width: `${percentage}%` }"
    >
      <span v-if="showLabel" class="tui-progress-label">
        {{ Math.round(percentage) }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
.tui-progress-bar-primary {
  background: linear-gradient(90deg, var(--tui-primary-dim), var(--tui-primary));
}

.tui-progress-bar-success {
  background: linear-gradient(90deg, #00aa00, var(--tui-success));
}

.tui-progress-bar-warning {
  background: linear-gradient(90deg, #aa6600, var(--tui-warning));
}

.tui-progress-bar-error {
  background: linear-gradient(90deg, #aa2222, var(--tui-error));
}

.tui-progress-label {
  font-size: 0.625rem;
  font-weight: bold;
  text-shadow: 0 0 2px currentColor;
}
</style>