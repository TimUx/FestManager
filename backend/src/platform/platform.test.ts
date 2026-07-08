import { describe, it, expect } from 'vitest';
import { ServiceContainer, PLATFORM_TOKENS } from './ServiceContainer';
import { Registry } from './Registry';
import { EventBus } from './EventBus';
import { ExtensionPointRegistry } from './ExtensionPointRegistry';

describe('ServiceContainer', () => {
  it('resolves registered singletons', () => {
    const container = new ServiceContainer();
    const bus = new EventBus();
    container.registerSingleton(PLATFORM_TOKENS.EventBus, bus);
    expect(container.get(PLATFORM_TOKENS.EventBus)).toBe(bus);
  });
});

describe('Registry', () => {
  it('registers and retrieves entries', () => {
    const registry = new Registry<string>();
    registry.register('a', 'value');
    expect(registry.get('a')).toBe('value');
  });
});

describe('ExtensionPointRegistry', () => {
  it('stores extension point implementations', () => {
    const points = new ExtensionPointRegistry();
    const impl = { test: true };
    points.register('demo', impl);
    expect(points.get('demo')).toBe(impl);
  });
});

describe('EventBus', () => {
  it('delivers events in priority order', async () => {
    const bus = new EventBus();
    const order: number[] = [];
    bus.on('test', () => { order.push(2); }, { priority: 200 });
    bus.on('test', () => { order.push(1); }, { priority: 100 });
    await bus.emit('test', null);
    expect(order).toEqual([1, 2]);
  });
});
