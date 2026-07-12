import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../repositories/platformUserRepository', () => ({
  platformUserRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countActive: vi.fn(),
  },
}));

vi.mock('./bootstrap', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

import { platformUserRepository } from '../repositories/platformUserRepository';
import { PlatformUserAdminService } from './PlatformUserAdminService';

describe('PlatformUserAdminService', () => {
  const service = new PlatformUserAdminService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires current password for email change', async () => {
    vi.mocked(platformUserRepository.findById).mockResolvedValue({
      id: 'u1',
      email: 'old@example.de',
      passwordHash: 'hash',
      firstName: 'Max',
      lastName: 'Muster',
      active: true,
      mfaEnabled: false,
      permissions: [],
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await expect(
      service.updateProfile('u1', { email: 'new@example.de' })
    ).rejects.toThrow('Aktuelles Passwort erforderlich');
  });

  it('prevents deactivating the last active admin', async () => {
    vi.mocked(platformUserRepository.findById).mockResolvedValue({
      id: 'u2',
      active: true,
    } as never);
    vi.mocked(platformUserRepository.countActive).mockResolvedValue(1);

    await expect(
      service.updateUser('u2', { active: false }, 'actor')
    ).rejects.toThrow('letzte aktive');
  });
});
