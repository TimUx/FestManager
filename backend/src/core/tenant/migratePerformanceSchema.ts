import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

const MIGRATION_MARKER = 'performance_schema_v1';

/**
 * Performance-Indizes für Hot Paths (Realtime, Kitchen, Pickup).
 * Idempotent – nur bei erstem Lauf.
 */
export async function migratePerformanceSchema(): Promise<void> {
  const marker = await prisma.$queryRaw<{ key: string }[]>`
    SELECT key FROM platform_settings WHERE key = ${MIGRATION_MARKER} LIMIT 1
  `.catch(() => [] as { key: string }[]);

  if (marker.length > 0) {
    logger.info('Performance-Schema bereits angewendet');
    return;
  }

  logger.info('Starte Performance-Schema-Migration');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS orders_tenant_event_status_idx
      ON orders(tenant_id, event_id, status);
    CREATE INDEX IF NOT EXISTS orders_tenant_updated_at_idx
      ON orders(tenant_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS orders_event_status_ready_at_idx
      ON orders(event_id, status, ready_at)
      WHERE status = 'READY';
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx
      ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS orders_lookup_token_tenant_idx
      ON orders(tenant_id, lookup_token);
  `);

  await prisma.$executeRaw`
    INSERT INTO platform_settings (key, value, encrypted, "updatedAt")
    VALUES (${MIGRATION_MARKER}, ${JSON.stringify({ appliedAt: new Date().toISOString() })}::jsonb, false, NOW())
    ON CONFLICT (key) DO NOTHING
  `;

  logger.info('Performance-Schema-Migration abgeschlossen');
}
