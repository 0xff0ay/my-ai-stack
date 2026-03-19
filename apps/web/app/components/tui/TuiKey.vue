<script setup lang="ts">
interface Props {
  keys: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'flat';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
});
</script>

<template>
  <span class="tui-key-group" :class="`tui-key-group-${size}`">
    <kbd
      v-for="(key, index) in keys"
      :key="index"
      class="tui-key"
      :class="`tui-key-${variant}`"
    >
      {{ key }}
    </kbd>
  </span>
</template>

<style scoped>
.tui-key-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--tui-font-mono);
}

.tui-key-group-sm {
  gap: 2px;
}

.tui-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 3px;
  white-space: nowrap;
}

/* Default variant - 3D key style */
.tui-key-default {
  padding: 4px 8px;
  background: linear-gradient(180deg, var(--tui-bg-elevated), var(--tui-bg-tertiary));
  border: 1px solid var(--tui-border);
  border-bottom-width: 3px;
  color: var(--tui-text-primary);
  font-size: var(--tui-font-size-xs);
  box-shadow: 0 1px 0 var(--tui-border-dim);
}

.tui-key-group-md .tui-key-default {
  padding: 6px 10px;
  font-size: var(--tui-font-size-sm);
}

.tui-key-group-lg .tui-key-default {
  padding: 8px 14px;
  font-size: var(--tui-font-size-base);
}

/* Flat variant */
.tui-key-flat {
  padding: 2px 6px;
  background: var(--tui-bg-tertiary);
  border: 1px solid var(--tui-border-dim);
  color: var(--tui-primary);
  font-size: var(--tui-font-size-xs);
}

.tui-key-group-md .tui-key-flat {
  padding: 4px 8px;
  font-size: var(--tui-font-size-xs);
}

.tui-key-group-lg .tui-key-flat {
  padding: 6px 10px;
  font-size: var(--tui-font-size-sm);
}
</style>
