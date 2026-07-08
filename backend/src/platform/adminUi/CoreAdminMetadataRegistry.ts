import type { AdminDashboardTile, AdminNavItem, AdminPageDefinition } from './types';

export interface CoreAdminUiMetadata {
  builtinPages: AdminPageDefinition[];
  settingsIcons: Record<string, string>;
  settingsSort: Record<string, number>;
  staffDashboardTile: AdminDashboardTile;
}

export class CoreAdminMetadataRegistry {
  private metadata: CoreAdminUiMetadata | null = null;

  register(metadata: CoreAdminUiMetadata): void {
    this.metadata = metadata;
  }

  getBuiltinPages(): AdminPageDefinition[] {
    return this.metadata?.builtinPages ?? [];
  }

  getSettingsIcons(): Record<string, string> {
    return this.metadata?.settingsIcons ?? {};
  }

  getSettingsSort(): Record<string, number> {
    return this.metadata?.settingsSort ?? {};
  }

  getStaffDashboardTile(): AdminDashboardTile | null {
    return this.metadata?.staffDashboardTile ?? null;
  }

  getBuiltinNavigation(): AdminNavItem[] {
    return this.getBuiltinPages()
      .filter((p) => p.pageType !== 'dashboard')
      .map((p) => ({
        id: p.id,
        label: p.label,
        path: p.path,
        icon: p.icon,
        sortOrder: p.sortOrder,
        source: 'core' as const,
      }));
  }
}
