import fs from 'fs';
import path from 'path';
import type { ModuleManifest } from '../manifest';
import type { ModuleDiscovery } from '../ModuleDiscovery';

export interface ModuleQaContribution {
  moduleId: string;
  manifest: ModuleManifest;
  participatesInScenarios: boolean;
  providesSeed: boolean;
  integrationTestPath?: string;
  apiTestPath?: string;
}

/** Sammelt QA-Metadaten aus Modul-Manifesten – keine hartcodierten Modulnamen. */
export class QaRegistry {
  constructor(private readonly discovery: ModuleDiscovery) {}

  listContributions(): ModuleQaContribution[] {
    return this.discovery.discover().map((manifest) => ({
      moduleId: manifest.id,
      manifest,
      participatesInScenarios: manifest.qa?.participatesInScenarios !== false,
      providesSeed: manifest.qa?.providesSeed === true,
      integrationTestPath: this.resolveTestPath(manifest.id, manifest.qa?.integrationTest),
      apiTestPath: this.resolveTestPath(manifest.id, manifest.qa?.apiTest),
    }));
  }

  scenarioModuleIds(): string[] {
    return this.listContributions()
      .filter((c) => c.participatesInScenarios)
      .map((c) => c.moduleId);
  }

  private resolveTestPath(moduleId: string, relative?: string): string | undefined {
    if (!relative) return undefined;
    const modulesDir = process.env.MODULES_DIR || path.join(process.cwd(), 'modules');
    const full = path.join(modulesDir, moduleId, relative);
    return fs.existsSync(full) ? full : undefined;
  }
}
