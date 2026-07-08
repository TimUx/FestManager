/**
 * DSGVO: Aufbewahrungsfristen und Hinweistexte (M12).
 * Bestelldaten werden nach Veranstaltungsende + Frist anonymisiert (geplant via Cron/Admin).
 */
export const DATA_RETENTION_DAYS_AFTER_EVENT = 90;

export const ORDER_PRIVACY_NOTICE =
  'Ihre Daten werden nur zur Abwicklung dieser Bestellung verwendet und nach der Veranstaltung gemäß unserer Datenschutzerklärung gelöscht.';

export function retentionCutoffDate(eventDate: Date): Date {
  const d = new Date(eventDate);
  d.setUTCDate(d.getUTCDate() + DATA_RETENTION_DAYS_AFTER_EVENT);
  return d;
}
