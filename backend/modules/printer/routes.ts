import { Router, Request, Response, NextFunction } from 'express';
import { printManager } from './PrintManager';
import { PRINTER_SLOT_IDS, type PrinterSlotId } from './config';
import type { FeatureContext } from '../../src/module-system/types';

export function createPrinterAdminRoutes(context: FeatureContext): Router {
  const router = Router();

  router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const active = await printManager.hasActivePrinter(context);
      const printers = await printManager.runHealthChecks(context);
      res.json({ active, printers });
    } catch (err) {
      next(err);
    }
  });

  router.get('/discover', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const discovered = await printManager.discoverNetworkPrinters(context);
      res.json({ discovered });
    } catch (err) {
      next(err);
    }
  });

  router.post('/printers/:slotId/test', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slotId = req.params.slotId as PrinterSlotId;
      if (!PRINTER_SLOT_IDS.includes(slotId)) {
        res.status(400).json({ ok: false, message: 'Ungültiger Drucker-Slot' });
        return;
      }
      const result = await printManager.testPrinter(context, slotId);
      if (!result.ok) {
        res.status(400).json(result);
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createPrinterStaffRoutes(context: FeatureContext): Router {
  const router = Router();

  router.post('/kitchen/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const printed = await printManager.printKitchenForOrderId(context, req.params.orderId as string);
      if (!printed) {
        res.status(404).json({ error: 'Bestellung nicht gefunden' });
        return;
      }
      res.json({ printed: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
