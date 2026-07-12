/**
 * SMTP-TLS-Modi nach Port (Nodemailer):
 * - 465: implicit TLS (secure: true)
 * - 587/2525: plain + STARTTLS (secure: false, requireTLS)
 * - 25/1025: oft ohne TLS (lokal/Mailpit)
 *
 * secure:true auf Port 587 führt zu „wrong version number“ (OpenSSL).
 */
export function resolveSmtpTransportOptions(
  port: number,
  options: { secure?: boolean; useTls?: boolean }
): { secure: boolean; requireTLS: boolean } {
  if (port === 465) {
    return { secure: true, requireTLS: false };
  }

  const useTls = options.useTls !== false;
  if (port === 587 || port === 2525) {
    return { secure: false, requireTLS: useTls };
  }

  if (port === 25 || port === 1025) {
    return { secure: false, requireTLS: false };
  }

  // Unbekannter Port: niemals implizites TLS außer explizit 465
  return { secure: false, requireTLS: useTls };
}

export function humanizeSmtpError(message: string, port: number): string {
  if (message.includes('altnames') || message.includes('Hostname/IP does not match')) {
    return 'TLS-Zertifikat passt nicht zum SMTP-Hostnamen. Der Host in der SMTP-Konfiguration muss im Zertifikat enthalten sein (z. B. mail.example.de) – prüfen Sie Traefik/Reverse-Proxy oder verwenden Sie den Hostnamen aus dem Zertifikat.';
  }
  if (message.includes('wrong version number')) {
    if (port === 587 || port === 2525) {
      return 'TLS-Fehler: Für Port 587 den Verschlüsselungsmodus „STARTTLS (Port 587)“ wählen, nicht SSL/465.';
    }
    if (port === 465) {
      return 'TLS-Fehler: Für Port 465 den Verschlüsselungsmodus „SSL/TLS (Port 465)“ wählen.';
    }
    return 'TLS-Fehler: Verschlüsselungsmodus passt nicht zum SMTP-Port.';
  }
  return message;
}

/** UI-Hilfe: empfohlene TLS-Schalter für einen Port. */
export function smtpTlsDefaultsForPort(port: number): { secure: boolean; useTls: boolean } {
  if (port === 465) return { secure: true, useTls: false };
  if (port === 587 || port === 2525) return { secure: false, useTls: true };
  return { secure: false, useTls: false };
}
