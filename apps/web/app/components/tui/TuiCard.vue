<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
});
</script>

<template>
  <div class="tui-card">
    <div v-if="title || $slots.header" class="tui-card-header">
      <h3 v-if="title" class="tui-card-title">{{ title }}</h3>
      <p v-if="description" class="tui-card-description">{{ description }}</p>
      <slot name="header" />
    </div>
    <div class="tui-card-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="tui-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>