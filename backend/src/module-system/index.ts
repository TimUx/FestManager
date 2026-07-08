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
  BaseModule,
  CORE_HOOKS,
  compareVersions,
  MODULE_STATUS_LABELS,
  moduleManifestSchema,
  CORE_VERSION,
  payableResourceRegistry,
  paymentServiceRegistry,
  bootstrapPlatform,
  platformContainer,
  moduleDiscovery,
  moduleLoader,
} from '../platform';

export type {
  Module,
  ModuleInfo,
  ModuleConfigContract,
  ModuleWidget,
  ModuleMenuItem,
  ModulePermissionDefinition,
  ModuleRouteRegistration,
  ModuleHealthCheckResult,
  ModuleFeatureFlags,
  CoreHookName,
  HookSubscription,
  FeatureContext,
  ModuleStatus,
  ModuleManifest,
  PayableResource,
  PayableResourceAdapter,
  PaymentService,
  PaymentCheckoutResult,
  ModuleManagerDeps,
  ExtensionPointName,
  ResolvedModuleMetadata,
  AuditLogEntry,
} from '../platform';

export { HookSystem as FeatureHooks } from '../platform/HookSystem';

import {
  hookSystemInstance,
  featureFlagsInstance,
  featureContextInstance,
  moduleRegistryInstance,
  moduleManagerInstance,
  dependencyResolverInstance,
} from '../platform/bootstrap';

export const featureHooks = hookSystemInstance;
export const featureFlags = featureFlagsInstance;
export const featureContext = featureContextInstance;
export const moduleRegistry = moduleRegistryInstance;
export const moduleManager = moduleManagerInstance;
export const dependencyResolver = dependencyResolverInstance;
