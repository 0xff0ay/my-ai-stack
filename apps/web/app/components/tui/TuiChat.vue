<script setup lang="ts">
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface Props {
  messages?: Message[];
  streaming?: boolean;
  modelName?: string;
}

withDefaults(defineProps<Props>(), {
  messages: () => [],
  streaming: false,
  modelName: 'Claude',
});

const emit = defineEmits<{
  send: [message: string];
}>();

const input = ref('');
const messagesContainer = ref<HTMLElement>();

function sendMessage() {
  if (input.value.trim()) {
    emit('send', input.value);
    input.value = '';
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

watch(() => props.messages.length, scrollToBottom);

onMounted(scrollToBottom);
</script>

<template>
  <div class="tui-chat">
    <div ref="messagesContainer" class="tui-chat-messages tui-scrollbar">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['tui-chat-message', `tui-chat-message-${message.role}`]"
      >
        <div class="tui-chat-message-role">
          {{ message.role === 'user' ? '>' : message.role === 'assistant' ? '◊' : '●' }}
        </div>
        <div class="tui-chat-message-content">
          {{ message.content }}
        </div>
      </div>

      <div v-if="streaming" class="tui-chat-message tui-chat-message-assistant">
        <div class="tui-chat-message-role">◊</div>
        <div class="tui-chat-message-content">
          <span class="tui-cursor" />
        </div>
      </div>
    </div>

    <div class="tui-chat-input-area">
      <div class="tui-chat-model-info" v-if="modelName">
        {{ modelName }}
      </div>
      <form class="tui-chat-input-form" @submit.prevent="sendMessage">
        <span class="tui-chat-prompt">&gt;</span>
        <input
          v-model="input"
          type="text"
          class="tui-chat-input"
          placeholder="Type your message..."
          :disabled="streaming"
        />
        <button
          type="submit"
          class="tui-chat-send"
          :disabled="streaming || !input.trim()"
        >
          SEND
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.tui-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--tui-bg-secondary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  overflow: hidden;
}

.tui-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--tui-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--tui-spacing-md);
}

.tui-chat-message {
  display: flex;
  gap: var(--tui-spacing-sm);
}

.tui-chat-message-user {
  flex-direction: row-reverse;
}

.tui-chat-message-role {
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  color: var(--tui-text-secondary);
  font-weight: bold;
}

.tui-chat-message-user .tui-chat-message-role {
  color: var(--tui-primary);
}

.tui-chat-message-assistant .tui-chat-message-role {
  color: var(--tui-secondary);
}

.tui-chat-message-content {
  flex: 1;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.tui-chat-input-area {
  padding: var(--tui-spacing-md);
  border-top: 1px solid var(--tui-border);
  background: var(--tui-bg-tertiary);
}

.tui-chat-model-info {
  font-size: 0.75rem;
  color: var(--tui-text-muted);
  margin-bottom: var(--tui-spacing-xs);
}

.tui-chat-input-form {
  display: flex;
  align-items: center;
  gap: var(--tui-spacing-sm);
}

.tui-chat-prompt {
  color: var(--tui-primary);
  font-weight: bold;
}

.tui-chat-input {
  flex: 1;
  background: var(--tui-bg-primary);
  border: 1px solid var(--tui-border);
  border-radius: 2px;
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  color: var(--tui-text-primary);
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-base);
}

.tui-chat-input:focus {
  outline: none;
  border-color: var(--tui-primary);
}

.tui-chat-input::placeholder {
  color: var(--tui-text-muted);
}

.tui-chat-send {
  padding: var(--tui-spacing-sm) var(--tui-spacing-md);
  background: var(--tui-primary);
  color: var(--tui-bg-primary);
  border: 1px solid var(--tui-primary);
  border-radius: 2px;
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-sm);
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--tui-transition);
}

.tui-chat-send:hover:not(:disabled) {
  background: var(--tui-primary-dim);
}

.tui-chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>