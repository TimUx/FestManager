import { formatPrice } from '../../../src/utils/helpers';
import type { OrderPrintPayload, PrintTemplate } from '../../../src/platform/extension-points/PrinterService';

function customerLabel(payload: OrderPrintPayload): string {
  if (!payload.customer) return '';
  const parts = [payload.customer.firstName, payload.customer.lastName].filter(Boolean);
  return parts.join(' ');
}

export function buildKitchenTicket(payload: OrderPrintPayload, clubName: string) {
  const lines = [
    '=== KUECHENBON ===',
    clubName,
    `Nr. ${payload.displayNumber}`,
    payload.eventDateLabel ? `Datum: ${payload.eventDateLabel}` : '',
    `Quelle: ${payload.source}`,
    customerLabel(payload) ? `Kunde: ${customerLabel(payload)}` : '',
    '---',
    ...payload.items.map((i) => `${i.quantity}x ${i.name}`),
    '---',
    `Gesamt: ${formatPrice(payload.totalPrice)}`,
    '',
  ].filter(Boolean);

  const html = `
    <div style="font-family: monospace; font-size: 14px; width: 280px;">
      <h2 style="margin:0 0 8px;">Küchenbon</h2>
      <p><strong>${payload.displayNumber}</strong> · ${clubName}</p>
      ${payload.eventDateLabel ? `<p>${payload.eventDateLabel}</p>` : ''}
      <hr/>
      ${payload.items.map((i) => `<div>${i.quantity}× ${i.name}</div>`).join('')}
      <hr/>
      <p><strong>${formatPrice(payload.totalPrice)}</strong></p>
    </div>
  `;

  return { title: `Küchenbon ${payload.displayNumber}`, lines, html };
}

export function buildReceiptTicket(payload: OrderPrintPayload, clubName: string) {
  const lines = [
    '=== KASSENBON ===',
    clubName,
    `Nr. ${payload.displayNumber}`,
    payload.eventDateLabel ? `Datum: ${payload.eventDateLabel}` : '',
    '---',
    ...payload.items.map((i) => `${i.quantity}x ${i.name}  ${formatPrice(i.lineTotal ?? 0)}`),
    '---',
    `Gesamt: ${formatPrice(payload.totalPrice)}`,
    'Vielen Dank!',
    '',
  ].filter(Boolean);

  const html = `
    <div style="font-family: monospace; font-size: 14px; width: 280px;">
      <h2 style="margin:0 0 8px;">Kassenbon</h2>
      <p>${clubName}</p>
      <p><strong>${payload.displayNumber}</strong></p>
      <hr/>
      ${payload.items.map((i) => `<div style="display:flex;justify-content:space-between"><span>${i.quantity}× ${i.name}</span><span>${formatPrice(i.lineTotal ?? 0)}</span></div>`).join('')}
      <hr/>
      <p><strong>Gesamt: ${formatPrice(payload.totalPrice)}</strong></p>
    </div>
  `;

  return { title: `Kassenbon ${payload.displayNumber}`, lines, html };
}

export function buildTestTicket(template: PrintTemplate, clubName: string) {
  const payload: OrderPrintPayload = {
    id: 'test',
    orderNumber: 0,
    displayNumber: 'TEST',
    eventId: 'test',
    eventDateLabel: 'Testdruck',
    source: 'TEST',
    totalPrice: 9.5,
    items: [{ name: 'Bratwurst', quantity: 2, lineTotal: 9.5 }],
  };
  return template === 'receipt'
    ? buildReceiptTicket(payload, clubName)
    : buildKitchenTicket(payload, clubName);
}
