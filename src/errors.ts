import type { RetrySafety } from './operations.js';

export class V1SdkError extends Error {
  status: number;
  body: unknown;
  code: string | null;
  requestId: string | null;
  retryable: boolean;
  cause: unknown;
  retryAfterMs: number | null;
  attempts: number | null;
  retryExhausted: boolean;
  operationId: string | null;
  retrySafety: RetrySafety | null;

  constructor(input: {
    status?: number;
    message: string;
    body?: unknown;
    code?: string | null;
    requestId?: string | null;
    retryable?: boolean | null;
    cause?: unknown;
    retryAfterMs?: number | null;
    attempts?: number | null;
    retryExhausted?: boolean;
    operationId?: string | null;
    retrySafety?: RetrySafety | null;
  }) {
    super(input.message);
    this.name = 'V1SdkError';
    this.status = input.status ?? 0;
    this.body = input.body ?? null;
    this.code = input.code ?? null;
    this.requestId = input.requestId ?? null;
    this.retryable = input.retryable ?? false;
    this.cause = input.cause;
    this.retryAfterMs = input.retryAfterMs ?? null;
    this.attempts = input.attempts ?? null;
    this.retryExhausted = input.retryExhausted ?? false;
    this.operationId = input.operationId ?? null;
    this.retrySafety = input.retrySafety ?? null;
  }
}
