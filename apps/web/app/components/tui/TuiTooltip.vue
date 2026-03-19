<script setup lang="ts">
interface Props {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 300,
});

const show = ref(false);
const tooltipRef = ref<HTMLElement>();
let timeout: ReturnType<typeof setTimeout>;

function handleMouseEnter() {
  timeout = setTimeout(() => {
    show.value = true;
  }, props.delay);
}

function handleMouseLeave() {
  clearTimeout(timeout);
  show.value = false;
}

onUnmounted(() => {
  clearTimeout(timeout);
});
</script>

<template>
  <div
    class="tui-tooltip-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />
    <Transition name="tui-tooltip">
      <div
        v-if="show"
        ref="tooltipRef"
        class="tui-tooltip"
        :class="`tui-tooltip-${position}`"
        role="tooltip"
      >
        {{ content }}
        <span class="tui-tooltip-arrow" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tui-tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.tui-tooltip {
  position: absolute;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-elevated);
  color: var(--tui-text-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-xs);
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}

.tui-tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tui-tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tui-tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tui-tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.tui-tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--tui-bg-elevated);
  border: 1px solid var(--tui-border);
}

.tui-tooltip-top .tui-tooltip-arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-top: none;
  border-left: none;
}

.tui-tooltip-bottom .tui-tooltip-arrow {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-bottom: none;
  border-right: none;
}

.tui-tooltip-left .tui-tooltip-arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-bottom: none;
  border-left: none;
}

.tui-tooltip-right .tui-tooltip-arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  border-top: none;
  border-right: none;
}

.tui-tooltip-enter-active,
.tui-tooltip-leave-active {
  transition: all 0.2s ease;
}

.tui-tooltip-enter-from,
.tui-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

.tui-tooltip-bottom.tui-tooltip-enter-from,
.tui-tooltip-bottom.tui-tooltip-leave-to {
  transform: translateX(-50%) translateY(4px);
}

.tui-tooltip-left.tui-tooltip-enter-from,
.tui-tooltip-left.tui-tooltip-leave-to {
  transform: translateY(-50%) translateX(-4px);
}

.tui-tooltip-right.tui-tooltip-enter-from,
.tui-tooltip-right.tui-tooltip-leave-to {
  transform: translateY(-50%) translateX(4px);
}
</style>
