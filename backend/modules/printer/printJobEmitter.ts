import { emitPrintJob, getIO } from '../../src/socket';

export interface PrinterJobSocketPayload {
  jobId: string;
  printerId: string;
  printerName: string;
  template: string;
  title: string;
  html?: string;
  lines?: string[];
  pdfBase64?: string;
}

/** Leitet Druckaufträge an Socket.IO-Clients weiter (Browser/PDF). */
export function emitPrinterJob(eventId: string, payload: PrinterJobSocketPayload): void {
  if (eventId === 'test') {
    try {
      getIO().emit('print:job', payload);
    } catch {
      // Socket nicht initialisiert (Tests)
    }
    return;
  }
  emitPrintJob(eventId, payload);
}
