<script setup lang="ts">
interface Props {
  content: string;
  class?: string;
}

const props = defineProps<Props>();

// Simple markdown parser for terminal-like rendering
const parsedContent = computed(() => {
  let html = props.content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="tui-md-h3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="tui-md-h2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="tui-md-h1">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="tui-md-strong"><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="tui-md-strong">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="tui-md-em">$1</em>')
    .replace(/_(.*?)_/g, '<em class="tui-md-em">$1</em>')
    // Code
    .replace(/`([^`]+)`/g, '<code class="tui-md-code">$1</code>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="tui-md-pre"><code class="tui-md-code-block">$2</code></pre>')
    // Blockquote
    .replace(/^> (.*$)/gim, '<blockquote class="tui-md-blockquote">$1</blockquote>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="tui-md-li">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="tui-md-li">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="tui-md-li">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="tui-md-link" href="$2" target="_blank" rel="noopener">$1</a>')
    // Horizontal rule
    .replace(/^---+$/gim, '<hr class="tui-md-hr" />')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  // Wrap consecutive list items in ul/ol
  html = html.replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="tui-md-ul">$1</ul>');
  
  return html;
});
</script>

<template>
  <div class="tui-markdown" :class="props.class" v-html="parsedContent" />
</template>

<style scoped>
.tui-markdown {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  line-height: 1.7;
  color: var(--tui-text-primary);
}

.tui-markdown :deep(.tui-md-h1) {
  font-size: var(--tui-font-size-2xl);
  font-weight: 700;
  color: var(--tui-primary);
  margin: var(--tui-spacing-lg) 0 var(--tui-spacing-md);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--tui-border);
  padding-bottom: var(--tui-spacing-sm);
}

.tui-markdown :deep(.tui-md-h2) {
  font-size: var(--tui-font-size-xl);
  font-weight: 600;
  color: var(--tui-secondary);
  margin: var(--tui-spacing-lg) 0 var(--tui-spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-markdown :deep(.tui-md-h3) {
  font-size: var(--tui-font-size-lg);
  font-weight: 600;
  color: var(--tui-accent);
  margin: var(--tui-spacing-md) 0 var(--tui-spacing-sm);
}

.tui-markdown :deep(p) {
  margin: var(--tui-spacing-sm) 0;
}

.tui-markdown :deep(.tui-md-strong) {
  color: var(--tui-primary);
  font-weight: 700;
}

.tui-markdown :deep(.tui-md-em) {
  color: var(--tui-text-secondary);
  font-style: italic;
}

.tui-markdown :deep(.tui-md-code) {
  background: var(--tui-bg-tertiary);
  color: var(--tui-success);
  padding: 2px 6px;
  border-radius: 2px;
  font-size: var(--tui-font-size-xs);
}

.tui-markdown :deep(.tui-md-pre) {
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  padding: var(--tui-spacing-md);
  overflow-x: auto;
  margin: var(--tui-spacing-md) 0;
}

.tui-markdown :deep(.tui-md-code-block) {
  background: transparent;
  color: var(--tui-text-primary);
  padding: 0;
  font-size: var(--tui-font-size-sm);
  line-height: 1.5;
}

.tui-markdown :deep(.tui-md-blockquote) {
  border-left: 3px solid var(--tui-primary);
  padding-left: var(--tui-spacing-md);
  margin: var(--tui-spacing-md) 0;
  color: var(--tui-text-secondary);
  font-style: italic;
}

.tui-markdown :deep(.tui-md-ul) {
  list-style: none;
  padding-left: var(--tui-spacing-lg);
  margin: var(--tui-spacing-sm) 0;
}

.tui-markdown :deep(.tui-md-li) {
  position: relative;
  padding-left: var(--tui-spacing-md);
  margin: var(--tui-spacing-xs) 0;
}

.tui-markdown :deep(.tui-md-li::before) {
  content: '›';
  position: absolute;
  left: 0;
  color: var(--tui-primary);
}

.tui-markdown :deep(.tui-md-link) {
  color: var(--tui-info);
  text-decoration: none;
  border-bottom: 1px dotted var(--tui-info);
  transition: var(--tui-transition);
}

.tui-markdown :deep(.tui-md-link:hover) {
  color: var(--tui-primary);
  border-bottom-style: solid;
  text-shadow: 0 0 5px var(--tui-primary);
}

.tui-markdown :deep(.tui-md-hr) {
  border: none;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--tui-border),
    var(--tui-border),
    transparent
  );
  margin: var(--tui-spacing-lg) 0;
}
</style>
