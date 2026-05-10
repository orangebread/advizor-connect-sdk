import { V1SdkError } from './errors.js';
import type { SdkOperationMetadata } from './operations.js';

export type FetchLike = typeof fetch;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestInput = {
  operation: SdkOperationMetadata;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

export type AuthHeaderProvider = (operation: SdkOperationMetadata) => Promise<Record<string, string>> | Record<string, string>;

export type SdkRequester = <T>(input: RequestInput) => Promise<T>;

export type SdkRequesterOptions = {
  baseUrl: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  authHeaders?: AuthHeaderProvider;
};

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

function withQuery(path: string, query?: Record<string, string | number | null | undefined>) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function parseResponseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function sdkAuthError(input: { message: string; code: string }) {
  return new V1SdkError({
    status: 0,
    message: input.message,
    body: null,
    code: input.code,
    requestId: null,
    retryable: false,
  });
}

function parseRetryAfterMs(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isAbortError(err: unknown) {
  return err instanceof Error && err.name === 'AbortError';
}

function wrapTransportError(input: {
  err: unknown;
  operation: SdkOperationMetadata;
  timeoutMs: number;
  signal: AbortSignal;
}) {
  if (input.err instanceof V1SdkError) return input.err;
  const timedOut = input.signal.aborted || isAbortError(input.err);
  return new V1SdkError({
    status: 0,
    message: timedOut
      ? `SDK request timed out after ${input.timeoutMs}ms`
      : 'SDK network request failed',
    body: null,
    code: timedOut ? 'SDK_TIMEOUT' : 'SDK_NETWORK_ERROR',
    requestId: null,
    retryable: true,
    cause: input.err,
    operationId: input.operation.operationId,
    retrySafety: input.operation.retrySafety,
  });
}

async function requireToken(
  getToken: TokenProvider,
  input: { missingMessage: string; missingCode: string },
) {
  const token = await getToken();
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw sdkAuthError({ message: input.missingMessage, code: input.missingCode });
  }
  return token.trim();
}

export function createBearerAuthHeaderProvider(
  getToken: TokenProvider,
  input: { missingMessage: string; missingCode: string },
): AuthHeaderProvider {
  return async () => ({
    Authorization: `Bearer ${await requireToken(getToken, input)}`,
  });
}

export function createWidgetAuthHeaderProvider(
  getWidgetToken: TokenProvider,
  input: { missingMessage: string; missingCode: string },
): AuthHeaderProvider {
  return async (operation) => {
    if (!operation.securitySchemes.includes('WidgetToken')) return {} as Record<string, string>;
    return {
      'X-AC-Widget-Token': await requireToken(getWidgetToken, input),
    };
  };
}

export function createSdkRequester(options: SdkRequesterOptions): SdkRequester {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const authHeaders = options.authHeaders ?? (() => ({}));

  return async function request<T>(input: RequestInput): Promise<T> {
    const controller = new AbortController();
    const timeout = timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;
    try {
      const isFormData = typeof FormData !== 'undefined' && input.body instanceof FormData;
      const resolvedAuthHeaders = await authHeaders(input.operation);
      const headers: Record<string, string> = {
        ...resolvedAuthHeaders,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...input.headers,
      };

      let res: Response;
      try {
        res = await fetchImpl(withQuery(`${baseUrl}${input.path}`, input.query), {
          method: input.method,
          signal: controller.signal,
          headers,
          body:
            input.body == null
              ? undefined
              : isFormData
                ? input.body as FormData
                : JSON.stringify(input.body),
        });
      } catch (err) {
        throw wrapTransportError({
          err,
          operation: input.operation,
          timeoutMs,
          signal: controller.signal,
        });
      }

      let body: unknown;
      try {
        body = await parseResponseBody(res);
      } catch (err) {
        throw wrapTransportError({
          err,
          operation: input.operation,
          timeoutMs,
          signal: controller.signal,
        });
      }
      if (!res.ok) {
        const envelope = body && typeof body === 'object' ? body as {
          message?: unknown;
          error?: unknown;
          code?: unknown;
          requestId?: unknown;
          retryable?: unknown;
        } : null;
        const message =
          (envelope && typeof envelope.message === 'string' && envelope.message)
          || (envelope && typeof envelope.error === 'string' && envelope.error)
          || `Request failed (${res.status})`;
        const requestId = envelope && typeof envelope.requestId === 'string'
          ? envelope.requestId
          : res.headers.get('x-request-id') ?? res.headers.get('x-correlation-id');
        throw new V1SdkError({
          status: res.status,
          message,
          body,
          code: envelope && typeof envelope.code === 'string' ? envelope.code : `HTTP_${res.status}`,
          requestId,
          retryable: envelope && typeof envelope.retryable === 'boolean' ? envelope.retryable : isRetryableStatus(res.status),
          retryAfterMs: parseRetryAfterMs(res.headers.get('retry-after')),
          operationId: input.operation.operationId,
          retrySafety: input.operation.retrySafety,
        });
      }
      return body as T;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };
}
