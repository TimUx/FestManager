/**
 * Führt von Modulen registrierte Integrationstests dynamisch aus.
 */
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';

const backendRoot = path.resolve(__dirname, '../../backend');
process.chdir(backendRoot);
dotenv.config({ path: path.join(backendRoot, '.env') });

async function main(): Promise<void> {
  const { moduleDiscovery } = await import('../../backend/src/platform/bootstrap');
  const { QaRegistry } = await import('../../backend/src/platform/qa');

  const registry = new QaRegistry(moduleDiscovery);
  const tests = registry.listContributions().filter((c) => c.integrationTestPath);

  if (tests.length === 0) {
    console.log('Keine Modul-Integrationstests registriert.');
    return;
  }

  const artifactsDir = path.resolve(__dirname, '../../artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });

  let failed = 0;
  for (const test of tests) {
    console.log(`Modul-Test: ${test.moduleId} → ${test.integrationTestPath}`);
    const rel = path.relative(backendRoot, test.integrationTestPath!);
    const result = spawnSync('npx', ['vitest', 'run', rel], {
      cwd: backendRoot,
      stdio: 'inherit',
      env: process.env,
    });
    if (result.status !== 0) failed += 1;
  }

  fs.writeFileSync(
    path.join(artifactsDir, 'module-tests.json'),
    JSON.stringify({ total: tests.length, failed }, null, 2)
  );

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
