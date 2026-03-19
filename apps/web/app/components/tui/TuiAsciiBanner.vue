<script setup lang="ts">
interface Props {
  text: string;
  variant?: 'default' | 'primary' | 'secondary';
  animated?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  animated: false,
});

// ASCII art transformations
const asciiArt: Record<string, string> = {
  default: `
  ___  __   __  __  __
 / _ \\ \\ \\ / / |  \\/  |
| | | | \\ V /  | |\\/| |
| |_| |  | |   | |  | |
 \\___/   |_|   |_|  |_|
`,
  primary: `
  _   _ ____  ____  ____
 | | | |  _ \\|  _ \\|  _ \\
 | |_| | | | | |_) | |_) |
 |  _  | |_| |  _ <|  __/
 |_| |_|\\___/|_| \\_\\_|
`,
  secondary: `
  ____  _____ ____  _   _ _____
 |  _ \\| ____/ ___|| | | |_   _|
 | | | |  _| \\___ \\| | | | | |
 | |_| | |___ ___) | |_| | | |
 |____/|_____|____/ \\___/  |_|
`,
};
</script>

<template>
  <div class="tui-ascii-wrapper">
    <pre
      :class="['tui-ascii', `tui-ascii-${variant}`, { 'tui-ascii-animated': animated }]"
    >{{ asciiArt[text.toLowerCase()] || text }}</pre>
  </div>
</template>

<style scoped>
.tui-ascii-wrapper {
  overflow-x: auto;
  padding: var(--tui-spacing-sm);
}

.tui-ascii {
  font-size: 0.875rem;
  line-height: 1.1;
}

.tui-ascii-primary {
  color: var(--tui-primary);
}

.tui-ascii-secondary {
  color: var(--tui-secondary);
}

.tui-ascii-animated {
  animation: ascii-glow 2s ease-in-out infinite alternate;
}

@keyframes ascii-glow {
  from {
    text-shadow: 0 0 5px currentColor;
  }
  to {
    text-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
  }
}

@media (min-width: 768px) {
  .tui-ascii {
    font-size: 1rem;
  }
}
</style>