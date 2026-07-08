import { describe, it, expect, vi } from 'vitest';
import { defaultPrinterConfig } from './config';
import { slotSupportsTemplate } from './PrinterAdapter';
import { EscPosNetworkAdapter } from './adapters/EscPosNetworkAdapter';
import { BluetoothAdapter } from './adapters/BluetoothAdapter';
import { printManager } from './PrintManager';
import { paymentServiceRegistry } from '../../src/platform/extension-points';

describe('Printer module', () => {
  it('ESC/POS network requires host when enabled', () => {
    const adapter = new EscPosNetworkAdapter();
    expect(adapter.isConfigured({ enabled: true, type: 'escpos-network', port: 9100, template: 'kitchen' })).toBe(false);
    expect(adapter.isConfigured({
      enabled: true,
      type: 'escpos-network',
      host: '192.168.1.50',
      port: 9100,
      template: 'kitchen',
    })).toBe(true);
  });

  it('Bluetooth adapter is never configured', () => {
    const bt = new BluetoothAdapter();
    expect(bt.implemented).toBe(false);
    expect(bt.isConfigured({ enabled: true, type: 'bluetooth', port: 9100, template: 'kitchen' })).toBe(false);
  });

  it('template assignment respects slot config', () => {
    expect(slotSupportsTemplate({ enabled: true, type: 'browser', port: 9100, template: 'both' }, 'kitchen')).toBe(true);
    expect(slotSupportsTemplate({ enabled: true, type: 'browser', port: 9100, template: 'receipt' }, 'kitchen')).toBe(false);
  });

  it('defers online kitchen print when payment is available', async () => {
    vi.spyOn(paymentServiceRegistry, 'isAvailable').mockResolvedValue(true);
    await expect(printManager.shouldDeferOnlineKitchenPrint('ONLINE')).resolves.toBe(true);
    await expect(printManager.shouldDeferOnlineKitchenPrint('CASHIER')).resolves.toBe(false);
  });
});
