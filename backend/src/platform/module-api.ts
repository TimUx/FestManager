/**
 * Module API v3 – canonical import path for official and preview modules.
 *
 * @example
 * import { BaseModule, CORE_HOOKS, paymentServiceRegistry, type FeatureContext } from '../../src/platform/module-api';
 */
export { BaseModule, CORE_HOOKS, compareVersions } from './types';
export type {
  Module,
  ModuleInfo,
  ModuleConfigContract,
  ModuleWidget,
  ModuleMenuItem,
  ModulePermissionDefinition,
  ModuleRouteRegistration,
  ModuleRouteMetadata,
  ModuleSettingsMetadata,
  ModuleHealthCheckResult,
  ModuleFeatureFlags,
  CoreHookName,
  HookSubscription,
  HookHandler,
  FeatureContext,
} from './types';

export type { ModuleManifest, ModuleStatus } from './manifest';
export { MODULE_STATUS_LABELS, moduleManifestSchema, CORE_VERSION, isPreviewModule, shouldLoadPreviewModules, filterDiscoveredManifests } from './manifest';

export type {
  PayableResource,
  PayableResourceAdapter,
  PaymentService,
  PaymentCheckoutResult,
  PaymentStatus,
  PaymentMethodInfo,
  PaymentStatusResult,
  RefundResult,
  WebhookVerificationResult,
  LegalContentService,
  LegalPageType,
  PublicLegalLink,
  PublicLegalPage,
  NotificationService,
  OrderEmailData,
  ClubContactData,
  PrinterService,
  OrderPrintPayload,
  PrintTemplate,
} from './extension-points';

export {
  payableResourceRegistry,
  paymentServiceRegistry,
  legalContentServiceRegistry,
  notificationServiceRegistry,
  printerServiceRegistry,
} from './extension-points';
