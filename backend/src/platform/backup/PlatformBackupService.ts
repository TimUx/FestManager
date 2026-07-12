import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler';
import type { AuditService } from '../AuditService';
import {
  buildFullBackupFilename,
  buildTenantBackupFilename,
  detectBackupStrategy,
  formatBackupTimestamp,
  resolveBackupFile,
} from './backupPaths';
import { parseDatabaseUrl } from './dbConnection';
import {
  assertPgToolsAvailable,
  createPgDumpGzip,
  readGzipJson,
  restorePgDumpGzip,
  validateGzipFile,
  writeGzipJson,
} from './pgTools';
import { tenantBackupService, type TenantBackupPayload } from './TenantBackupService';

export interface BackupEntry {
  filename: string;
  strategy: 'full' | 'tenant' | 'unknown';
  createdAt: string;
  sizeBytes: number;
  tenantSlug: string | null;
  tenantName: string | null;
  restorable: boolean;
  source: 'manual' | 'automatic';
}

export interface BackupOverview {
  strategies: Array<'full' | 'tenant'>;
  lastFullBackup: string | null;
  restoreAvailable: boolean;
  backupDir: string;
  pgToolsAvailable: boolean;
  items: BackupEntry[];
}

export class PlatformBackupService {
  constructor(private readonly audit: AuditService) {}

  getBackupDir(): string {
    return process.env.FESTSCHMIEDE_BACKUP_DIR || path.join(process.cwd(), 'backups');
  }

  async getOverview(): Promise<BackupOverview> {
    const backupDir = this.getBackupDir();
    await this.ensureBackupDir();
    let pgToolsAvailable = true;
    try {
      await assertPgToolsAvailable();
    } catch {
      pgToolsAvailable = false;
    }

    const items = await this.listBackups();
    const fullBackups = items.filter((item) => item.strategy === 'full' && item.restorable);
    const lastFullBackup = fullBackups.length > 0 ? fullBackups[0].createdAt : null;

    return {
      strategies: ['full', 'tenant'],
      lastFullBackup,
      restoreAvailable: pgToolsAvailable && items.some((item) => item.restorable),
      backupDir,
      pgToolsAvailable,
      items,
    };
  }

  async createFullBackup(actorId: string): Promise<BackupEntry> {
    await assertPgToolsAvailable();
    const backupDir = this.getBackupDir();
    await this.ensureBackupDir();

    const timestamp = formatBackupTimestamp();
    const filename = buildFullBackupFilename(timestamp);
    const filePath = resolveBackupFile(backupDir, filename);
    const db = parseDatabaseUrl(config.databaseUrl);

    await createPgDumpGzip(filePath, db);
    await this.audit.log({
      action: 'platform.backup.full.create',
      actorId,
      details: { filename },
    });

    return (await this.describeBackup(filename))!;
  }

  async createTenantBackup(tenantId: string, actorId: string): Promise<BackupEntry> {
    const payload = await tenantBackupService.exportTenant(tenantId);
    const backupDir = this.getBackupDir();
    await this.ensureBackupDir();

    const timestamp = formatBackupTimestamp();
    const filename = buildTenantBackupFilename(payload.tenantSlug, timestamp);
    const filePath = resolveBackupFile(backupDir, filename);

    await writeGzipJson(filePath, payload);
    await this.audit.log({
      action: 'platform.backup.tenant.create',
      actorId,
      tenantId,
      details: { filename, tenantSlug: payload.tenantSlug },
    });

    return (await this.describeBackup(filename))!;
  }

  async validateBackup(filename: string): Promise<{ ok: true; sizeBytes: number; strategy: BackupEntry['strategy'] }> {
    const filePath = this.resolveExisting(filename);
    const { sizeBytes } = await validateGzipFile(filePath);
    const strategy = detectBackupStrategy(filename);

    if (strategy === 'tenant') {
      const payload = await readGzipJson<TenantBackupPayload>(filePath);
      if (payload.type !== 'tenant') {
        throw new AppError(400, 'Ungültiges Mandanten-Backup');
      }
    }

    return { ok: true, sizeBytes, strategy };
  }

  async restoreBackup(filename: string, actorId: string): Promise<{ strategy: 'full' | 'tenant'; message: string }> {
    await assertPgToolsAvailable();
    const filePath = this.resolveExisting(filename);
    const strategy = detectBackupStrategy(filename);
    if (strategy === 'unknown') {
      throw new AppError(400, 'Backup-Typ wird nicht unterstützt');
    }

    if (strategy === 'full') {
      const preRestoreName = `pre-restore-${formatBackupTimestamp()}.sql.gz`;
      const preRestorePath = resolveBackupFile(this.getBackupDir(), preRestoreName);
      const db = parseDatabaseUrl(config.databaseUrl);
      await createPgDumpGzip(preRestorePath, db);
      await restorePgDumpGzip(filePath, db);
      await this.audit.log({
        action: 'platform.backup.full.restore',
        actorId,
        details: { filename, preRestore: preRestoreName },
      });
      return {
        strategy: 'full',
        message: `Vollbackup wiederhergestellt. Sicherungskopie vor Restore: ${preRestoreName}`,
      };
    }

    const payload = await readGzipJson<TenantBackupPayload>(filePath);
    const result = await tenantBackupService.restoreTenant(payload);
    await this.audit.log({
      action: 'platform.backup.tenant.restore',
      actorId,
      tenantId: result.tenantId,
      details: { filename, tenantSlug: result.tenantSlug },
    });
    return {
      strategy: 'tenant',
      message: `Mandanten-Backup für '${result.tenantSlug}' wiederhergestellt`,
    };
  }

  async deleteBackup(filename: string, actorId: string): Promise<void> {
    const filePath = this.resolveExisting(filename);
    if (filename.startsWith('pre-migrate-') || filename.startsWith('pre-restore-')) {
      throw new AppError(403, 'Automatische Sicherungen können nicht gelöscht werden');
    }
    fs.unlinkSync(filePath);
    await this.audit.log({
      action: 'platform.backup.delete',
      actorId,
      details: { filename },
    });
  }

  resolveDownloadPath(filename: string): string {
    return this.resolveExisting(filename);
  }

  private async ensureBackupDir(): Promise<void> {
    const backupDir = this.getBackupDir();
    await fs.promises.mkdir(backupDir, { recursive: true });
  }

  private resolveExisting(filename: string): string {
    const filePath = resolveBackupFile(this.getBackupDir(), filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError(404, 'Backup nicht gefunden');
    }
    return filePath;
  }

  private async listBackups(): Promise<BackupEntry[]> {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir)
      .filter((name) => name.endsWith('.sql.gz') || name.endsWith('.json.gz'))
      .sort((a, b) => b.localeCompare(a));

    const entries: BackupEntry[] = [];
    for (const filename of files) {
      const entry = await this.describeBackup(filename);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  private async describeBackup(filename: string): Promise<BackupEntry | null> {
    try {
      const filePath = resolveBackupFile(this.getBackupDir(), filename);
      if (!fs.existsSync(filePath)) return null;
      const stat = fs.statSync(filePath);
      const strategy = detectBackupStrategy(filename);
      let tenantSlug: string | null = null;
      let tenantName: string | null = null;

      if (strategy === 'tenant') {
        try {
          const payload = await readGzipJson<TenantBackupPayload>(filePath);
          tenantSlug = payload.tenantSlug;
          tenantName = payload.tenantName;
        } catch {
          /* ignore parse errors for listing */
        }
      }

      const source: BackupEntry['source'] =
        filename.startsWith('pre-migrate-') || filename.startsWith('pre-restore-') || filename.startsWith('pre-install-')
          ? 'automatic'
          : 'manual';

      return {
        filename,
        strategy,
        createdAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
        tenantSlug,
        tenantName,
        restorable: strategy === 'full' || strategy === 'tenant',
        source,
      };
    } catch {
      return null;
    }
  }
}
