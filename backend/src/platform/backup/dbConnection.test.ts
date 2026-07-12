import { describe, it, expect } from 'vitest';
import { parseDatabaseUrl } from './dbConnection';

describe('parseDatabaseUrl', () => {
  it('parses postgres urls', () => {
    const cfg = parseDatabaseUrl('postgresql://user:pass@postgres:5432/festschmiede');
    expect(cfg.user).toBe('user');
    expect(cfg.password).toBe('pass');
    expect(cfg.host).toBe('postgres');
    expect(cfg.port).toBe(5432);
    expect(cfg.database).toBe('festschmiede');
  });

  it('rejects invalid urls', () => {
    expect(() => parseDatabaseUrl('')).toThrow();
    expect(() => parseDatabaseUrl('mysql://x')).toThrow();
  });
});
