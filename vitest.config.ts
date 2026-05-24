import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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


