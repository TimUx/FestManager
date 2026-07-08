import { describe, it, expect } from 'vitest';
import { notificationsConfigSchema, defaultNotificationConfig } from '../config';

describe('notifications module QA', () => {
  it('default config validates', () => {
    expect(notificationsConfigSchema.parse(defaultNotificationConfig)).toBeDefined();
  });
});
