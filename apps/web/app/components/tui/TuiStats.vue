<script setup lang="ts">
interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
}

interface Props {
  stats: StatItem[];
  layout?: 'grid' | 'list' | 'compact';
  columns?: 1 | 2 | 3 | 4;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'grid',
  columns: 4,
  animated: true,
});

const colorMap: Record<string, string> = {
  primary: 'var(--tui-primary)',
  success: 'var(--tui-success)',
  warning: 'var(--tui-warning)',
  error: 'var(--tui-error)',
  secondary: 'var(--tui-secondary)',
};

function formatChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

function getChangeColor(value: number): string {
  if (value > 0) return 'var(--tui-success)';
  if (value < 0) return 'var(--tui-error)';
  return 'var(--tui-text-muted)';
}
</script>

<template>
  <div 
    class="tui-stats" 
    :class="[
      `tui-stats-${layout}`,
      `tui-stats-cols-${columns}`
    ]"
  >
    <div
      v-for="stat in stats"
      :key="stat.id"
      class="tui-stat-card"
      :class="{ 'tui-stat-animated': animated }"
    >
      <div class="tui-stat-header">
        <span v-if="stat.icon" class="tui-stat-icon" :style="{ color: colorMap[stat.color || 'primary'] }">
          {{ stat.icon }}
        </span>
        <span class="tui-stat-label">{{ stat.label }}</span>
      </div>
      
      <div class="tui-stat-value" :style="{ color: colorMap[stat.color || 'primary'] }">
        {{ stat.value }}
      </div>
      
      <div v-if="stat.change !== undefined" class="tui-stat-change">
        <span class="tui-stat-change-value" :style="{ color: getChangeColor(stat.change) }">
          {{ formatChange(stat.change) }}
        </span>
        <span v-if="stat.changeLabel" class="tui-stat-change-label">
          {{ stat.changeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-stats {
  display: grid;
  gap: var(--tui-spacing-md);
  font-family: var(--tui-font-mono);
}

.tui-stats-grid {
  grid-template-columns: repeat(v-bind(columns), 1fr);
}

.tui-stats-list {
  grid-template-columns: 1fr;
}

.tui-stats-compact {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tui-spacing-sm);
}

.tui-stats-cols-1 {
  grid-template-columns: 1fr;
}

.tui-stats-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.tui-stats-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.tui-stats-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.tui-stat-card {
  background: var(--tui-bg-secondary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  padding: var(--tui-spacing-md);
  position: relative;
  overflow: hidden;
  transition: var(--tui-transition);
}

.tui-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
  opacity: 0;
  transition: var(--tui-transition);
}

.tui-stat-card:hover::before {
  opacity: 1;
}

.tui-stats-compact .tui-stat-card {
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  min-width: 150px;
}

.tui-stat-header {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  margin-bottom: var(--tui-spacing-sm);
}

.tui-stat-icon {
  font-size: 1.25rem;
}

.tui-stat-label {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-stat-value {
  font-size: var(--tui-font-size-2xl);
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 10px currentColor;
}

.tui-stats-compact .tui-stat-value {
  font-size: var(--tui-font-size-xl);
}

.tui-stat-change {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  margin-top: var(--tui-spacing-sm);
  font-size: var(--tui-font-size-xs);
}

.tui-stat-change-value {
  font-weight: 600;
}

.tui-stat-change-label {
  color: var(--tui-text-muted);
}

.tui-stat-animated {
  animation: stat-glow 4s ease-in-out infinite;
}

@keyframes stat-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
  }
}

@media (max-width: 1024px) {
  .tui-stats-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .tui-stats-cols-2,
  .tui-stats-cols-3,
  .tui-stats-cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
