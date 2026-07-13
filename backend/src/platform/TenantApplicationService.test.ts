import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantApplicationService } from './TenantApplicationService';
import { AppError } from '../middleware/errorHandler';

vi.mock('../config/database', () => ({
  prisma: {
    tenant: { findFirst: vi.fn(), findUnique: vi.fn() },
    tenantApplication: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('./notifications/platformNotificationService', () => ({
  platformNotificationService: {
    notifyApplicationSubmitted: vi.fn(),
    notifyApplicantConfirmation: vi.fn(),
  },
}));

vi.mock('./TenantOnboardingService', () => ({
  tenantOnboardingService: {
    onboardNewTenant: vi.fn(),
    ensureAdministrator: vi.fn(),
  },
}));

import { prisma } from '../config/database';
import { tenantOnboardingService } from './TenantOnboardingService';

describe('TenantApplicationService', () => {
  const platformContext = {
    current: () => ({ registrationEnabled: true }),
  };
  const tenantAdmin = { create: vi.fn(), activate: vi.fn(), getDetail: vi.fn() };
  const audit = { log: vi.fn() };
  let service: TenantApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenantOnboardingService.ensureAdministrator).mockResolvedValue(null);
    vi.mocked(tenantOnboardingService.onboardNewTenant).mockResolvedValue(null);
    service = new TenantApplicationService(
      platformContext as never,
      tenantAdmin as never,
      audit as never
    );
  });

  it('rejects when registration is disabled', async () => {
    const disabled = new TenantApplicationService(
      { current: () => ({ registrationEnabled: false }) } as never,
      tenantAdmin as never,
      audit as never
    );
    await expect(
      disabled.submit({
        organization: 'Testverein',
        organizationType: 'Verein',
        contactName: 'Max',
        street: 'Hauptstr. 1',
        postalCode: '12345',
        city: 'Musterstadt',
        email: 'test@example.com',
        reason: 'Wir brauchen FestSchmiede für unser Vereinsfest und die Küchenorganisation.',
        desiredFeatures: 'Bestellungen, Küche, Abholung',
        freeTierJustification: 'Gemeinnütziger Verein ohne Budget für kommerzielle Software.',
        plannedUsage: 'Einmal jährlich beim Sommerfest',
        requestedSubdomain: 'test-verein',
        privacyAccepted: true,
        termsAccepted: true,
      })
    ).rejects.toThrow(AppError);
  });

  it('normalizes subdomain on submit', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tenantApplication.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.tenantApplication.create).mockResolvedValue({
      id: 'app-1',
      organization: 'Test',
      organizationType: 'Verein',
      contactName: 'Max',
      street: 'S',
      postalCode: '1',
      city: 'C',
      country: 'Deutschland',
      email: 'a@b.de',
      phone: null,
      website: null,
      memberCount: null,
      eventsPerYear: null,
      reason: 'r',
      desiredFeatures: 'f',
      freeTierJustification: 'j',
      plannedUsage: 'p',
      notes: null,
      requestedSubdomain: 'mein-verein',
      status: 'NEW',
      adminComment: null,
      reviewedBy: null,
      reviewedAt: null,
      tenantId: null,
      privacyAccepted: true,
      termsAccepted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.submit({
      organization: 'Testverein',
      organizationType: 'Verein',
      contactName: 'Max',
      street: 'Hauptstr. 1',
      postalCode: '12345',
      city: 'Musterstadt',
      email: 'test@example.com',
      reason: 'Wir brauchen FestSchmiede für unser Vereinsfest und die Küchenorganisation.',
      desiredFeatures: 'Bestellungen, Küche, Abholung',
      freeTierJustification: 'Gemeinnütziger Verein ohne Budget für kommerzielle Software.',
      plannedUsage: 'Einmal jährlich beim Sommerfest',
      requestedSubdomain: 'Mein_Verein!',
      privacyAccepted: true,
      termsAccepted: true,
    });

    expect(prisma.tenantApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requestedSubdomain: 'mein-verein' }),
      })
    );
  });

  it('re-approves and creates tenant when approved without link', async () => {
    const app = {
      id: 'app-1',
      organization: 'Testverein',
      requestedSubdomain: 'test-verein',
      status: 'APPROVED',
      tenantId: null,
      contactName: 'Max',
      email: 'test@example.com',
      phone: null,
      website: null,
      reason: 'Grund',
      street: 'S',
      postalCode: '1',
      city: 'C',
      country: 'Deutschland',
      adminComment: null,
    };
    vi.mocked(prisma.tenantApplication.findUnique).mockResolvedValue(app as never);
    vi.mocked(tenantAdmin.create).mockResolvedValue({ id: 'tenant-1' } as never);
    vi.mocked(tenantAdmin.activate).mockResolvedValue({ id: 'tenant-1' } as never);
    vi.mocked(tenantAdmin.getDetail).mockResolvedValue({ id: 'tenant-1' } as never);
    vi.mocked(prisma.tenantApplication.update).mockResolvedValue({
      ...app,
      tenantId: 'tenant-1',
    } as never);

    const result = await service.approveAndCreateTenant('app-1', 'actor-1', { createTenant: true });

    expect(tenantAdmin.create).toHaveBeenCalled();
    expect(result.tenantId).toBe('tenant-1');
  });

  it('unlinks tenant from application', async () => {
    vi.mocked(prisma.tenantApplication.findUnique).mockResolvedValue({
      id: 'app-1',
      tenantId: 'tenant-1',
    } as never);
    vi.mocked(prisma.tenantApplication.update).mockResolvedValue({
      id: 'app-1',
      tenantId: null,
    } as never);

    const result = await service.setTenantLink('app-1', null, 'actor-1');

    expect(prisma.tenantApplication.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { tenantId: null },
    });
    expect(result.tenantId).toBeNull();
  });

  it('deletes application', async () => {
    vi.mocked(prisma.tenantApplication.findUnique).mockResolvedValue({
      id: 'app-1',
      organization: 'Test',
      tenantId: null,
    } as never);

    await service.delete('app-1', 'actor-1');

    expect(prisma.tenantApplication.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'platform.application.deleted' })
    );
  });
});
