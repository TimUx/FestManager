import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { Module } from './types';
import type { ModuleManifest } from './manifest';

/**
 * Loads module instances from the filesystem.
 * Modules are pre-built into the Docker image – no runtime installation.
 */
export class ModuleLoader {
  private resolveModuleRoot(manifest: ModuleManifest): string {
    const inModules = path.join(config.modulesDir, manifest.id);
    if (fs.existsSync(path.join(inModules, 'module.json'))) {
      return config.modulesDir;
    }
    const inPlugins = path.join(config.pluginsDir, manifest.id);
    if (fs.existsSync(path.join(inPlugins, 'module.json'))) {
      return config.pluginsDir;
    }
    return config.modulesDir;
  }

  private resolveEntryPath(manifest: ModuleManifest): string {
    const root = this.resolveModuleRoot(manifest);
    const distRoot = root === config.pluginsDir ? config.pluginsDir : config.modulesDistDir;
    const base = path.join(root, manifest.id, manifest.entry);
    const distBase = path.join(distRoot, manifest.id, manifest.entry);

    if (config.nodeEnv === 'production') {
      return distBase.endsWith('.js') ? distBase : `${distBase}.js`;
    }
    return base.endsWith('.ts') ? base : `${base}.ts`;
  }

  async load(manifest: ModuleManifest): Promise<Module> {
    const entryPath = this.resolveEntryPath(manifest);

    try {
      const mod = config.nodeEnv === 'production'
        ? createRequire(__filename)(entryPath) as Record<string, unknown>
        : await import(pathToFileURL(entryPath).href);
      const instance = this.extractModuleInstance(mod, manifest);
      if (instance.id !== manifest.id) {
        throw new Error(`Modul-ID Mismatch: erwartet ${manifest.id}, erhalten ${instance.id}`);
      }
      return instance;
    } catch (err) {
      logger.error(`Modul ${manifest.id} konnte nicht geladen werden`, err);
      throw err;
    }
  }

  private extractModuleInstance(mod: Record<string, unknown>, manifest: ModuleManifest): Module {
    if (mod.default && typeof mod.default === 'object' && 'id' in (mod.default as object)) {
      return mod.default as Module;
    }

    const exportName = manifest.entry === 'index'
      ? `${manifest.id.replace(/-/g, '')}Module`
      : undefined;

    const camelId = manifest.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) + 'Module';
    const candidates = [
      mod[`${manifest.id}Module`],
      mod[camelId],
      exportName ? mod[exportName] : undefined,
      ...Object.values(mod),
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object' && 'id' in candidate && 'install' in candidate) {
        return candidate as Module;
      }
    }

    throw new Error(`Kein Module-Export in ${manifest.id} gefunden`);
  }
}
