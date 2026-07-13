import { describe, expect, it } from 'vitest';
import { validateFormBotProtection } from './botProtection';

describe('validateFormBotProtection', () => {
  const validPayload = {
    formStartedAt: Date.now() - 5000,
    _hp: '',
  };

  it('rejects honeypot submissions', async () => {
    await expect(
      validateFormBotProtection({ ...validPayload, _hp: 'spam' })
    ).rejects.toMatchObject({ code: 'BOT_DETECTED' });
  });

  it('rejects forms submitted too quickly', async () => {
    await expect(
      validateFormBotProtection({ formStartedAt: Date.now(), _hp: '' })
    ).rejects.toMatchObject({ code: 'BOT_TOO_FAST' });
  });

  it('accepts normal timing without turnstile secret', async () => {
    const original = process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    await expect(validateFormBotProtection(validPayload)).resolves.toBeUndefined();
    if (original) process.env.TURNSTILE_SECRET_KEY = original;
  });
});
