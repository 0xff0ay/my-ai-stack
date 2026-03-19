<script setup lang="ts">
interface Props {
  message?: string;
  showText?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: 'INITIALIZING',
  showText: true,
});

const columns = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${5 + Math.random() * 5}s`,
}));

const characters = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01';
</script>

<template>
  <div class="tui-loading">
    <div class="tui-matrix">
      <div
        v-for="col in columns"
        :key="col.id"
        class="tui-matrix-column"
        :style="{
          left: col.left,
          animationDelay: col.delay,
          animationDuration: col.duration,
        }"
      >
        {{ Array.from({ length: 20 }, () => characters[Math.floor(Math.random() * characters.length)]).join('') }}
      </div>
    </div>

    <div class="tui-loading-content">
      <div class="tui-loading-spinner">
        <div class="tui-spinner tui-spinner-large" />
      </div>
      <p v-if="showText" class="tui-loading-text">
        <span
          v-for="(char, index) in message"
          :key="index"
          class="tui-loading-char"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >{{ char }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.tui-loading {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: hidden;
}

.tui-matrix {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tui-matrix-column {
  position: absolute;
  top: 0;
  font-family: var(--tui-font-mono);
  font-size: 14px;
  color: var(--tui-primary);
  writing-mode: vertical-rl;
  text-orientation: upright;
  animation: matrix-rain 8s linear infinite;
  opacity: 0.2;
}

@keyframes matrix-rain {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(200%);
  }
}

.tui-loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tui-spacing-lg);
}

.tui-loading-spinner {
  position: relative;
}

.tui-loading-spinner::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--tui-primary);
  animation: spin-ring 1.5s ease-in-out infinite;
}

@keyframes spin-ring {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.tui-loading-text {
  font-family: var(--tui-font-mono);
  font-size: var(--tui-font-size-lg);
  color: var(--tui-primary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.tui-loading-char {
  display: inline-block;
  animation: char-blink 0.5s ease-in-out infinite alternate;
}

@keyframes char-blink {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
</style>