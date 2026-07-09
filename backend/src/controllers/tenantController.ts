import type { Request, Response, NextFunction } from 'express';
import type { TenantService } from '../platform/tenant/TenantService';
import type { TenantContext } from '../platform/tenant/TenantContext';
import type { PlatformContext } from '../platform/tenant/PlatformContext';
import type { TenantResolver } from '../platform/tenant/TenantResolver';
import { TenantNotFoundError } from '../platform/tenant/errors';

export function createTenantController(
  tenantService: TenantService,
  tenantContext: TenantContext,
  platformContext: PlatformContext,
  tenantResolver: TenantResolver
) {
  return {
    async getPublic(_req: unknown, res: Response, next: NextFunction) {
      try {
        const ctx = tenantContext.require();
        const tenant = await tenantService.findById(ctx.id);
        if (!tenant) {
          res.status(404).json({ error: 'Der angeforderte Veranstalter wurde nicht gefunden.' });
          return;
        }
        const data = await tenantService.getPublicData(tenant);
        res.json(data);
      } catch (error) {
        next(error);
      }
    },

    async getPlatformPublic(_req: unknown, res: Response, next: NextFunction) {
      try {
        const platform = platformContext.current();
        res.json({
          name: platform.platformName,
          version: platform.platformVersion,
          baseDomain: platform.baseDomain,
          maintenanceMode: platform.maintenanceMode,
          maintenanceMessage: platform.maintenanceMessage ?? null,
          primaryColor: '#1565c0',
          defaultLocale: platform.defaultLocale,
        });
      } catch (error) {
        next(error);
      }
    },

    async getRoutingConfig(req: Request, res: Response, next: NextFunction) {
      try {
        const platform = platformContext.current();
        const host = tenantResolver.extractHost(req) ?? 'localhost';
        const proto =
          req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'https' : 'http';
        const platformUrl = `${proto}://${platform.baseDomain}`;

        let result;
        try {
          result = await tenantResolver.resolve(req);
        } catch (error) {
          if (error instanceof TenantNotFoundError) {
            res.json({
              scope: 'unknown',
              basename: '',
              tenantSlug: null,
              matchedBy: null,
              baseDomain: platform.baseDomain,
              pathPrefixEnabled: platform.pathPrefixRoutingEnabled,
              maintenanceMode: platform.maintenanceMode,
              maintenanceMessage: platform.maintenanceMessage ?? null,
              platformUrl,
              tenantUrl: null,
            });
            return;
          }
          throw error;
        }

        const basename = result.pathPrefix ?? '';
        const tenantSlug = result.tenant?.slug ?? null;
        let tenantUrl: string | null = null;
        if (result.tenant) {
          if (result.matchedBy === 'path_prefix') {
            tenantUrl = `${proto}://${host}${basename}`;
          } else if (host === 'localhost') {
            tenantUrl = `${proto}://${host}`;
          } else {
            tenantUrl = `${proto}://${result.tenant.subdomain}.${platform.baseDomain}`;
          }
        }

        res.json({
          scope: result.type,
          basename,
          tenantSlug,
          matchedBy: result.matchedBy ?? null,
          baseDomain: platform.baseDomain,
          pathPrefixEnabled: platform.pathPrefixRoutingEnabled,
          maintenanceMode: platform.maintenanceMode,
          maintenanceMessage: platform.maintenanceMessage ?? null,
          platformUrl,
          tenantUrl,
        });
      } catch (error) {
        next(error);
      }
    },

    async getPublicHealth(_req: unknown, res: Response, next: NextFunction) {
      try {
        const hasTenant = tenantContext.exists();
        res.json({
          status: 'ok',
          scope: hasTenant ? 'tenant' : 'platform',
          tenantId: tenantContext.id() ?? null,
          tenantSlug: tenantContext.slug() ?? null,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
