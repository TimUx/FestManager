import type { EventBus } from './EventBus';
import type { CoreHookName, HookHandler, HookSubscription } from './types';

/**
 * Domain hook layer on top of EventBus.
 * Core emits hooks; modules subscribe via lifecycle registration.
 */
export class HookSystem {
  constructor(private readonly eventBus: EventBus) {}

  subscribe(subscription: HookSubscription): void {
    this.eventBus.on(subscription.hook, subscription.handler, {
      priority: subscription.priority,
      source: subscription.moduleId,
    });
  }

  unsubscribe(moduleId: string): void {
    this.eventBus.offSource(moduleId);
  }

  registerAll(subscriptions: HookSubscription[]): void {
    for (const sub of subscriptions) {
      this.subscribe(sub);
    }
  }

  async emit<T>(hook: CoreHookName, payload: T): Promise<void> {
    await this.eventBus.emit(hook, payload);
  }

  emitAsync<T>(hook: CoreHookName, payload: T): void {
    this.eventBus.emitAsync(hook, payload);
  }

  clear(): void {
    this.eventBus.clear();
  }
}

export type { HookHandler, HookSubscription };
