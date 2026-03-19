<script setup lang="ts">
interface Props {
  title?: string;
  variant?: 'default' | 'primary' | 'accent';
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
});
</script>

<template>
  <div :class="['tui-box', `tui-box-${variant}`]">
    <div v-if="title" class="tui-box-header">
      <span class="tui-box-title">{{ title }}</span>
      <slot name="header-actions" />
    </div>
    <div class="tui-box-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tui-box-primary {
  border-color: var(--tui-primary);
}

.tui-box-primary::before {
  background: var(--tui-primary);
}

.tui-box-accent {
  border-color: var(--tui-secondary);
}

.tui-box-accent::before {
  background: var(--tui-secondary);
}
</style>