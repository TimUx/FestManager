import path from 'path';

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

export function resolveBackupFile(backupDir: string, filename: string): string {
  const base = path.basename(filename);
  if (!base || base !== filename || !SAFE_FILENAME.test(base)) {
    throw new Error('Ungültiger Backup-Dateiname');
  }
  if (!base.endsWith('.sql.gz') && !base.endsWith('.json.gz')) {
    throw new Error('Backup-Datei muss .sql.gz oder .json.gz enden');
  }
  const resolvedDir = path.resolve(backupDir);
  const resolvedFile = path.resolve(resolvedDir, base);
  if (!resolvedFile.startsWith(`${resolvedDir}${path.sep}`) && resolvedFile !== resolvedDir) {
    throw new Error('Ungültiger Backup-Pfad');
  }
  return resolvedFile;
}

export function detectBackupStrategy(filename: string): 'full' | 'tenant' | 'unknown' {
  if (filename.endsWith('.json.gz')) return 'tenant';
  if (filename.endsWith('.sql.gz')) return 'full';
  return 'unknown';
}

export function buildFullBackupFilename(timestamp: string): string {
  return `full-${timestamp}.sql.gz`;
}

export function buildTenantBackupFilename(slug: string, timestamp: string): string {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `tenant-${safeSlug || 'mandant'}-${timestamp}.json.gz`;
}

export function formatBackupTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}
