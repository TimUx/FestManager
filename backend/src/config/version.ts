import { readFileSync } from 'fs';
import path from 'path';

let cachedVersion: string | undefined;

/** Laufende App-Version: CORE_VERSION → package.json → Fallback. */
export function resolveAppVersion(): string {
  const fromEnv = process.env.CORE_VERSION?.trim();
  if (fromEnv) return fromEnv;

  if (cachedVersion) return cachedVersion;

  for (const candidate of [
    path.join(process.cwd(), 'package.json'),
    path.join(__dirname, '../../../package.json'),
  ]) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8')) as { version?: string };
      if (typeof pkg.version === 'string' && pkg.version.trim()) {
        cachedVersion = pkg.version.trim();
        return cachedVersion;
      }
    } catch {
      /* nächsten Kandidaten versuchen */
    }
  }

  cachedVersion = '0.0.0';
  return cachedVersion;
}
