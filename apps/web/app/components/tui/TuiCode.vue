<script setup lang="ts">
interface Props {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  copyable?: boolean;
  filename?: string;
}

const props = withDefaults(defineProps<Props>(), {
  language: 'text',
  showLineNumbers: true,
  copyable: true,
});

const copied = ref(false);
const lines = computed(() => props.code.split('\n'));

async function copyCode() {
  if (!props.copyable) return;
  
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
}
</script>

<template>
  <div class="tui-code-block">
    <div v-if="filename || copyable" class="tui-code-header">
      <div class="tui-code-meta">
        <span v-if="filename" class="tui-code-filename">{{ filename }}</span>
        <span v-if="language && language !== 'text'" class="tui-code-lang">{{ language }}</span>
      </div>
      <button 
        v-if="copyable" 
        class="tui-code-copy" 
        :class="{ 'tui-code-copy-copied': copied }"
        @click="copyCode"
      >
        <span v-if="copied">✓ COPIED</span>
        <span v-else>⎘ COPY</span>
      </button>
    </div>
    
    <div class="tui-code-content">
      <div v-if="showLineNumbers" class="tui-code-lines">
        <span 
          v-for="(_, index) in lines" 
          :key="index" 
          class="tui-code-line-number"
        >
          {{ index + 1 }}
        </span>
      </div>
      <pre class="tui-code-pre"><code class="tui-code"><slot><span 
          v-for="(line, index) in lines" 
          :key="index"
          class="tui-code-line"
        >{{ line }}</span></slot></code></pre>
    </div>
  </div>
</template>

<style scoped>
.tui-code-block {
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
  font-family: var(--tui-font-mono);
}

.tui-code-block::before {
  content: '';
  display: block;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-bg-tertiary);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-code-meta {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-md);
}

.tui-code-filename {
  font-size: var(--tui-font-size-sm);
  color: var(--tui-text-primary);
}

.tui-code-lang {
  font-size: var(--tui-font-size-xs);
  color: var(--tui-text-muted);
  text-transform: uppercase;
  padding: 2px 6px;
  background: var(--tui-bg-secondary);
  border-radius: 2px;
}

.tui-code-copy {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-xs);
  padding: 4px 8px;
  background: var(--tui-bg-secondary);
  color: var(--tui-text-secondary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  cursor: pointer;
  transition: var(--tui-transition);
  text-transform: uppercase;
}

.tui-code-copy:hover {
  border-color: var(--tui-primary);
  color: var(--tui-primary);
}

.tui-code-copy-copied {
  background: var(--tui-success);
  color: var(--tui-bg-primary);
  border-color: var(--tui-success);
}

.tui-code-content {
  display: flex;
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.tui-code-lines {
  display: flex;
  flex-direction: column;
  padding: var(--tui-spacing-md) var(--tui-spacing-sm);
  background: var(--tui-bg-tertiary);
  border-right: 1px solid var(--tui-border-dim);
  user-select: none;
}

.tui-code-line-number {
  font-size: var(--tui-font-size-sm);
  line-height: 1.5;
  color: var(--tui-text-muted);
  text-align: right;
  min-width: 2ch;
  padding-right: var(--tui-spacing-md);
}

.tui-code-pre {
  margin: 0;
  padding: var(--tui-spacing-md);
  flex: 1;
  overflow: auto;
}

.tui-code {
  display: flex;
  flex-direction: column;
  font-size: var(--tui-font-size-sm);
  line-height: 1.5;
  color: var(--tui-text-primary);
}

.tui-code-line {
  display: block;
  white-space: pre;
}
</style>
