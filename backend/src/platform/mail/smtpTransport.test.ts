import { describe, it, expect } from 'vitest';
import { humanizeSmtpError, resolveSmtpTransportOptions, smtpTlsDefaultsForPort } from './smtpTransport';

describe('resolveSmtpTransportOptions', () => {
  it('uses implicit TLS on port 465', () => {
    expect(resolveSmtpTransportOptions(465, { secure: false, useTls: true })).toEqual({
      secure: true,
      requireTLS: false,
    });
  });

  it('uses STARTTLS on port 587 even when secure flag is true', () => {
    expect(resolveSmtpTransportOptions(587, { secure: true, useTls: true })).toEqual({
      secure: false,
      requireTLS: true,
    });
  });

  it('allows plain SMTP on port 1025 (Mailpit)', () => {
    expect(resolveSmtpTransportOptions(1025, { secure: false, useTls: true })).toEqual({
      secure: false,
      requireTLS: false,
    });
  });
});

describe('humanizeSmtpError', () => {
  it('explains wrong version number on port 587', () => {
    const msg = humanizeSmtpError('wrong version number', 587);
    expect(msg).toMatch(/587/);
    expect(msg).toMatch(/STARTTLS/i);
  });
});

describe('smtpTlsDefaultsForPort', () => {
  it('defaults 587 to STARTTLS without SSL', () => {
    expect(smtpTlsDefaultsForPort(587)).toEqual({ secure: false, useTls: true });
  });

  it('defaults 465 to SSL', () => {
    expect(smtpTlsDefaultsForPort(465)).toEqual({ secure: true, useTls: false });
  });
});
