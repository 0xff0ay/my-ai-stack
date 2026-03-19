<script setup lang="ts">
interface TimelineItem {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  icon?: string;
}

interface Props {
  items: TimelineItem[];
  mode?: 'left' | 'right' | 'alternate';
  reverse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'left',
  reverse: false,
});

const typeColors: Record<string, string> = {
  default: 'var(--tui-text-secondary)',
  primary: 'var(--tui-primary)',
  success: 'var(--tui-success)',
  warning: 'var(--tui-warning)',
  error: 'var(--tui-error)',
};

const typeIcons: Record<string, string> = {
  default: '●',
  primary: '◆',
  success: '✓',
  warning: '⚠',
  error: '✗',
};

function formatTime(timestamp: Date) {
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const sortedItems = computed(() => {
  const sorted = [...props.items].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );
  return props.reverse ? sorted.reverse() : sorted;
});
</script>

<template>
  <div class="tui-timeline" :class="`tui-timeline-${mode}`">
    <div 
      v-for="(item, index) in sortedItems" 
      :key="item.id"
      class="tui-timeline-item"
      :class="{ 
        'tui-timeline-item-left': mode === 'alternate' && index % 2 === 0,
        'tui-timeline-item-right': mode === 'alternate' && index % 2 === 1
      }"
    >
      <div class="tui-timeline-marker" :style="{ color: typeColors[item.type || 'default'] }">
        <span class="tui-timeline-icon">{{ item.icon || typeIcons[item.type || 'default'] }}</span>
        <div class="tui-timeline-line" />
      </div>
      
      <div class="tui-timeline-content">
        <div class="tui-timeline-header">
          <time class="tui-timeline-time">{{ formatTime(item.timestamp) }}</time>
        </div>
        
        <h4 class="tui-timeline-title">{{ item.title }}</h4>
        
        <p v-if="item.description" class="tui-timeline-description">
          {{ item.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-timeline {
  position: relative;
  font-family: var(--tui-font-mono);
}

.tui-timeline-item {
  display: flex;
  gap: var(--tui-spacing-md);
  padding-bottom: var(--tui-spacing-lg);
  position: relative;
}

.tui-timeline-item:last-child {
  padding-bottom: 0;
}

.tui-timeline-item:last-child .tui-timeline-line {
  display: none;
}

.tui-timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tui-timeline-icon {
  font-size: 0.875rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.tui-timeline-line {
  width: 2px;
  flex: 1;
  background: var(--tui-border-dim);
  margin-top: var(--tui-spacing-sm);
}

.tui-timeline-content {
  flex: 1;
  padding-top: 2px;
}

.tui-timeline-header {
  margin-bottom: var(--tui-spacing-xs);
}

.tui-timeline-time {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
}

.tui-timeline-title {
  margin: 0;
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
  font-weight: 600;
}

.tui-timeline-description {
  margin: var(--tui-spacing-xs) 0 0;
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-secondary);
  line-height: 1.5;
}

/* Alternate mode */
.tui-timeline-alternate .tui-timeline-item {
  width: 50%;
}

.tui-timeline-alternate .tui-timeline-item-left {
  margin-left: 0;
  margin-right: auto;
  flex-direction: row-reverse;
  text-align: right;
}

.tui-timeline-alternate .tui-timeline-item-right {
  margin-left: auto;
  margin-right: 0;
}

.tui-timeline-right .tui-timeline-item {
  flex-direction: row-reverse;
  text-align: right;
}
</style>
