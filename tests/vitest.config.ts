import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/module/**/*.test.ts', 'tests/security/**/*.test.ts', 'tests/performance/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: 'forks',
    reporters: ['default', 'junit'],
    outputFile: { junit: 'artifacts/junit-api.xml' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../backend/src'),
    },
  },
});
