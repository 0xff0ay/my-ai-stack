<script setup lang="ts">
interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

interface Props {
  steps: Step[];
  current: number;
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  size: 'md',
});

const emit = defineEmits<{
  change: [step: number];
}>();

function isCompleted(index: number) {
  return index < props.current;
}

function isCurrent(index: number) {
  return index === props.current;
}

function canNavigate(index: number) {
  return !props.steps[index]?.disabled && index <= props.current;
}

function navigateTo(index: number) {
  if (canNavigate(index)) {
    emit('change', index);
  }
}
</script>

<template>
  <div 
    class="tui-stepper" 
    :class="[
      `tui-stepper-${direction}`,
      `tui-stepper-${size}`
    ]"
  >
    <div 
      v-for="(step, index) in steps" 
      :key="step.id"
      class="tui-step"
      :class="{
        'tui-step-completed': isCompleted(index),
        'tui-step-current': isCurrent(index),
        'tui-step-disabled': step.disabled,
        'tui-step-clickable': canNavigate(index)
      }"
    >
      <div 
        class="tui-step-indicator"
        @click="navigateTo(index)"
      >
        <span v-if="step.icon" class="tui-step-icon">{{ step.icon }}</span>
        <span v-else-if="isCompleted(index)" class="tui-step-icon">✓</span>
        <span v-else>{{ index + 1 }}</span>
      </div>
      
      <div class="tui-step-content">
        <div class="tui-step-title">{{ step.title }}</div>
        <div v-if="step.description" class="tui-step-description">
          {{ step.description }}
        </div>
      </div>
      
      <div v-if="index < steps.length - 1" class="tui-step-connector">
        <div class="tui-step-line" :class="{ 'tui-step-line-completed': isCompleted(index + 1) }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-stepper {
  display: flex;
  font-family: var(--tui-font-mono);
}

.tui-stepper-horizontal {
  flex-direction: row;
  gap: 0;
}

.tui-stepper-vertical {
  flex-direction: column;
  gap: var(--tui-spacing-sm);
}

.tui-step {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  position: relative;
}

.tui-stepper-horizontal .tui-step {
  flex: 1;
}

.tui-stepper-vertical .tui-step {
  width: 100%;
}

.tui-step-indicator {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tui-bg-tertiary);
  border: 2px solid var(--tui-border);
  border-radius: 50%;
  font-size: var(--tui-font-size-sm);
  font-weight: 600;
  color: var(--tui-text-secondary);
  transition: var(--tui-transition);
  flex-shrink: 0;
}

.tui-step-sm .tui-step-indicator {
  width: 24px;
  height: 24px;
  font-size: var(--tui-font-size-xs);
}

.tui-step-lg .tui-step-indicator {
  width: 40px;
  height: 40px;
  font-size: var(--tui-font-size-base);
}

.tui-step-completed .tui-step-indicator {
  background: var(--tui-success);
  border-color: var(--tui-success);
  color: var(--tui-bg-primary);
}

.tui-step-current .tui-step-indicator {
  background: var(--tui-primary);
  border-color: var(--tui-primary);
  color: var(--tui-bg-primary);
  box-shadow: 0 0 10px var(--tui-primary-dim);
}

.tui-step-disabled .tui-step-indicator {
  opacity: 0.4;
}

.tui-step-clickable .tui-step-indicator {
  cursor: pointer;
}

.tui-step-clickable .tui-step-indicator:hover {
  transform: scale(1.1);
}

.tui-step-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tui-step-title {
  font-size: var(--tui-font-size-sm);
  font-weight: 600;
  color: var(--tui-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-step-completed .tui-step-title {
  color: var(--tui-success);
}

.tui-step-current .tui-step-title {
  color: var(--tui-primary);
}

.tui-step-description {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
}

.tui-step-connector {
  flex: 1;
  display: flex;
  align-items: center;
}

.tui-stepper-horizontal .tui-step-connector {
  padding: 0 var(--tui-spacing-sm);
}

.tui-stepper-vertical .tui-step-connector {
  position: absolute;
  left: 15px;
  top: 36px;
  width: 2px;
  height: calc(100% + var(--tui-spacing-sm));
}

.tui-step-line {
  height: 2px;
  background: var(--tui-border-dim);
  flex: 1;
  transition: var(--tui-transition);
}

.tui-stepper-vertical .tui-step-line {
  width: 2px;
  height: 100%;
}

.tui-step-line-completed {
  background: var(--tui-success);
}
</style>
