import type { SettingsSchemaDefinition, SettingsNamespaceInfo } from './types';

export class SchemaRegistry {
  private readonly schemas = new Map<string, SettingsSchemaDefinition>();

  register(definition: SettingsSchemaDefinition): void {
    if (this.schemas.has(definition.namespace)) {
      throw new Error(`Settings schema already registered: ${definition.namespace}`);
    }
    this.schemas.set(definition.namespace, definition);
  }

  registerOrReplace(definition: SettingsSchemaDefinition): void {
    this.schemas.set(definition.namespace, definition);
  }

  get(namespace: string): SettingsSchemaDefinition | undefined {
    return this.schemas.get(namespace);
  }

  getOrThrow(namespace: string): SettingsSchemaDefinition {
    const schema = this.schemas.get(namespace);
    if (!schema) throw new Error(`Settings schema not found: ${namespace}`);
    return schema;
  }

  has(namespace: string): boolean {
    return this.schemas.has(namespace);
  }

  list(): SettingsNamespaceInfo[] {
    return Array.from(this.schemas.values()).map((s) => ({
      namespace: s.namespace,
      label: s.label,
      description: s.description,
      adminPath: s.adminPath,
      permission: s.permission,
      groupCount: s.groups.length,
      fieldCount: s.fields.length,
    }));
  }

  clear(): void {
    this.schemas.clear();
  }
}
