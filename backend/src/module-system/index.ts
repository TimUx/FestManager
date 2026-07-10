/**
 * @deprecated Since Module API v3 – use `platform/module-api` in modules and `platform` in core.
 * This facade remains for backward-compatible imports only; no duplicate runtime logic.
 */
export * from '../platform/module-api';

export {
  Registry,
  ServiceContainer,
  PLATFORM_TOKENS,
  EventBus,
  HookSystem,
  MetadataRegistry,
  ExtensionPointRegistry,
  EXTENSION_POINT_NAMES,
  HealthService,
  AuditService,
  FeatureFlags,
  createFeatureContext,
  ModuleRegistry,
  deriveModuleStatus,
  ModuleDiscovery,
  ModuleLoader,
  DependencyResolver,
  ModuleManager,
  bootstrapPlatform,
  platformContainer,
  moduleDiscovery,
  moduleLoader,
  moduleRegistry,
  moduleManager,
  featureFlags,
  featureContext,
  dependencyResolver,
  hookSystem,
} from '../platform';

export type {
  ModuleInfo,
  ModuleConfigContract,
  ResolvedModuleMetadata,
  AuditLogEntry,
  ExtensionPointName,
  ModuleManagerDeps,
} from '../platform';

/** @deprecated Use `HookSystem` from `platform`. */
export { HookSystem as FeatureHooks } from '../platform/HookSystem';

/** @deprecated Use `hookSystem` from `platform/bootstrap`. */
export { hookSystem as featureHooks } from '../platform/bootstrap';
