import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'modules/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../artifacts/coverage',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts', 'modules/**/*.ts'],
      exclude: ['**/*.test.ts', 'dist/**'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
