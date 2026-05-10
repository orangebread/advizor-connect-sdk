import { V1SdkError } from './errors.js';
import type { RetrySafety, SdkOperationMetadata } from './operations.js';

export type RetryOptions = {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number;
  /** Base backoff delay in milliseconds. Default: 1000 */
  backoffMs?: number;
  /** Maximum backoff delay in milliseconds. Default: 30000 */
  maxBackoffMs?: number;
  /** Disable or customize jitter. Default: true */
  jitter?: boolean;
  /** Operation metadata or retry safety for custom/non-SDK retry functions. SDK-thrown metadata is authoritative. */
  operation?: Pick<SdkOperationMetadata, 'operationId' | 'retrySafety'> | RetrySafety;
  /** Caller-supplied idempotency key for custom/non-SDK side-effect retries; it does not override SDK side-effect metadata. */
  idempotencyKey?: string;
  /** Test hook for deterministic delay assertions. */
  sleep?: (delayMs: number) => Promise<void>;
  /** Test hook for deterministic jitter. */
  random?: () => number;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 1000;
const DEFAULT_MAX_BACKOFF_MS = 30_000;

function boundedPositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value == null) return fallback;
  return Math.max(1, Math.floor(value));
}

function boundedNonNegative(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value == null) return fallback;
  return Math.max(0, value);
}

function retrySafetyFromOptions(options?: RetryOptions) {
  const operation = options?.operation;
  if (!operation) return null;
  return typeof operation === 'string' ? operation : operation.retrySafety;
}

function operationIdFromOptions(options?: RetryOptions) {
  const operation = options?.operation;
  return operation && typeof operation !== 'string' ? operation.operationId : null;
}

function hasExplicitIdempotencyKey(options?: RetryOptions) {
  return typeof options?.idempotencyKey === 'string' && options.idempotencyKey.trim().length > 0;
}

function isRetryAllowedForOperation(err: V1SdkError, options?: RetryOptions) {
  const sdkRetrySafety = err.retrySafety;
  const retrySafety = sdkRetrySafety ?? retrySafetyFromOptions(options);
  if (retrySafety === 'read' || retrySafety === 'idempotent') return true;
  if (sdkRetrySafety === 'sideEffect') return false;
  return hasExplicitIdempotencyKey(options);
}

function computeDelayMs(input: {
  attempt: number;
  backoffMs: number;
  maxBackoffMs: number;
  retryAfterMs: number | null;
  jitter: boolean;
  random: () => number;
}) {
  const exponentialDelay = input.backoffMs * Math.pow(2, input.attempt - 1);
  const jitter = input.jitter ? input.random() * input.backoffMs : 0;
  const computed = exponentialDelay + jitter;
  const boundedComputed = Math.min(computed, input.maxBackoffMs);
  return input.retryAfterMs == null
    ? boundedComputed
    : Math.max(boundedComputed, input.retryAfterMs);
}

function annotateRetryExhaustion(err: V1SdkError, input: { attempts: number; exhausted: boolean; options?: RetryOptions }) {
  err.attempts = input.attempts;
  err.retryExhausted = input.exhausted;
  err.operationId = err.operationId ?? operationIdFromOptions(input.options);
  err.retrySafety = err.retrySafety ?? retrySafetyFromOptions(input.options);
  return err;
}

/**
 * Retry an async function with bounded exponential backoff, optional jitter,
 * Retry-After support, and operation-aware safety checks.
 *
 * Only retries `V1SdkError` instances with `retryable === true`. SDK methods
 * annotate errors with operation retry-safety metadata. Read/idempotent
 * operations may retry. SDK side-effecting operations do not retry unless the
 * SDK marks them idempotent; `RetryOptions` classification/idempotency keys are
 * only used for custom retry functions without SDK-provided metadata.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = boundedPositiveInteger(options?.maxAttempts, DEFAULT_MAX_ATTEMPTS);
  const backoffMs = boundedNonNegative(options?.backoffMs, DEFAULT_BACKOFF_MS);
  const maxBackoffMs = boundedNonNegative(options?.maxBackoffMs, DEFAULT_MAX_BACKOFF_MS);
  const jitter = options?.jitter ?? true;
  const sleep = options?.sleep ?? ((delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs)));
  const random = options?.random ?? Math.random;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!(err instanceof V1SdkError)) {
        throw err;
      }

      const retryAllowed = err.retryable === true && isRetryAllowedForOperation(err, options);
      if (!retryAllowed) {
        throw annotateRetryExhaustion(err, { attempts: attempt, exhausted: false, options });
      }

      if (attempt === maxAttempts) {
        throw annotateRetryExhaustion(err, { attempts: attempt, exhausted: true, options });
      }

      const delay = computeDelayMs({
        attempt,
        backoffMs,
        maxBackoffMs,
        retryAfterMs: err.retryAfterMs,
        jitter,
        random,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}
