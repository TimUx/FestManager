import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, loadUser, requireRole, AuthRequest } from '../../middleware/auth';
import { settingsService } from '../../platform/bootstrap';
import { assertModuleSettingsAccessible, getInstalledModuleIds } from '../settings/assertModuleSettingsAccessible';

const router = Router();

router.use(authenticate, loadUser, requireRole('ADMIN'));

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const installedModuleIds = await getInstalledModuleIds();
    const namespaces = settingsService.listNamespaces().filter((ns) => {
      if (!ns.namespace.startsWith('module.')) return true;
      return installedModuleIds.has(ns.namespace.slice('module.'.length));
    });
    res.json(namespaces);
  } catch (err) {
    next(err);
  }
});

router.get('/:namespace/schema', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespace = decodeURIComponent(req.params.namespace as string);
    await assertModuleSettingsAccessible(namespace);
    res.json(await settingsService.getForm(namespace));
  } catch (err) {
    next(err);
  }
});

router.get('/:namespace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespace = decodeURIComponent(req.params.namespace as string);
    await assertModuleSettingsAccessible(namespace);
    const values = await settingsService.getValues(namespace);
    res.json(values);
  } catch (err) {
    next(err);
  }
});

router.put('/:namespace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const namespace = decodeURIComponent(req.params.namespace as string);
    await assertModuleSettingsAccessible(namespace);
    const actorId = (req as AuthRequest).user?.userId;
    const values = await settingsService.setValues(namespace, req.body as Record<string, unknown>, {
      actorId,
      partial: true,
    });
    res.json(values);
  } catch (err) {
    next(err);
  }
});

export default router;
