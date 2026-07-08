export const CORE_CLUB_NAMESPACE = 'core.club';
export const CORE_ORDER_NAMESPACE = 'core.order';
export const CORE_EMAIL_NAMESPACE = 'core.email';

export function moduleSettingsNamespace(moduleId: string): string {
  return `module.${moduleId}`;
}

export function isModuleNamespace(namespace: string): boolean {
  return namespace.startsWith('module.');
}

export function moduleIdFromNamespace(namespace: string): string | null {
  if (!isModuleNamespace(namespace)) return null;
  return namespace.slice('module.'.length);
}
