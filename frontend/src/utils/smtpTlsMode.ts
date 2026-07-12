/** Gegenseitig ausschließende SMTP-Verschlüsselungsmodi. */
export type SmtpTlsMode = 'starttls' | 'ssl' | 'none';

export const SMTP_TLS_MODE_OPTIONS: Array<{
  value: SmtpTlsMode;
  label: string;
  helper: string;
}> = [
  {
    value: 'starttls',
    label: 'STARTTLS (Port 587)',
    helper: 'Standard für die meisten Mail-Provider',
  },
  {
    value: 'ssl',
    label: 'SSL/TLS (Port 465)',
    helper: 'Implicit TLS von Verbindungsbeginn an',
  },
  {
    value: 'none',
    label: 'Keine Verschlüsselung (Port 1025)',
    helper: 'Nur für lokale Tests / Mailpit',
  },
];

export function smtpConfigFromTlsMode(mode: SmtpTlsMode): {
  port: number;
  secure: boolean;
  useTls: boolean;
} {
  switch (mode) {
    case 'ssl':
      return { port: 465, secure: true, useTls: false };
    case 'starttls':
      return { port: 587, secure: false, useTls: true };
    case 'none':
      return { port: 1025, secure: false, useTls: false };
  }
}

export function smtpTlsModeFromConfig(
  secure: unknown,
  useTls: unknown,
  port: unknown
): SmtpTlsMode {
  const p = typeof port === 'number' ? port : Number(port) || 587;
  if (p === 465 || secure === true) return 'ssl';
  if (p === 587 || p === 2525) return useTls === false ? 'none' : 'starttls';
  if (p === 25 || p === 1025) return 'none';
  return useTls === false && !secure ? 'none' : 'starttls';
}

export function smtpTlsFromPort(port: number): { secure: boolean; useTls: boolean; mode: SmtpTlsMode } {
  if (port === 465) return { ...smtpConfigFromTlsMode('ssl'), mode: 'ssl' };
  if (port === 587 || port === 2525) return { ...smtpConfigFromTlsMode('starttls'), mode: 'starttls' };
  return { ...smtpConfigFromTlsMode('none'), mode: 'none' };
}
