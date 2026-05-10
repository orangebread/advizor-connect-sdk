import type { FetchLike, TokenProvider } from './core.js';
import { createSdkRequester, createWidgetAuthHeaderProvider } from './core.js';
import { createV1MethodSet, pickClientMethods, type PickedClientMethods } from './client.js';
import { WIDGET_CLIENT_METHODS } from './operations.js';

export type WidgetTokenProvider = TokenProvider;

export type WidgetClientOptions = {
  baseUrl: string;
  /** Short-lived widget token or provider. Required only for widget-token operations. */
  widgetToken?: string | WidgetTokenProvider;
  /** Short-lived widget token provider. Called for each widget-token request when supplied. */
  getWidgetToken?: WidgetTokenProvider;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export type WidgetClient = PickedClientMethods<typeof WIDGET_CLIENT_METHODS>;

function getWidgetTokenProvider(options: WidgetClientOptions): WidgetTokenProvider {
  if (options.getWidgetToken) return options.getWidgetToken;
  if (typeof options.widgetToken === 'function') return options.widgetToken;
  if (typeof options.widgetToken === 'string') {
    const token = options.widgetToken;
    return () => token;
  }
  return () => null;
}

export function createWidgetClient(options: WidgetClientOptions): WidgetClient {
  const request = createSdkRequester({
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    authHeaders: createWidgetAuthHeaderProvider(
      getWidgetTokenProvider(options),
      {
        missingMessage: 'SDK widget token is required for this widget client operation.',
        missingCode: 'SDK_WIDGET_TOKEN_MISSING',
      },
    ),
  });

  return pickClientMethods(createV1MethodSet(request), WIDGET_CLIENT_METHODS);
}
