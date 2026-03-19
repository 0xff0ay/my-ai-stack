<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlay: true,
  closeOnEsc: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const modalRef = ref<HTMLElement>();

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) {
    close();
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown);
    nextTick(() => {
      modalRef.value?.focus();
    });
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="tui-modal">
      <div v-if="modelValue" class="tui-modal-overlay" @click="handleOverlayClick">
        <div
          ref="modalRef"
          class="tui-modal"
          :class="`tui-modal-${size}`"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <div v-if="title || $slots.header" class="tui-modal-header">
            <h3 v-if="title" class="tui-modal-title">{{ title }}</h3>
            <slot name="header" />
            <button class="tui-modal-close" @click="close">✕</button>
          </div>
          
          <div class="tui-modal-body">
            <slot />
          </div>
          
          <div v-if="$slots.footer" class="tui-modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tui-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--tui-spacing-md);
}

.tui-modal {
  background: var(--tui-bg-secondary);
  border: 1px solid var(--tui-border);
  border-radius: 4px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  outline: none;
}

.tui-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tui-primary), var(--tui-secondary));
}

.tui-modal-sm {
  max-width: 400px;
}

.tui-modal-md {
  max-width: 600px;
}

.tui-modal-lg {
  max-width: 900px;
}

.tui-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tui-spacing-md);
  border-bottom: 1px solid var(--tui-border-dim);
}

.tui-modal-title {
  margin: 0;
  font-size: var(--tui-font-size-lg);
  color: var(--tui-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tui-modal-close {
  background: none;
  border: none;
  color: var(--tui-text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: var(--tui-spacing-xs);
  line-height: 1;
  transition: var(--tui-transition);
}

.tui-modal-close:hover {
  color: var(--tui-error);
}

.tui-modal-body {
  padding: var(--tui-spacing-md);
  overflow-y: auto;
  flex: 1;
}

.tui-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--tui-spacing-sm);
  padding: var(--tui-spacing-md);
  border-top: 1px solid var(--tui-border-dim);
  background: var(--tui-bg-tertiary);
}

.tui-modal-enter-active,
.tui-modal-leave-active {
  transition: all 0.3s ease;
}

.tui-modal-enter-from,
.tui-modal-leave-to {
  opacity: 0;
}

.tui-modal-enter-from .tui-modal,
.tui-modal-leave-to .tui-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
