import type { PrintTemplate } from '../../src/platform/extension-points/PrinterService';
import type { PrinterSlotId } from './config';

export interface PrintJob {
  id: string;
  template: PrintTemplate;
  printerId: PrinterSlotId;
  resourceType: 'order';
  resourceId: string;
  eventId: string;
  title: string;
  lines: string[];
  html?: string;
  pdfBase64?: string;
  createdAt: string;
}

export interface PrintJobResult {
  ok: boolean;
  error?: string;
  pdfBase64?: string;
}
