import { prisma } from '../../../config/database';
import { moduleIdFromNamespace } from '../SettingsNamespaces';
import type { SettingsStore } from '../types';

export class ModuleSettingsStore implements SettingsStore {
  supports(namespace: string): boolean {
    return moduleIdFromNamespace(namespace) !== null;
  }

  async load(namespace: string): Promise<Record<string, unknown>> {
    const moduleId = moduleIdFromNamespace(namespace);
    if (!moduleId) throw new Error(`Invalid module namespace: ${namespace}`);

    const row = await prisma.installedModule.findUnique({ where: { moduleId } });
    const json = (row?.configJson ?? {}) as Record<string, unknown>;
    return structuredClone(json);
  }

  async save(namespace: string, values: Record<string, unknown>): Promise<void> {
    const moduleId = moduleIdFromNamespace(namespace);
    if (!moduleId) throw new Error(`Invalid module namespace: ${namespace}`);

    const existing = await prisma.installedModule.findUnique({ where: { moduleId } });
    if (!existing) {
      await prisma.installedModule.create({
        data: {
          moduleId,
          configJson: values as object,
          installed: false,
          enabled: false,
        },
      });
      return;
    }

    await prisma.installedModule.update({
      where: { moduleId },
      data: { configJson: values as object },
    });
  }
}
