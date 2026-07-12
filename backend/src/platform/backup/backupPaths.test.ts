import { describe, it, expect } from 'vitest';
import {
  buildFullBackupFilename,
  buildTenantBackupFilename,
  detectBackupStrategy,
  resolveBackupFile,
} from './backupPaths';

describe('backupPaths', () => {
  it('resolves safe backup paths', () => {
    const file = resolveBackupFile('/app/backups', 'full-20260712-120000.sql.gz');
    expect(file).toBe('/app/backups/full-20260712-120000.sql.gz');
  });

  it('rejects path traversal', () => {
    expect(() => resolveBackupFile('/app/backups', '../etc/passwd.sql.gz')).toThrow();
    expect(() => resolveBackupFile('/app/backups', 'nested/file.sql.gz')).toThrow();
  });

  it('detects backup strategies', () => {
    expect(detectBackupStrategy('full-20260712.sql.gz')).toBe('full');
    expect(detectBackupStrategy('tenant-default-20260712.json.gz')).toBe('tenant');
  });

  it('builds filenames', () => {
    expect(buildFullBackupFilename('20260712-120000')).toBe('full-20260712-120000.sql.gz');
    expect(buildTenantBackupFilename('Mein Verein', '20260712-120000')).toBe('tenant-mein-verein-20260712-120000.json.gz');
  });
});
