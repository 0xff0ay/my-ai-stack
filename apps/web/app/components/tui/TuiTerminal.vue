<script setup lang="ts">
interface Props {
  lines?: Array<{
    type: 'input' | 'output' | 'error' | 'info';
    prompt?: string;
    content: string;
  }>;
  autoScroll?: boolean;
}

withDefaults(defineProps<Props>(), {
  lines: () => [],
  autoScroll: true,
});

const emit = defineEmits<{
  submit: [command: string];
}>();

const command = ref('');

function handleSubmit() {
  if (command.value.trim()) {
    emit('submit', command.value);
    command.value = '';
  }
}
</script>

<template>
  <div class="tui-terminal tui-scrollbar">
    <div
      v-for="(line, index) in lines"
      :key="index"
      class="tui-terminal-line"
    >
      <span
        v-if="line.prompt"
        class="tui-terminal-prompt"
      >{{ line.prompt }}</span>
      <span
        :class="[
          line.type === 'error' ? 'tui-terminal-error' :
          line.type === 'input' ? 'tui-terminal-command' :
          'tui-terminal-output'
        ]"
      >{{ line.content }}</span>
    </div>

    <div class="tui-terminal-line tui-terminal-input-line">
      <span class="tui-terminal-prompt">&gt;</span>
      <form @submit.prevent="handleSubmit">
        <input
          v-model="command"
          type="text"
          class="tui-terminal-input"
          placeholder="Enter command..."
          autocomplete="off"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.tui-terminal {
  min-height: 300px;
  max-height: 500px;
}

.tui-terminal-input-line {
  margin-top: var(--tui-spacing-sm);
}

.tui-terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--tui-text-primary);
  font-family: var(--tui-font-mono);
  font-size: inherit;
}

.tui-terminal-input::placeholder {
  color: var(--tui-text-muted);
}
</style>