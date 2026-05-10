import type { FetchLike, TokenProvider } from './core.js';
import { createBearerAuthHeaderProvider, createSdkRequester } from './core.js';
import { createV1MethodSet, pickClientMethods, type PickedClientMethods } from './client.js';
import { OWNER_CLIENT_METHODS } from './operations.js';

export type OwnerAccessTokenProvider = TokenProvider;

export type OwnerClientOptions = {
  baseUrl: string;
  /** Supabase access-token provider. Called for every SDK request. */
  getAccessToken: OwnerAccessTokenProvider;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export type OwnerClient = PickedClientMethods<typeof OWNER_CLIENT_METHODS>;

export function createOwnerClient(options: OwnerClientOptions): OwnerClient {
  const request = createSdkRequester({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    authHeaders: createBearerAuthHeaderProvider(
      options.getAccessToken,
      {
        missingMessage: 'SDK owner access token is required for createOwnerClient.',
        missingCode: 'SDK_OWNER_ACCESS_TOKEN_MISSING',
      },
    ),
  });

  return pickClientMethods(createV1MethodSet(request), OWNER_CLIENT_METHODS);
}
