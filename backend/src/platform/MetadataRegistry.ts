import type { Module, ModuleMenuItem, ModulePermissionDefinition, ModuleWidget, FeatureContext, ResolvedModuleMetadata } from './types';
import type { ModuleManifest } from './manifest';

/**
 * Metadata-first: manifests declare UI/API metadata; runtime registrations are fallback.
 */
export class MetadataRegistry {
  private resolved = new Map<string, ResolvedModuleMetadata>();

  resolve(
    manifest: ModuleManifest,
    module: Module,
    activated: boolean,
    context: FeatureContext
  ): ResolvedModuleMetadata {
    const contract = module.getConfigContract?.();
    const hasConfig = Boolean(contract);

    const menus = this.resolveMenus(manifest, module, activated, context);
    const widgets = this.resolveWidgets(manifest, module, activated, context);
    const permissions = this.resolvePermissions(manifest);
    const settings = this.resolveSettings(manifest, hasConfig);
    const routes = manifest.routes ?? [];
    const reports = (manifest.reports ?? []).map((r) => ({
      ...r,
      path: r.path ?? `/admin/reports/${manifest.id}/${r.id}`,
    }));
    const developerPages = (manifest.developerPages ?? []).map((p) => ({
      ...p,
      path: p.path ?? `/admin/developer/${manifest.id}/${p.id}`,
    }));
    const healthChecks = manifest.healthChecks ?? [];

    const metadata: ResolvedModuleMetadata = {
      moduleId: manifest.id,
      menus,
      widgets,
      permissions,
      reports,
      developerPages,
      healthChecks,
      settings,
      routes,
    };

    this.resolved.set(manifest.id, metadata);
    return metadata;
  }

  private resolveMenus(
    manifest: ModuleManifest,
    module: Module,
    activated: boolean,
    context: FeatureContext
  ): ModuleMenuItem[] {
    if (!activated) return [];

    const fromManifest = (manifest.menus ?? []).map((m) => ({
      ...m,
      moduleId: manifest.id,
    }));

    if (fromManifest.length > 0) return fromManifest;

    return module.registerMenus(context).map((m) => ({ ...m, moduleId: manifest.id }));
  }

  private resolveWidgets(
    manifest: ModuleManifest,
    module: Module,
    activated: boolean,
    context: FeatureContext
  ): ModuleWidget[] {
    if (!activated) return [];

    const fromManifest = (manifest.widgets ?? []).map((w) => ({
      ...w,
      moduleId: manifest.id,
    }));

    if (fromManifest.length > 0) return fromManifest;

    return module.registerWidgets(context).map((w) => ({ ...w, moduleId: manifest.id }));
  }

  private resolvePermissions(manifest: ModuleManifest): ModulePermissionDefinition[] {
    // Permissions sind metadata-first und werden ausschließlich aus module.json gelesen.
    return manifest.permissions;
  }

  private resolveSettings(
    manifest: ModuleManifest,
    hasConfig: boolean
  ): ResolvedModuleMetadata['settings'] {
    if (!manifest.settings && !hasConfig) return undefined;
    return {
      ...manifest.settings,
      hasConfig,
      adminPath: manifest.settings?.adminPath,
    };
  }

  get(moduleId: string): ResolvedModuleMetadata | undefined {
    return this.resolved.get(moduleId);
  }

  aggregate(activeModuleIds: Set<string>): {
    menus: ModuleMenuItem[];
    widgets: ModuleWidget[];
    permissions: ModulePermissionDefinition[];
  } {
    const menus: ModuleMenuItem[] = [];
    const widgets: ModuleWidget[] = [];
    const permissionMap = new Map<string, ModulePermissionDefinition>();

    for (const [moduleId, meta] of this.resolved.entries()) {
      if (!activeModuleIds.has(moduleId)) continue;
      for (const p of meta.permissions) {
        permissionMap.set(p.key, p);
      }
      menus.push(...meta.menus);
      widgets.push(...meta.widgets);
    }

    menus.sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
    widgets.sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));

    return {
      menus,
      widgets,
      permissions: Array.from(permissionMap.values()),
    };
  }

  /** @deprecated Use aggregate() */
  aggregateActive(activeModuleIds: Set<string>): ReturnType<MetadataRegistry['aggregate']> {
    return this.aggregate(activeModuleIds);
  }

  clear(): void {
    this.resolved.clear();
  }
}
