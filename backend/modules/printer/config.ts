import { z } from 'zod';

export const PRINTER_TYPES = ['escpos-network', 'pdf', 'browser', 'bluetooth'] as const;
export type PrinterType = (typeof PRINTER_TYPES)[number];

export const PRINTER_TEMPLATES = ['kitchen', 'receipt', 'both'] as const;
export type PrinterTemplateAssignment = (typeof PRINTER_TEMPLATES)[number];

const printerSlotSchema = z.object({
  enabled: z.boolean().default(false),
  name: z.string().optional(),
  type: z.enum(PRINTER_TYPES).default('escpos-network'),
  host: z.string().optional(),
  port: z.number().default(9100),
  template: z.enum(PRINTER_TEMPLATES).default('kitchen'),
  bluetoothAddress: z.string().optional(),
});

export const printerConfigSchema = z.object({
  autoPrint: z.object({
    kitchenOnOrderCreated: z.boolean().default(true),
    kitchenOnOrderPaid: z.boolean().default(true),
    receiptOnCashier: z.boolean().default(false),
  }).default({}),
  discovery: z.object({
    subnet: z.string().default('192.168.1'),
    port: z.number().default(9100),
  }).default({}),
  printer1: printerSlotSchema.default({ enabled: false, type: 'escpos-network', port: 9100, template: 'kitchen' }),
  printer2: printerSlotSchema.default({ enabled: false, type: 'browser', port: 9100, template: 'receipt' }),
  printer3: printerSlotSchema.default({ enabled: false, type: 'pdf', port: 9100, template: 'kitchen' }),
});

export type PrinterConfig = z.infer<typeof printerConfigSchema>;
export type PrinterSlotConfig = z.infer<typeof printerSlotSchema>;

export const defaultPrinterConfig: PrinterConfig = {
  autoPrint: {
    kitchenOnOrderCreated: true,
    kitchenOnOrderPaid: true,
    receiptOnCashier: false,
  },
  discovery: { subnet: '192.168.1', port: 9100 },
  printer1: { enabled: false, type: 'escpos-network', port: 9100, template: 'kitchen' },
  printer2: { enabled: false, type: 'browser', port: 9100, template: 'receipt' },
  printer3: { enabled: false, type: 'pdf', port: 9100, template: 'kitchen' },
};

export const PRINTER_SLOT_IDS = ['printer1', 'printer2', 'printer3'] as const;
export type PrinterSlotId = (typeof PRINTER_SLOT_IDS)[number];
