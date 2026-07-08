import { getPayableResourceRegistry } from '../extensionPoints';
import { orderPayableAdapter } from './orderPayableAdapter';

/** Core registriert zahlbare Ressourcen – Payment-Modul bleibt domänenagnostisch */
export function registerCorePayables(): void {
  getPayableResourceRegistry().register(orderPayableAdapter);
}
