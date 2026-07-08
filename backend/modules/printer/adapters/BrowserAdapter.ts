import { emitPrinterJob } from '../printJobEmitter';
import type { PrinterConfig, PrinterSlotConfig, PrinterSlotId } from '../config';
import type { PrinterAdapter } from '../PrinterAdapter';
import type { PrintJob, PrintJobResult } from '../PrintJob';

export class BrowserAdapter implements PrinterAdapter {
  readonly type = 'browser' as const;
  readonly label = 'Browser-Druck';
  readonly implemented = true;

  isConfigured(slot: PrinterSlotConfig): boolean {
    return Boolean(slot.enabled);
  }

  async print(
    _config: PrinterConfig,
    slotId: PrinterSlotId,
    slot: PrinterSlotConfig,
    job: PrintJob
  ): Promise<PrintJobResult> {
    emitPrinterJob(job.eventId, {
      jobId: job.id,
      printerId: slotId,
      printerName: slot.name ?? slotId,
      template: job.template,
      title: job.title,
      html: job.html,
      lines: job.lines,
    });
    return { ok: true };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'Browser-Druck über Küchen-Tablet (Socket.IO)' };
  }
}
