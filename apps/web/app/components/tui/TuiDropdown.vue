<script setup lang="ts">
interface Item {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

interface Props {
  items: Item[];
  trigger?: 'click' | 'hover';
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'click',
  placement: 'bottom',
});

const emit = defineEmits<{
  select: [item: Item];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function select(item: Item) {
  if (item.disabled || item.separator) return;
  emit('select', item);
  close();
}

function handleTrigger() {
  if (props.trigger === 'click') {
    toggle();
  }
}

function handleMouseEnter() {
  if (props.trigger === 'hover') {
    isOpen.value = true;
  }
}

function handleMouseLeave() {
  if (props.trigger === 'hover') {
    isOpen.value = false;
  }
}

onClickOutside(dropdownRef, close);
</script>

<template>
  <div
    ref="dropdownRef"
    class="tui-dropdown"
    :class="{ 'tui-dropdown-open': isOpen }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="tui-dropdown-trigger" @click="handleTrigger">
      <slot name="trigger">
        <button type="button" class="tui-button">
          Menu ▼
        </button>
      </slot>
    </div>
    
    <Transition name="tui-dropdown">
      <div v-if="isOpen" class="tui-dropdown-menu" :class="`tui-dropdown-${placement}`">
        <div class="tui-dropdown-content">
          <template v-for="(item, index) in items" :key="item.id">
            <div v-if="item.separator" class="tui-dropdown-separator" />
            <button
              v-else
              type="button"
              class="tui-dropdown-item"
              :class="{ 'tui-dropdown-item-disabled': item.disabled }"
              :disabled="item.disabled"
              @click="select(item)"
            >
              <span v-if="item.icon" class="tui-dropdown-icon">{{ item.icon }}</span>
              <span class="tui-dropdown-label">{{ item.label }}</span>
              <span v-if="item.shortcut" class="tui-dropdown-shortcut">{{ item.shortcut }}</span>
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tui-dropdown {
  position: relative;
  display: inline-flex;
}

.tui-dropdown-trigger {
  cursor: pointer;
}

.tui-dropdown-menu {
  position: absolute;
  z-index: 100;
  min-width: 180px;
  background: var(--tui-bg-elevated);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.tui-dropdown-bottom {
  top: 100%;
  left: 0;
  margin-top: 4px;
}

.tui-dropdown-top {
  bottom: 100%;
  left: 0;
  margin-bottom: 4px;
}

.tui-dropdown-left {
  right: 100%;
  top: 0;
  margin-right: 4px;
}

.tui-dropdown-right {
  left: 100%;
  top: 0;
  margin-left: 4px;
}

.tui-dropdown-content {
  padding: var(--tui-spacing-xs);
  display: flex;
  flex-direction: column;
}

.tui-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: transparent;
  border: none;
  color: var(--tui-text-primary);
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  cursor: pointer;
  border-radius: 2px;
  transition: var(--tui-transition);
  text-align: left;
}

.tui-dropdown-item:hover:not(:disabled) {
  background: var(--tui-bg-tertiary);
  color: var(--tui-primary);
}

.tui-dropdown-item-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-dropdown-icon {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.tui-dropdown-label {
  flex: 1;
}

.tui-dropdown-shortcut {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  margin-left: var(--tui-spacing-md);
}

.tui-dropdown-separator {
  height: 1px;
  background: var(--tui-border-dim);
  margin: var(--tui-spacing-xs) 0;
}

.tui-dropdown-enter-active,
.tui-dropdown-leave-active {
  transition: all 0.15s ease;
}

.tui-dropdown-enter-from,
.tui-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
