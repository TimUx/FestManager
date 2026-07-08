import { prisma } from '../config/database';
import type { AuditService } from './AuditService';
import type { ModulePermissionDefinition } from './types';
import type { ModuleRegistry } from './ModuleRegistry';
import { AppError } from '../middleware/errorHandler';

export function parsePermissionKeys(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string') : [];
}

export function userHasPermission(role: string, permissions: string[] | undefined, permissionKey: string): boolean {
  if (role === 'ADMIN') return true;
  return (permissions ?? []).includes(permissionKey);
}

export class PermissionService {
  constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly auditService: AuditService
  ) {}

  getAvailablePermissions(): ModulePermissionDefinition[] {
    return this.moduleRegistry.getPermissions();
  }

  async getStaffPermissions(): Promise<string[]> {
    const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
    return parsePermissionKeys(staffRole?.permissions);
  }

  async getPermissionCatalog(): Promise<{ available: ModulePermissionDefinition[]; staff: string[] }> {
    return {
      available: this.getAvailablePermissions(),
      staff: await this.getStaffPermissions(),
    };
  }

  async updateStaffPermissions(permissions: string[], actorId: string): Promise<string[]> {
    const allowed = new Set(this.getAvailablePermissions().map((p) => p.key));
    const desired = Array.from(new Set(permissions)).filter((p) => p !== '');

    const unknown = desired.filter((p) => !allowed.has(p));
    if (unknown.length > 0) {
      throw new AppError(400, `Unbekannte Berechtigung(en): ${unknown.join(', ')}`);
    }

    await prisma.role.update({
      where: { name: 'STAFF' },
      data: { permissions: desired },
    });

    await this.auditService.log({
      action: 'permissions.staff.updated',
      actorId,
      details: { permissions: desired },
    });

    return desired;
  }
}
