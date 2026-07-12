import { describe, it, expect, afterEach } from 'vitest';
import { resolveAppVersion } from './version';

describe('resolveAppVersion', () => {
  const originalEnv = process.env.CORE_VERSION;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.CORE_VERSION;
    else process.env.CORE_VERSION = originalEnv;
  });

  it('prefers CORE_VERSION env', () => {
    process.env.CORE_VERSION = '9.9.9';
    expect(resolveAppVersion()).toBe('9.9.9');
  });

  it('reads version from package.json', () => {
    delete process.env.CORE_VERSION;
    expect(resolveAppVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
