import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import { authenticate, loadUser } from './auth';
import { userHasPermission } from '../platform/permissions';

function runMiddleware(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => void,
  req: AuthRequest,
  res: Response
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function ensureUserLoaded(req: AuthRequest, res: Response): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    void loadUser(req, res, (err?: unknown) => (err ? reject(err) : resolve()));
  });
}

/**
 * Schützt modul-spezifische API-Aktionen.
 * ADMIN ist Superuser; STAFF benötigt zugewiesene Permission-Keys aus Role.permissions.
 */
export function requirePermission(permissionKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await runMiddleware(authenticate, req, res);
      await ensureUserLoaded(req, res);

      if (!req.user) {
        next(new AppError(401, 'Nicht authentifiziert'));
        return;
      }

      if (!userHasPermission(req.user.role, req.user.permissions, permissionKey)) {
        next(new AppError(403, 'Keine Berechtigung'));
        return;
      }

      next();
    } catch (err) {
      next(err as Error);
    }
  };
}
