import { Router, Response, NextFunction } from 'express';
import { adminUiService } from '../../platform/bootstrap';
import type { AuthRequest } from '../../middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await adminUiService.getCatalog());
  } catch (err) {
    next(err);
  }
});

export default router;
