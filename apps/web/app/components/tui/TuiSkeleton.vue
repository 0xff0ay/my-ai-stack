<script setup lang="ts">
interface Props {
  lines?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lines: 1,
  height: '1em',
  animated: true,
  circle: false,
});

const lineItems = computed(() => Array.from({ length: props.lines }, (_, i) => i));
</script>

<template>
  <div class="tui-skeleton-wrapper">
    <div
      v-for="i in lineItems"
      :key="i"
      class="tui-skeleton"
      :class="{ 
        'tui-skeleton-animated': animated,
        'tui-skeleton-circle': circle 
      }"
      :style="{ 
        height: circle ? width || height : height,
        width: circle ? width || height : width || '100%'
      }"
    />
  </div>
</template>

<style scoped>
.tui-skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--tui-spacing-sm);
  width: 100%;
}

.tui-skeleton {
  background: var(--tui-bg-tertiary);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.tui-skeleton-circle {
  border-radius: 50%;
}

.tui-skeleton-animated::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 255, 0.1),
    transparent
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
