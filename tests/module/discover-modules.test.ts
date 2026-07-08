import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../backend');
process.chdir(backendRoot);

describe('Module QA discovery', () => {
  it('discovers modules without hardcoded names', async () => {
    const { moduleDiscovery } = await import('../../backend/src/platform/bootstrap');
    const { QaRegistry } = await import('../../backend/src/platform/qa');
    const registry = new QaRegistry(moduleDiscovery);
    const ids = registry.scenarioModuleIds();
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it('builds dynamic scenarios from discovery', async () => {
    const {
      bootstrapPlatform,
      moduleDiscovery,
      moduleManager,
      moduleRegistry,
      healthService,
      featureContext,
    } = await import('../../backend/src/platform/bootstrap');
    bootstrapPlatform();
    const { QaRegistry, ModuleScenarioRunner } = await import('../../backend/src/platform/qa');
    const runner = new ModuleScenarioRunner(
      new QaRegistry(moduleDiscovery),
      moduleManager,
      moduleRegistry,
      healthService,
      featureContext
    );
    const scenarios = runner.buildScenarios();
    expect(scenarios.find((s) => s.id === 'none')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'all')).toBeDefined();
    expect(scenarios.some((s) => s.id.startsWith('only-'))).toBe(true);
  });
});
