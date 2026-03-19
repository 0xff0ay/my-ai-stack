<script setup lang="ts">
interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showValue: true,
  showTicks: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const percentage = computed(() => 
  ((props.modelValue - props.min) / (props.max - props.min)) * 100
);

const ticks = computed(() => {
  if (!props.showTicks) return [];
  const count = 10;
  return Array.from({ length: count + 1 }, (_, i) => ({
    position: (i / count) * 100,
    value: props.min + ((props.max - props.min) / count) * i,
  }));
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
}
</script>

<template>
  <div class="tui-slider-wrapper" :class="{ 'tui-slider-disabled': disabled }">
    <div class="tui-slider-track-container">
      <div class="tui-slider-track" />
      <div 
        class="tui-slider-fill" 
        :style="{ width: `${percentage}%` }" 
      />
      <input
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        class="tui-slider-input"
        @input="handleInput"
      />
      <div v-if="showTicks" class="tui-slider-ticks">
        <span
          v-for="(tick, index) in ticks"
          :key="index"
          class="tui-slider-tick"
          :style="{ left: `${tick.position}%` }"
        >
          |
        </span>
      </div>
    </div>
    <span v-if="showValue" class="tui-slider-value">{{ modelValue }}</span>
  </div>
</template>

<style scoped>
.tui-slider-wrapper {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-md);
}

.tui-slider-disabled {
  opacity: 0.5;
}

.tui-slider-track-container {
  position: relative;
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
}

.tui-slider-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--tui-bg-tertiary);
  border-radius: 2px;
}

.tui-slider-fill {
  position: absolute;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--tui-primary-dim), var(--tui-primary));
  border-radius: 2px;
  pointer-events: none;
}

.tui-slider-input {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
}

.tui-slider-input:disabled {
  cursor: not-allowed;
}

.tui-slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--tui-primary);
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 0 0 5px var(--tui-primary);
}

.tui-slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--tui-primary);
  border-radius: 2px;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 5px var(--tui-primary);
}

.tui-slider-value {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  color: var(--tui-primary);
  min-width: 3ch;
  text-align: right;
}

.tui-slider-ticks {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 6px;
  pointer-events: none;
}

.tui-slider-tick {
  font-family: var(--tui-font-mono);
  font-size: 0.625rem;
  color: var(--tui-text-muted);
  transform: translateX(-50%);
}
</style>
