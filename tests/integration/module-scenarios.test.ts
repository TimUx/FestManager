import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend');
process.chdir(backendRoot);

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)('Module scenario runner', () => {
  beforeAll(async () => {
    const { moduleManager } = await import('../../backend/src/platform/bootstrap');
    await moduleManager.initialize();
  });

  it('runs none scenario successfully', async () => {
    const {
      moduleDiscovery,
      moduleManager,
      moduleRegistry,
      healthService,
      featureContext,
    } = await import('../../backend/src/platform/bootstrap');
    const { QaRegistry, ModuleScenarioRunner } = await import('../../backend/src/platform/qa');
    const runner = new ModuleScenarioRunner(
      new QaRegistry(moduleDiscovery),
      moduleManager,
      moduleRegistry,
      healthService,
      featureContext
    );
    const scenario = runner.buildScenarios().find((s) => s.id === 'none');
    expect(scenario).toBeDefined();
    const result = await runner.runScenario(scenario!);
    expect(result.ok).toBe(true);
  }, 120_000);
});
