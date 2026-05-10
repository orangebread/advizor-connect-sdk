export { V1SdkError } from './errors.js';
export { createV1Client } from './client.js';
export type { V1ClientOptions } from './client.js';
export { withRetry } from './retry.js';
export type { RetryOptions } from './retry.js';

// Re-export generated schema types for consumer convenience
export type {
  ApiKeyRecord,
  InviteRecord,
  GroupSettingsResponse,
  WidgetConfigResponse,
  WidgetAdvisor,
  WidgetSecurityConfig,
  IntegrationAdvisor,
  IntegrationAdvisorFeedResponse,
  SessionEnvelope,
  ApiSession,
  LedgerEvent,
  ErrorResponse,
} from './client.js';

// Re-export raw generated types for advanced use
export type { paths, components, operations } from './generated/v1.js';
