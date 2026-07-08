import { describe, it, expect } from 'vitest';
import { printerConfigSchema, defaultPrinterConfig } from '../config';

describe('printer module QA', () => {
  it('default config validates', () => {
    expect(printerConfigSchema.parse(defaultPrinterConfig)).toBeDefined();
  });
});
