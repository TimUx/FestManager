import type { PrinterConfig, PrinterSlotConfig, PrinterSlotId, PrinterType } from './config';
import type { PrintJob, PrintJobResult } from './PrintJob';

export interface DiscoveredPrinter {
  host: string;
  port: number;
  type: 'escpos-network';
  reachable: boolean;
}

export interface PrinterAdapter {
  readonly type: PrinterType;
  readonly label: string;
  readonly implemented: boolean;
  isConfigured(slot: PrinterSlotConfig): boolean;
  print(config: PrinterConfig, slotId: PrinterSlotId, slot: PrinterSlotConfig, job: PrintJob): Promise<PrintJobResult>;
  testConnection?(config: PrinterConfig, slot: PrinterSlotConfig): Promise<{ ok: boolean; message?: string }>;
  discover?(config: PrinterConfig): Promise<DiscoveredPrinter[]>;
}

export function slotSupportsTemplate(slot: PrinterSlotConfig, template: 'kitchen' | 'receipt'): boolean {
  if (!slot.enabled) return false;
  if (slot.template === 'both') return true;
  return slot.template === template;
}
