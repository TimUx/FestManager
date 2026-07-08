import type { PrinterConfig, PrinterSlotConfig, PrinterSlotId } from '../config';
import type { PrinterAdapter } from '../PrinterAdapter';
import type { PrintJob, PrintJobResult } from '../PrintJob';

/** Bluetooth-Bondrucker – Platzhalter (Web Bluetooth erfordert Frontend-Integration). */
export class BluetoothAdapter implements PrinterAdapter {
  readonly type = 'bluetooth' as const;
  readonly label = 'Bluetooth';
  readonly implemented = false;

  isConfigured(_slot: PrinterSlotConfig): boolean {
    return false;
  }

  async print(): Promise<PrintJobResult> {
    return { ok: false, error: 'Bluetooth-Druck noch nicht implementiert' };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: false, message: 'Bluetooth-Adapter noch nicht implementiert' };
  }

  async discover(_config: PrinterConfig) {
    return [];
  }
}
