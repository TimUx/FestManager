import type { CoreAdminMetadataRegistry } from '../../platform/adminUi/CoreAdminMetadataRegistry';
import type {
  AdminDashboardTile,
  AdminNavItem,
  AdminPageDefinition,
} from '../../platform/adminUi/types';

export const CORE_BUILTIN_PAGES: AdminPageDefinition[] = [
  {
    id: 'admin-dashboard',
    path: '/admin',
    label: 'Übersicht',
    description: 'Administrationsübersicht',
    icon: 'Dashboard',
    pageType: 'dashboard',
    sortOrder: 0,
    source: 'core',
  },
  {
    id: 'core-users',
    path: '/admin/benutzer',
    label: 'Benutzer',
    description: 'Mitarbeiter und Administratoren',
    icon: 'People',
    pageType: 'builtin',
    componentId: 'core.users',
    sortOrder: 30,
    source: 'core',
  },
  {
    id: 'core-events',
    path: '/admin/veranstaltungen',
    label: 'Veranstaltungen',
    description: 'Events anlegen und aktivieren',
    icon: 'Event',
    pageType: 'builtin',
    componentId: 'core.events',
    sortOrder: 40,
    source: 'core',
  },
  {
    id: 'core-food-items',
    path: '/admin/speisen',
    label: 'Speisen',
    description: 'Speisekarte pflegen',
    icon: 'RestaurantMenu',
    pageType: 'builtin',
    componentId: 'core.food-items',
    sortOrder: 50,
    source: 'core',
  },
  {
    id: 'core-modules',
    path: '/admin/module',
    label: 'Module',
    description: 'Offizielle Erweiterungen verwalten',
    icon: 'Extension',
    pageType: 'modules',
    componentId: 'core.modules',
    sortOrder: 90,
    source: 'core',
  },
];

export const CORE_SETTINGS_ICONS: Record<string, string> = {
  'core.club': 'Settings',
  'core.order': 'ShoppingCart',
};

export const CORE_SETTINGS_SORT: Record<string, number> = {
  'core.club': 15,
  'core.order': 55,
};

export const CORE_STAFF_LINK: AdminDashboardTile = {
  id: 'staff-area',
  label: 'Mitarbeiterbereich',
  description: 'Küche, Abholung, Bestellungen',
  path: '/mitarbeiter',
  icon: 'Storefront',
  sortOrder: 1000,
  source: 'core',
};

/** @deprecated Use CoreAdminMetadataRegistry via registerCoreAdminMetadata() */
export function coreBuiltinNavigation(): AdminNavItem[] {
  return CORE_BUILTIN_PAGES.filter((p) => p.pageType !== 'dashboard').map((p) => ({
    id: p.id,
    label: p.label,
    path: p.path,
    icon: p.icon,
    sortOrder: p.sortOrder,
    source: 'core' as const,
  }));
}

export function registerCoreAdminMetadata(registry: CoreAdminMetadataRegistry): void {
  registry.register({
    builtinPages: CORE_BUILTIN_PAGES,
    settingsIcons: CORE_SETTINGS_ICONS,
    settingsSort: CORE_SETTINGS_SORT,
    staffDashboardTile: CORE_STAFF_LINK,
  });
}
