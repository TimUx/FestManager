import { prisma } from '../config/database';
import type { FeatureContext, Module, ModuleHealthCheckResult } from './types';
import type { FeatureFlags } from './FeatureFlags';

export class HealthService {
  constructor(private readonly flags: FeatureFlags) {}

  async checkModule(
    moduleId: string,
    module: Module,
    context: FeatureContext
  ): Promise<ModuleHealthCheckResult> {
    const result = await module.healthCheck(context);
    await this.persist(moduleId, result);
    this.flags.updateHealth(moduleId, result.status);
    return result;
  }

  async persist(moduleId: string, result: ModuleHealthCheckResult): Promise<void> {
    await prisma.installedModule.update({
      where: { moduleId },
      data: {
        lastHealthStatus: result.status,
        lastHealthCheck: new Date(),
      },
    });
  }

  async checkAll(
    modules: Module[],
    context: FeatureContext
  ): Promise<Record<string, ModuleHealthCheckResult>> {
    const results: Record<string, ModuleHealthCheckResult> = {};
    for (const mod of modules) {
      results[mod.id] = await this.checkModule(mod.id, mod, context);
    }
    return results;
  }
}
