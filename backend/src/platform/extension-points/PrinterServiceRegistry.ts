import type { OrderPrintPayload, PrinterService } from './PrinterService';

class PrinterServiceRegistryImpl {
  private service: PrinterService | null = null;

  register(service: PrinterService): void {
    this.service = service;
  }

  unregister(): void {
    this.service = null;
  }

  getService(): PrinterService | null {
    return this.service;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.service) return false;
    return this.service.isAvailable();
  }

  async printKitchenTicket(payload: OrderPrintPayload): Promise<void> {
    if (!this.service) return;
    if (!(await this.service.isAvailable())) return;
    await this.service.printKitchenTicket(payload);
  }

  async printReceipt(payload: OrderPrintPayload): Promise<void> {
    if (!this.service) return;
    if (!(await this.service.isAvailable())) return;
    await this.service.printReceipt(payload);
  }
}

export const printerServiceRegistry = new PrinterServiceRegistryImpl();
