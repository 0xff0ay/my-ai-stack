<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
});
</script>

<template>
  <span :class="['tui-badge', `tui-badge-${variant}`]">
    <slot />
  </span>
</template>