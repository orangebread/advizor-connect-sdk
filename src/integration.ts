import type { FetchLike, TokenProvider } from './core.js';
import { createBearerAuthHeaderProvider, createSdkRequester } from './core.js';
import { createV1MethodSet, pickClientMethods, type PickedClientMethods } from './client.js';
import { INTEGRATION_CLIENT_METHODS } from './operations.js';
import { assertApiKeyClientAllowedInRuntime, type UnsafeBrowserApiKeyOverride } from './runtime.js';

export type IntegrationApiKeyProvider = TokenProvider;

export type IntegrationClientOptions = UnsafeBrowserApiKeyOverride & {
  baseUrl: string;
  /** Group API key or provider from the owner dashboard. Both forms are server/BFF-only and must not be used as a browser escape hatch. */
  apiKey: string | IntegrationApiKeyProvider;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export type IntegrationClient = PickedClientMethods<typeof INTEGRATION_CLIENT_METHODS>;

function getApiKeyProvider(apiKey: string | IntegrationApiKeyProvider): IntegrationApiKeyProvider {
  return typeof apiKey === 'function' ? apiKey : () => apiKey;
}

export function createIntegrationClient(options: IntegrationClientOptions): IntegrationClient {
  assertApiKeyClientAllowedInRuntime(options);

  const request = createSdkRequester({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    authHeaders: createBearerAuthHeaderProvider(
      getApiKeyProvider(options.apiKey),
      {
        missingMessage: 'SDK integration API key is required for createIntegrationClient.',
        missingCode: 'SDK_INTEGRATION_API_KEY_MISSING',
      },
    ),
  });

  return pickClientMethods(createV1MethodSet(request), INTEGRATION_CLIENT_METHODS);
}
