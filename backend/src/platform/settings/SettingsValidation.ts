import { AppError } from '../../middleware/errorHandler';
import type { SettingsFieldMetadata, SettingsSchemaDefinition } from './types';
import { getByPath } from './pathUtils';

export class SettingsValidation {
  validate(schema: SettingsSchemaDefinition, values: Record<string, unknown>): void {
    const errors: string[] = [];

    for (const field of schema.fields) {
      const value = getByPath(values, field.key);
      const err = this.validateField(field, value);
      if (err) errors.push(err);
    }

    if (errors.length > 0) {
      throw new AppError(400, `Einstellungen ungültig: ${errors.join('; ')}`);
    }
  }

  private validateField(field: SettingsFieldMetadata, value: unknown): string | null {
    const isEmpty = value === undefined || value === null || value === '';

    if (field.required && isEmpty) {
      return `${field.label} ist erforderlich`;
    }

    if (isEmpty) return null;

    switch (field.type) {
      case 'number': {
        const num = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(num)) return `${field.label} muss eine Zahl sein`;
        if (field.validation?.min !== undefined && num < field.validation.min) {
          return `${field.label} muss mindestens ${field.validation.min} sein`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          return `${field.label} darf höchstens ${field.validation.max} sein`;
        }
        break;
      }
      case 'boolean':
        if (typeof value !== 'boolean') return `${field.label} muss true/false sein`;
        break;
      case 'email': {
        const str = String(value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return `${field.label} ist keine gültige E-Mail`;
        break;
      }
      case 'select': {
        const str = String(value);
        const allowed = field.validation?.enum ?? field.options?.map((o) => o.value) ?? [];
        if (allowed.length > 0 && !allowed.includes(str)) {
          return `${field.label} hat einen ungültigen Wert`;
        }
        break;
      }
      default: {
        const str = String(value);
        if (field.validation?.min !== undefined && str.length < field.validation.min) {
          return `${field.label} ist zu kurz`;
        }
        if (field.validation?.max !== undefined && str.length > field.validation.max) {
          return `${field.label} ist zu lang`;
        }
        if (field.validation?.pattern) {
          const re = new RegExp(field.validation.pattern);
          if (!re.test(str)) return `${field.label} entspricht nicht dem erwarteten Format`;
        }
        if (field.validation?.enum && !field.validation.enum.includes(str)) {
          return `${field.label} hat einen ungültigen Wert`;
        }
      }
    }

    return null;
  }
}
