import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { corsPolicy } from './middleware/corsPolicy';
import { requestContextMiddleware } from './middleware/requestContext';
import { config } from './config';
import { moduleManager, createTenantMiddlewareStack, initializeTenantInfrastructure, tenantContext, tenantService } from './platform/bootstrap';
import { registerCorePayables } from './core/payable/registerPayables';
import { migrateLegacySettingsSecrets } from './core/settings/migrateLegacySecrets';

const app = express();

const trustProxy =
  config.multiTenant.trustProxyHops > 0 ? config.multiTenant.trustProxyHops : false;
app.set('trust proxy', trustProxy);

app.use(requestContextMiddleware);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsPolicy.corsOptions()));
app.use(express.json({
  verify: (req, _res, buf) => {
    if (req.url?.includes('/webhooks/')) {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    }
  },
}));

for (const middleware of createTenantMiddlewareStack()) {
  app.use(middleware);
}

app.use('/uploads', express.static(path.resolve(config.uploadsDir), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));

app.use('/api/v1', routes);
app.use('/api', routes);

app.use(errorHandler);

export async function bootstrapApp(): Promise<void> {
  await initializeTenantInfrastructure();
  registerCorePayables();
  await migrateLegacySettingsSecrets();

  const defaultTenant = await tenantService.getDefaultTenant();
  if (defaultTenant) {
    const contextData = await tenantService.resolveContextData(defaultTenant);
    await tenantContext.runAsync(contextData, async () => {
      await moduleManager.initialize();
    });
  } else {
    await moduleManager.initialize();
  }

  await moduleManager.mountRoutes(routes);
}

export default app;
