import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const TENANT_BACKUP_VERSION = 1;

export interface TenantBackupPayload {
  version: number;
  type: 'tenant';
  exportedAt: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  data: {
    tenant: Record<string, unknown>;
    tenantSettings: Record<string, unknown> | null;
    clubSettings: Record<string, unknown> | null;
    users: Record<string, unknown>[];
    events: Record<string, unknown>[];
    foodItems: Record<string, unknown>[];
    customers: Record<string, unknown>[];
    orders: Record<string, unknown>[];
    orderItems: Record<string, unknown>[];
    orderStatuses: Record<string, unknown>[];
    dailyOrderCounters: Record<string, unknown>[];
    legalPages: Record<string, unknown>[];
    tenantModules: Record<string, unknown>[];
    moduleMigrations: Record<string, unknown>[];
  };
}

export class TenantBackupService {
  async exportTenant(tenantId: string): Promise<TenantBackupPayload> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AppError(404, 'Mandant nicht gefunden');

    const [
      tenantSettings,
      clubSettings,
      users,
      events,
      foodItems,
      customers,
      orders,
      legalPages,
      tenantModules,
      moduleMigrations,
    ] = await Promise.all([
      prisma.tenantSettings.findUnique({ where: { tenantId } }),
      prisma.clubSettings.findFirst({ where: { tenantId } }),
      prisma.user.findMany({ where: { tenantId } }),
      prisma.event.findMany({ where: { tenantId } }),
      prisma.foodItem.findMany({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId } }),
      prisma.order.findMany({ where: { tenantId } }),
      prisma.legalPage.findMany({ where: { tenantId } }),
      prisma.tenantModule.findMany({ where: { tenantId } }),
      prisma.moduleMigration.findMany({ where: { tenantId } }),
    ]);

    const orderIds = orders.map((o) => o.id);
    const [orderItems, orderStatuses, dailyOrderCounters] = await Promise.all([
      orderIds.length ? prisma.orderItem.findMany({ where: { orderId: { in: orderIds } } }) : [],
      orderIds.length ? prisma.orderStatus.findMany({ where: { orderId: { in: orderIds } } }) : [],
      prisma.dailyOrderCounter.findMany({ where: { tenantId } }),
    ]);

    return {
      version: TENANT_BACKUP_VERSION,
      type: 'tenant',
      exportedAt: new Date().toISOString(),
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      data: {
        tenant: tenant as unknown as Record<string, unknown>,
        tenantSettings: tenantSettings as unknown as Record<string, unknown> | null,
        clubSettings: clubSettings as unknown as Record<string, unknown> | null,
        users: users as unknown as Record<string, unknown>[],
        events: events as unknown as Record<string, unknown>[],
        foodItems: foodItems as unknown as Record<string, unknown>[],
        customers: customers as unknown as Record<string, unknown>[],
        orders: orders as unknown as Record<string, unknown>[],
        orderItems: orderItems as unknown as Record<string, unknown>[],
        orderStatuses: orderStatuses as unknown as Record<string, unknown>[],
        dailyOrderCounters: dailyOrderCounters as unknown as Record<string, unknown>[],
        legalPages: legalPages as unknown as Record<string, unknown>[],
        tenantModules: tenantModules as unknown as Record<string, unknown>[],
        moduleMigrations: moduleMigrations as unknown as Record<string, unknown>[],
      },
    };
  }

  async restoreTenant(payload: TenantBackupPayload): Promise<{ tenantId: string; tenantSlug: string }> {
    if (payload.type !== 'tenant' || payload.version !== TENANT_BACKUP_VERSION) {
      throw new AppError(400, 'Ungültiges Mandanten-Backup-Format');
    }

    const slugConflict = await prisma.tenant.findFirst({
      where: { slug: payload.tenantSlug, id: { not: payload.tenantId } },
    });
    if (slugConflict) {
      throw new AppError(409, `Slug '${payload.tenantSlug}' ist bereits einem anderen Mandanten zugeordnet`);
    }

    const subdomain = String(payload.data.tenant.subdomain ?? payload.tenantSlug);
    const subdomainConflict = await prisma.tenant.findFirst({
      where: { subdomain, id: { not: payload.tenantId } },
    });
    if (subdomainConflict) {
      throw new AppError(409, `Subdomain '${subdomain}' ist bereits vergeben`);
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.tenant.findUnique({ where: { id: payload.tenantId } });
      if (existing) {
        await tx.tenant.delete({ where: { id: payload.tenantId } });
      }

      await tx.tenant.create({ data: payload.data.tenant as never });

      if (payload.data.tenantSettings) {
        await tx.tenantSettings.create({ data: payload.data.tenantSettings as never });
      }
      if (payload.data.clubSettings) {
        await tx.clubSettings.create({ data: payload.data.clubSettings as never });
      }
      if (payload.data.users.length) {
        await tx.user.createMany({ data: payload.data.users as never[] });
      }
      if (payload.data.events.length) {
        await tx.event.createMany({ data: payload.data.events as never[] });
      }
      if (payload.data.foodItems.length) {
        await tx.foodItem.createMany({ data: payload.data.foodItems as never[] });
      }
      if (payload.data.customers.length) {
        await tx.customer.createMany({ data: payload.data.customers as never[] });
      }
      if (payload.data.orders.length) {
        await tx.order.createMany({ data: payload.data.orders as never[] });
      }
      if (payload.data.orderItems.length) {
        await tx.orderItem.createMany({ data: payload.data.orderItems as never[] });
      }
      if (payload.data.orderStatuses.length) {
        await tx.orderStatus.createMany({ data: payload.data.orderStatuses as never[] });
      }
      if (payload.data.dailyOrderCounters.length) {
        await tx.dailyOrderCounter.createMany({ data: payload.data.dailyOrderCounters as never[] });
      }
      if (payload.data.legalPages.length) {
        await tx.legalPage.createMany({ data: payload.data.legalPages as never[] });
      }
      if (payload.data.tenantModules.length) {
        await tx.tenantModule.createMany({ data: payload.data.tenantModules as never[] });
      }
      if (payload.data.moduleMigrations.length) {
        await tx.moduleMigration.createMany({ data: payload.data.moduleMigrations as never[] });
      }
    }, { timeout: 120_000 });

    return { tenantId: payload.tenantId, tenantSlug: payload.tenantSlug };
  }
}

export const tenantBackupService = new TenantBackupService();
