import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('security audit script exists', () => {
  const script = path.resolve(__dirname, '../../scripts/qa/security-audit.ts');
  expect(fs.existsSync(script)).toBe(true);
});

test('QA artifacts directory is gitignored', () => {
  const gitignore = fs.readFileSync(path.resolve(__dirname, '../../.gitignore'), 'utf8');
  expect(gitignore).toContain('artifacts/');
});
