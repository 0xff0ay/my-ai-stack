<script setup lang="ts">
interface Props {
  label?: string;
  dashed?: boolean;
  glow?: boolean;
  vertical?: boolean;
  spacing?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  dashed: false,
  glow: false,
  vertical: false,
  spacing: 'md',
});
</script>

<template>
  <div 
    class="tui-divider-component" 
    :class="{ 
      'tui-divider-vertical': vertical,
      [`tui-divider-spacing-${spacing}`]: true 
    }"
    role="separator"
  >
    <div 
      class="tui-divider-line" 
      :class="{ 
        'tui-divider-dashed': dashed,
        'tui-divider-glow': glow 
      }"
    />
    <span v-if="label" class="tui-divider-label">{{ label }}</span>
    <div 
      v-if="label" 
      class="tui-divider-line" 
      :class="{ 
        'tui-divider-dashed': dashed,
        'tui-divider-glow': glow 
      }"
    />
  </div>
</template>

<style scoped>
.tui-divider-component {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-md);
}

.tui-divider-vertical {
  flex-direction: column;
  height: 100%;
}

.tui-divider-spacing-sm {
  margin: var(--tui-spacing-sm) 0;
}

.tui-divider-spacing-md {
  margin: var(--tui-spacing-md) 0;
}

.tui-divider-spacing-lg {
  margin: var(--tui-spacing-lg) 0;
}

.tui-divider-vertical.tui-divider-spacing-sm {
  margin: 0 var(--tui-spacing-sm);
}

.tui-divider-vertical.tui-divider-spacing-md {
  margin: 0 var(--tui-spacing-md);
}

.tui-divider-vertical.tui-divider-spacing-lg {
  margin: 0 var(--tui-spacing-lg);
}

.tui-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--tui-border),
    var(--tui-border),
    transparent
  );
}

.tui-divider-vertical .tui-divider-line {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent,
    var(--tui-border),
    var(--tui-border),
    transparent
  );
}

.tui-divider-dashed {
  background: repeating-linear-gradient(
    90deg,
    var(--tui-border),
    var(--tui-border) 8px,
    transparent 8px,
    transparent 16px
  ) !important;
}

.tui-divider-vertical .tui-divider-dashed {
  background: repeating-linear-gradient(
    180deg,
    var(--tui-border),
    var(--tui-border) 8px,
    transparent 8px,
    transparent 16px
  ) !important;
}

.tui-divider-glow {
  background: linear-gradient(
    90deg,
    transparent,
    var(--tui-primary-dim),
    var(--tui-primary),
    var(--tui-primary-dim),
    transparent
  );
  box-shadow: 0 0 10px var(--tui-primary-dim);
}

.tui-divider-vertical .tui-divider-glow {
  background: linear-gradient(
    180deg,
    transparent,
    var(--tui-primary-dim),
    var(--tui-primary),
    var(--tui-primary-dim),
    transparent
  );
  box-shadow: 0 0 10px var(--tui-primary-dim);
}

.tui-divider-label {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
</style>
