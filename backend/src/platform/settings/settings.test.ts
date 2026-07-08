import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRegistry } from './SchemaRegistry';
import { SettingsValidation } from './SettingsValidation';
import { SettingsCache } from './SettingsCache';
import { FormGenerator } from './FormGenerator';
import { SettingsService } from './SettingsService';
import { EventBus } from '../EventBus';
import { HookSystem } from '../HookSystem';
import type { SettingsSchemaDefinition, SettingsStore } from './types';

class MemoryStore implements SettingsStore {
  private data = new Map<string, Record<string, unknown>>();

  supports(namespace: string): boolean {
    return namespace.startsWith('test.');
  }

  async load(namespace: string): Promise<Record<string, unknown>> {
    return structuredClone(this.data.get(namespace) ?? {});
  }

  async save(namespace: string, values: Record<string, unknown>): Promise<void> {
    this.data.set(namespace, structuredClone(values));
  }
}

const testSchema: SettingsSchemaDefinition = {
  namespace: 'test.demo',
  label: 'Demo',
  groups: [{ id: 'main', label: 'Main' }],
  fields: [
    { key: 'name', group: 'main', label: 'Name', type: 'string', required: true },
    { key: 'secret', group: 'main', label: 'Secret', type: 'password', encrypted: true },
  ],
};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    const audit = { log: async () => {} } as never;
    service = new SettingsService(
      new SchemaRegistry(),
      new SettingsValidation(),
      new SettingsCache(),
      new FormGenerator(),
      [new MemoryStore()],
      audit,
      new HookSystem(new EventBus())
    );
    service.registerSchema(testSchema);
  });

  it('stores and masks encrypted values', async () => {
    await service.setValues('test.demo', { name: 'Verein', secret: 'super-secret' });
    const masked = await service.getValues('test.demo');
    expect(masked.name).toBe('Verein');
    expect(String(masked.secret)).toContain('••');
  });

  it('generates dynamic form metadata', async () => {
    await service.setValues('test.demo', { name: 'Test' });
    const form = await service.getForm('test.demo');
    expect(form.groups[0].fields[0].label).toBe('Name');
  });
});
