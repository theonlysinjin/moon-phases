import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Prevent loading project PostCSS/Tailwind config during tests
  css: {
    postcss: {}
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['test/**/*.test.ts'],
    deps: {
      inline: ['astronomy-engine']
    }
  }
});


