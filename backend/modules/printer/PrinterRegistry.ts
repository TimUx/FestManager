import { BluetoothAdapter } from './adapters/BluetoothAdapter';
import { BrowserAdapter } from './adapters/BrowserAdapter';
import { EscPosNetworkAdapter } from './adapters/EscPosNetworkAdapter';
import { PdfAdapter } from './adapters/PdfAdapter';
import type { PrinterType } from './config';
import type { PrinterAdapter } from './PrinterAdapter';

class PrinterRegistry {
  private readonly adapters = new Map<PrinterType, PrinterAdapter>();

  constructor() {
    for (const adapter of [
      new EscPosNetworkAdapter(),
      new BrowserAdapter(),
      new PdfAdapter(),
      new BluetoothAdapter(),
    ]) {
      this.adapters.set(adapter.type, adapter);
    }
  }

  get(type: PrinterType): PrinterAdapter | undefined {
    return this.adapters.get(type);
  }

  getAll(): PrinterAdapter[] {
    return [...this.adapters.values()];
  }

  getImplemented(): PrinterAdapter[] {
    return this.getAll().filter((a) => a.implemented);
  }
}

export const printerRegistry = new PrinterRegistry();
