import type {
  ClubContactData,
  NotificationService,
  OrderEmailData,
} from './NotificationService';

class NotificationServiceRegistryImpl {
  private service: NotificationService | null = null;

  register(service: NotificationService): void {
    this.service = service;
  }

  unregister(): void {
    this.service = null;
  }

  getService(): NotificationService | null {
    return this.service;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.service) return false;
    return this.service.isAvailable();
  }

  async sendOrderConfirmation(
    email: string,
    order: OrderEmailData,
    club: ClubContactData
  ): Promise<void> {
    if (!this.service) return;
    if (!(await this.service.isAvailable())) return;
    await this.service.sendOrderConfirmation(email, order, club);
  }

  async sendOrderCancellation(
    email: string,
    order: OrderEmailData,
    club: ClubContactData,
    options?: { initiatedByStaff?: boolean }
  ): Promise<void> {
    if (!this.service) return;
    if (!(await this.service.isAvailable())) return;
    await this.service.sendOrderCancellation(email, order, club, options);
  }
}

export const notificationServiceRegistry = new NotificationServiceRegistryImpl();
