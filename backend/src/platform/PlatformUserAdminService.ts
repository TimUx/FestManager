import bcrypt from 'bcryptjs';
import { platformUserRepository } from '../repositories/platformUserRepository';
import { AppError } from '../middleware/errorHandler';
import { ALL_PLATFORM_PERMISSIONS, parsePlatformPermissions } from './platformPermissions';
import { auditService } from './bootstrap';

export interface PlatformUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  mfaEnabled: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

function toDto(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  mfaEnabled: boolean;
  permissions: unknown;
  lastLoginAt: Date | null;
  createdAt: Date;
}): PlatformUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    active: user.active,
    mfaEnabled: user.mfaEnabled,
    permissions: parsePlatformPermissions(user.permissions),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export class PlatformUserAdminService {
  async listUsers(): Promise<PlatformUserDto[]> {
    const users = await platformUserRepository.findAll();
    return users.map(toDto);
  }

  async createUser(
    data: { email: string; password: string; firstName: string; lastName: string },
    actorId: string
  ): Promise<PlatformUserDto> {
    const existing = await platformUserRepository.findByEmail(data.email);
    if (existing) throw new AppError(409, 'E-Mail bereits registriert');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await platformUserRepository.create({
      email: data.email.trim().toLowerCase(),
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      permissions: ALL_PLATFORM_PERMISSIONS,
    });

    await auditService.log({
      action: 'platform.user.create',
      actorId,
      details: { userId: user.id, email: user.email },
    });

    return toDto(user);
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      active?: boolean;
    },
    actorId: string
  ): Promise<PlatformUserDto> {
    const user = await platformUserRepository.findById(id);
    if (!user) throw new AppError(404, 'Benutzer nicht gefunden');

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const conflict = await platformUserRepository.findByEmail(data.email.trim().toLowerCase());
      if (conflict && conflict.id !== id) throw new AppError(409, 'E-Mail bereits registriert');
    }

    if (data.active === false) {
      await this.ensureNotLastActiveAdmin(id, actorId);
    }

    const update: {
      email?: string;
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
      active?: boolean;
    } = {};

    if (data.firstName !== undefined) update.firstName = data.firstName.trim();
    if (data.lastName !== undefined) update.lastName = data.lastName.trim();
    if (data.email !== undefined) update.email = data.email.trim().toLowerCase();
    if (data.active !== undefined) update.active = data.active;
    if (data.password) update.passwordHash = await bcrypt.hash(data.password, 12);

    const updated = await platformUserRepository.update(id, update);

    await auditService.log({
      action: 'platform.user.update',
      actorId,
      details: { userId: id, fields: Object.keys(update) },
    });

    return toDto(updated);
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ): Promise<PlatformUserDto> {
    const user = await platformUserRepository.findById(userId);
    if (!user || !user.active) throw new AppError(404, 'Benutzer nicht gefunden');

    const emailChanging = data.email !== undefined && data.email.trim().toLowerCase() !== user.email;
    const passwordChanging = Boolean(data.newPassword);

    if (emailChanging || passwordChanging) {
      if (!data.currentPassword) {
        throw new AppError(400, 'Aktuelles Passwort erforderlich');
      }
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) throw new AppError(401, 'Aktuelles Passwort ist falsch');
    }

    if (emailChanging) {
      const conflict = await platformUserRepository.findByEmail(data.email!.trim().toLowerCase());
      if (conflict && conflict.id !== userId) throw new AppError(409, 'E-Mail bereits registriert');
    }

    const update: {
      email?: string;
      passwordHash?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    if (data.firstName !== undefined) update.firstName = data.firstName.trim();
    if (data.lastName !== undefined) update.lastName = data.lastName.trim();
    if (emailChanging) update.email = data.email!.trim().toLowerCase();
    if (passwordChanging) update.passwordHash = await bcrypt.hash(data.newPassword!, 12);

    const updated = await platformUserRepository.update(userId, update);

    await auditService.log({
      action: 'platform.user.profile.update',
      actorId: userId,
      details: { fields: Object.keys(update) },
    });

    return toDto(updated);
  }

  private async ensureNotLastActiveAdmin(targetId: string, actorId: string): Promise<void> {
    if (targetId === actorId) {
      throw new AppError(400, 'Eigenes Konto kann nicht deaktiviert werden');
    }
    const activeCount = await platformUserRepository.countActive();
    const target = await platformUserRepository.findById(targetId);
    if (target?.active && activeCount <= 1) {
      throw new AppError(400, 'Der letzte aktive Plattformadministrator kann nicht deaktiviert werden');
    }
  }
}

export const platformUserAdminService = new PlatformUserAdminService();
