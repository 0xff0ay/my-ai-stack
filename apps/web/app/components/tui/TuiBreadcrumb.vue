<script setup lang="ts">
interface Item {
  label: string;
  to?: string;
  active?: boolean;
}

interface Props {
  items: Item[];
  separator?: string;
}

const props = withDefaults(defineProps<Props>(), {
  separator: '/',
});

const emit = defineEmits<{
  click: [item: Item, index: number];
}>();

function handleClick(item: Item, index: number) {
  if (!item.active && item.to) {
    emit('click', item, index);
  }
}
</script>

<template>
  <nav class="tui-breadcrumb" aria-label="Breadcrumb">
    <ol class="tui-breadcrumb-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="tui-breadcrumb-item"
        :class="{ 'tui-breadcrumb-item-active': item.active }"
      >
        <span v-if="index > 0" class="tui-breadcrumb-separator">{{ separator }}</span>
        <component
          :is="item.to && !item.active ? 'a' : 'span'"
          :href="item.to"
          class="tui-breadcrumb-link"
          :class="{ 'tui-breadcrumb-link-active': item.active }"
          @click.prevent="handleClick(item, index)"
        >
          {{ item.label }}
        </component>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.tui-breadcrumb {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
}

.tui-breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tui-breadcrumb-item {
  display: flex;
  align-items: center;
}

.tui-breadcrumb-separator {
  color: var(--tui-text-muted);
  margin: 0 var(--tui-spacing-sm);
  opacity: 0.5;
}

.tui-breadcrumb-link {
  color: var(--tui-primary);
  text-decoration: none;
  transition: var(--tui-transition);
}

.tui-breadcrumb-link:hover {
  text-decoration: underline;
  text-shadow: 0 0 5px var(--tui-primary);
}

.tui-breadcrumb-link-active {
  color: var(--tui-text-primary);
  cursor: default;
}

.tui-breadcrumb-link-active:hover {
  text-decoration: none;
  text-shadow: none;
}
</style>
