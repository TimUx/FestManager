import { useAuth } from '@/contexts/AuthContext';
import { canAccessPermission } from '@/utils/permissions';

export function usePermission(permissionKey: string): boolean {
  const { user } = useAuth();
  return canAccessPermission(user, permissionKey);
}
