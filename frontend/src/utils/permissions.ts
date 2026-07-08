import type { User } from '@/types';

export function canAccessPermission(user: User | null, permissionKey?: string): boolean {
  if (!permissionKey) return true;
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return Boolean(user.permissions?.includes(permissionKey));
}
