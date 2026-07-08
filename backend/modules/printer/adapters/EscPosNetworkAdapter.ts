import net from 'net';
import type { PrinterConfig, PrinterSlotConfig, PrinterSlotId } from '../config';
import type { PrinterAdapter } from '../PrinterAdapter';
import type { PrintJob, PrintJobResult } from '../PrintJob';

function encodeEscPos(lines: string[]): Buffer {
  const chunks: Buffer[] = [Buffer.from([0x1b, 0x40])]; // init
  for (const line of lines) {
    chunks.push(Buffer.from(`${line}\n`, 'latin1'));
  }
  chunks.push(Buffer.from([0x1d, 0x56, 0x00])); // cut
  return Buffer.concat(chunks);
}

function tcpProbe(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

export class EscPosNetworkAdapter implements PrinterAdapter {
  readonly type = 'escpos-network' as const;
  readonly label = 'ESC/POS Netzwerk';
  readonly implemented = true;

  isConfigured(slot: PrinterSlotConfig): boolean {
    return Boolean(slot.enabled && String(slot.host ?? '').trim());
  }

  async print(
    _config: PrinterConfig,
    _slotId: PrinterSlotId,
    slot: PrinterSlotConfig,
    job: PrintJob
  ): Promise<PrintJobResult> {
    const host = String(slot.host ?? '').trim();
    const port = Number(slot.port ?? 9100);
    if (!host) return { ok: false, error: 'Host fehlt' };

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.once('error', (err) => resolve({ ok: false, error: err.message }));
      socket.once('timeout', () => resolve({ ok: false, error: 'Verbindungs-Timeout' }));
      socket.connect(port, host, () => {
        socket.write(encodeEscPos(job.lines), (err) => {
          socket.end();
          resolve(err ? { ok: false, error: err.message } : { ok: true });
        });
      });
    });
  }

  async testConnection(_config: PrinterConfig, slot: PrinterSlotConfig): Promise<{ ok: boolean; message?: string }> {
    const host = String(slot.host ?? '').trim();
    const port = Number(slot.port ?? 9100);
    if (!host) return { ok: false, message: 'Host fehlt' };
    const ok = await tcpProbe(host, port, 3000);
    return ok
      ? { ok: true, message: `Erreichbar auf ${host}:${port}` }
      : { ok: false, message: `Nicht erreichbar (${host}:${port})` };
  }

  async discover(config: PrinterConfig) {
    const subnet = String(config.discovery.subnet ?? '192.168.1').replace(/\.$/, '');
    const port = Number(config.discovery.port ?? 9100);
    const hosts = Array.from({ length: 32 }, (_, i) => `${subnet}.${i + 1}`);
    const results = await Promise.all(
      hosts.map(async (host) => ({
        host,
        port,
        type: 'escpos-network' as const,
        reachable: await tcpProbe(host, port, 400),
      }))
    );
    return results.filter((r) => r.reachable);
  }
}
