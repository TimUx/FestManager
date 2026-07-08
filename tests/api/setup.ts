import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend');
process.chdir(backendRoot);
dotenv.config({ path: path.join(backendRoot, '.env') });

export const BACKEND_ROOT = backendRoot;

export async function createTestApp() {
  const mod = await import(path.join(backendRoot, 'src/app.ts'));
  await mod.bootstrapApp();
  return mod.default;
}
