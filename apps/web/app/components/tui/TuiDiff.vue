<script setup lang="ts">
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  oldLine?: number;
  newLine?: number;
  content: string;
}

interface Props {
  oldContent: string;
  newContent: string;
  filename?: string;
  language?: string;
  unified?: boolean;
  contextLines?: number;
}

const props = withDefaults(defineProps<Props>(), {
  unified: true,
  contextLines: 3,
});

const diffLines = computed<DiffLine[]>(() => {
  const oldLines = props.oldContent.split('\n');
  const newLines = props.newContent.split('\n');
  
  const result: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  
  // Simple diff algorithm
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex < oldLines.length && newIndex < newLines.length && 
        oldLines[oldIndex] === newLines[newIndex]) {
      result.push({
        type: 'unchanged',
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        content: oldLines[oldIndex],
      });
      oldIndex++;
      newIndex++;
    } else {
      // Find next matching line
      let found = false;
      for (let i = 0; i <= props.contextLines && !found; i++) {
        if (oldIndex + i < oldLines.length && newIndex + i < newLines.length &&
            oldLines[oldIndex + i] === newLines[newIndex + i]) {
          // Add removed lines
          for (let j = 0; j < i; j++) {
            if (oldIndex < oldLines.length) {
              result.push({
                type: 'removed',
                oldLine: oldIndex + 1,
                content: oldLines[oldIndex],
              });
              oldIndex++;
            }
          }
          found = true;
        }
      }
      
      if (!found) {
        // Line was removed
        if (oldIndex < oldLines.length) {
          result.push({
            type: 'removed',
            oldLine: oldIndex + 1,
            content: oldLines[oldIndex],
          });
          oldIndex++;
        }
        // Line was added
        if (newIndex < newLines.length) {
          result.push({
            type: 'added',
            newLine: newIndex + 1,
            content: newLines[newIndex],
          });
          newIndex++;
        }
      }
    }
  }
  
  return result;
});

const stats = computed(() => {
  let added = 0;
  let removed = 0;
  diffLines.value.forEach(line => {
    if (line.type === 'added') added++;
    if (line.type === 'removed') removed++;
  });
  return { added, removed };
});
</script>

<template>
  <div class="tui-diff">
    <div v-if="filename" class="tui-diff-header">
      <span class="tui-diff-filename">{{ filename }}</span>
      <div class="tui-diff-stats">
        <span class="tui-diff-stat tui-diff-added">+{{ stats.added }}</span>
        <span class="tui-diff-stat tui-diff-removed">-{{ stats.removed }}</span>
      </div>
    </div>
    
    <div class="tui-diff-content">
      <div
        v-for="(line, index) in diffLines"
        :key="index"
        class="tui-diff-line"
        :class="`tui-diff-line-${line.type}`"
      >
        <span class="tui-diff-line-number tui-diff-old">
          {{ line.oldLine || '' }}
        </span>
        <span class="tui-diff-line-number tui-diff-new">
          {{ line.newLine || '' }}
        </span>
        <span class="tui-diff-marker">
          {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
        </span>
        <span class="tui-diff-content-text">{{ line.content }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-diff {
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--tui-font-mono);
}

.tui-diff::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-diff-filename {
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
}

.tui-diff-stats {
  display: flex;
  gap: var(--tui-spacing-md);
}

.tui-diff-stat {
  font-size: var(--tui-font-size-xs);
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
}

.tui-diff-added {
  background: rgba(0, 255, 0, 0.2);
  color: var(--tui-success);
}

.tui-diff-removed {
  background: rgba(255, 51, 51, 0.2);
  color: var(--tui-error);
}

.tui-diff-content {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.tui-diff-line {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
  padding: 0 var(--tui-spacing-md);
  font-size: var(--tui-font-size-sm);
  line-height: 1.6;
  white-space: pre;
}

.tui-diff-line-number {
  min-width: 40px;
  text-align: right;
  color: var(--tui-text-muted);
  user-select: none;
  padding: 2px 0;
}

.tui-diff-marker {
  width: 12px;
  text-align: center;
  user-select: none;
  font-weight: bold;
}

.tui-diff-content-text {
  flex: 1;
  padding: 2px 0;
}

.tui-diff-line-unchanged {
  background: transparent;
  color: var(--tui-text-secondary);
}

.tui-diff-line-added {
  background: rgba(0, 255, 0, 0.05);
  color: var(--tui-success);
}

.tui-diff-line-added .tui-diff-marker {
  color: var(--tui-success);
}

.tui-diff-line-removed {
  background: rgba(255, 51, 51, 0.05);
  color: var(--tui-error);
}

.tui-diff-line-removed .tui-diff-marker {
  color: var(--tui-error);
}

.tui-diff-line:hover {
  background: rgba(255, 255, 255, 0.02);
}
</style>
