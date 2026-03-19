<script setup lang="ts">
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
  children?: MenuItem[];
}

interface Props {
  items: MenuItem[];
  vertical?: boolean;
  collapsed?: boolean;
  showIcons?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  vertical: true,
  collapsed: false,
  showIcons: true,
});

const emit = defineEmits<{
  select: [item: MenuItem];
}>();

const expandedItems = ref<Set<string>>(new Set());

function toggleExpand(item: MenuItem) {
  if (!item.children?.length) return;
  
  const newSet = new Set(expandedItems.value);
  if (newSet.has(item.id)) {
    newSet.delete(item.id);
  } else {
    newSet.add(item.id);
  }
  expandedItems.value = newSet;
}

function isExpanded(item: MenuItem) {
  return expandedItems.value.has(item.id) || item.active;
}

function handleClick(item: MenuItem) {
  if (item.disabled) return;
  
  if (item.children?.length) {
    toggleExpand(item);
  } else {
    emit('select', item);
  }
}
</script>

<template>
  <nav 
    class="tui-menu" 
    :class="{ 
      'tui-menu-vertical': vertical,
      'tui-menu-horizontal': !vertical,
      'tui-menu-collapsed': collapsed 
    }"
  >
    <ul class="tui-menu-list">
      <li 
        v-for="item in items" 
        :key="item.id"
        class="tui-menu-item"
        :class="{ 
          'tui-menu-item-active': item.active,
          'tui-menu-item-disabled': item.disabled,
          'tui-menu-item-has-children': item.children?.length 
        }"
      >
        <component
          :is="item.to && !item.children?.length ? 'a' : 'button'"
          :href="item.to"
          type="button"
          class="tui-menu-link"
          @click.prevent="handleClick(item)"
        >
          <span v-if="showIcons && item.icon" class="tui-menu-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="tui-menu-label">{{ item.label }}</span>
          <span v-if="item.badge && !collapsed" class="tui-menu-badge">{{ item.badge }}</span>
          <span 
            v-if="item.children?.length && !collapsed" 
            class="tui-menu-expand"
            :class="{ 'tui-menu-expanded': isExpanded(item) }"
          >
            ▶
          </span>
        </component>
        
        <Transition name="tui-menu-submenu">
          <ul 
            v-if="item.children?.length && isExpanded(item) && !collapsed" 
            class="tui-menu-submenu"
          >
            <li 
              v-for="child in item.children" 
              :key="child.id"
              class="tui-menu-item tui-menu-item-child"
              :class="{ 
                'tui-menu-item-active': child.active,
                'tui-menu-item-disabled': child.disabled 
              }"
            >
              <component
                :is="child.to ? 'a' : 'button'"
                :href="child.to"
                type="button"
                class="tui-menu-link"
                @click.prevent="!child.disabled && emit('select', child)"
              >
                <span v-if="showIcons && child.icon" class="tui-menu-icon">{{ child.icon }}</span>
                <span class="tui-menu-label">{{ child.label }}</span>
                <span v-if="child.badge" class="tui-menu-badge">{{ child.badge }}</span>
              </component>
            </li>
          </ul>
        </Transition>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.tui-menu {
  font-family: var(--tui-font-mono);
}

.tui-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
}

.tui-menu-vertical .tui-menu-list {
  flex-direction: column;
}

.tui-menu-horizontal .tui-menu-list {
  flex-direction: row;
  gap: var(--tui-spacing-xs);
}

.tui-menu-item {
  position: relative;
}

.tui-menu-vertical .tui-menu-item {
  display: flex;
  flex-direction: column;
}

.tui-menu-link {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  color: var(--tui-text-secondary);
  text-decoration: none;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: var(--tui-font-size-sm);
  cursor: pointer;
  transition: var(--tui-transition);
  text-align: left;
  width: 100%;
}

.tui-menu-link:hover {
  color: var(--tui-text-primary);
  background: var(--tui-bg-tertiary);
}

.tui-menu-item-active > .tui-menu-link {
  color: var(--tui-primary);
  background: rgba(0, 255, 255, 0.05);
  border-left: 2px solid var(--tui-primary);
}

.tui-menu-horizontal .tui-menu-item-active > .tui-menu-link {
  border-left: none;
  border-bottom: 2px solid var(--tui-primary);
}

.tui-menu-item-disabled > .tui-menu-link {
  opacity: 0.4;
  cursor: not-allowed;
}

.tui-menu-icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.tui-menu-collapsed .tui-menu-icon {
  width: auto;
}

.tui-menu-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tui-menu-badge {
  font-size: var(--tui-font-size-xs);
  padding: 2px 6px;
  background: var(--tui-primary);
  color: var(--tui-bg-primary);
  border-radius: 2px;
  min-width: 18px;
  text-align: center;
}

.tui-menu-expand {
  font-size: 0.625rem;
  transition: transform 0.2s ease;
}

.tui-menu-expanded {
  transform: rotate(90deg);
}

.tui-menu-submenu {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.tui-menu-item-child .tui-menu-link {
  padding-left: calc(var(--tui-spacing-md) + 20px + var(--tui-spacing-sm));
  font-size: var(--tui-font-size-xs);
}

.tui-menu-submenu-enter-active,
.tui-menu-submenu-leave-active {
  transition: all 0.2s ease;
}

.tui-menu-submenu-enter-from,
.tui-menu-submenu-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
