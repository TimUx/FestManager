import type { FeatureContext } from '../../../src/platform/module-api';
import type { OrderPrintPayload, PrinterService } from '../../../src/platform/extension-points/PrinterService';
import { printManager } from '../PrintManager';

export function createPrinterService(context: FeatureContext): PrinterService {
  return {
    async isAvailable() {
      return printManager.hasActivePrinter(context);
    },
    async printKitchenTicket(payload) {
      await printManager.printKitchen(context, payload);
    },
    async printReceipt(payload) {
      await printManager.printReceipt(context, payload);
    },
  };
}
