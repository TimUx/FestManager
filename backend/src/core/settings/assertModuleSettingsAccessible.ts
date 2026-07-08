import { moduleRegistry } from '../../platform/bootstrap';
import { AppError } from '../../middleware/errorHandler';

/** Modul-Settings sind editierbar sobald das Modul installiert ist (Konfiguration vor Aktivierung). */
export async function assertModuleSettingsAccessible(namespace: string): Promise<void> {
  if (!namespace.startsWith('module.')) return;

  const moduleId = namespace.slice('module.'.length);
  const modules = await moduleRegistry.getAllModuleInfo();
  const mod = modules.find((m) => m.id === moduleId);

  if (!mod?.installed) {
    throw new AppError(404, 'Modul-Einstellungen nicht verfügbar');
  }
}

export async function getInstalledModuleIds(): Promise<Set<string>> {
  const modules = await moduleRegistry.getAllModuleInfo();
  return new Set(modules.filter((m) => m.installed).map((m) => m.id));
}
