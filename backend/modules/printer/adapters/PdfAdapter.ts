import { emitPrinterJob } from '../printJobEmitter';
import type { PrinterConfig, PrinterSlotConfig, PrinterSlotId } from '../config';
import type { PrinterAdapter } from '../PrinterAdapter';
import type { PrintJob, PrintJobResult } from '../PrintJob';
import { buildMinimalPdf } from '../services/PdfGenerator';

export class PdfAdapter implements PrinterAdapter {
  readonly type = 'pdf' as const;
  readonly label = 'PDF';
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
    const pdf = buildMinimalPdf(job.lines);
    const pdfBase64 = pdf.toString('base64');
    emitPrinterJob(job.eventId, {
      jobId: job.id,
      printerId: slotId,
      printerName: slot.name ?? slotId,
      template: job.template,
      title: job.title,
      lines: job.lines,
      pdfBase64,
    });
    return { ok: true, pdfBase64 };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    return { ok: true, message: 'PDF-Generierung bereit' };
  }
}
