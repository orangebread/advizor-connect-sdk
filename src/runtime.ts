import { V1SdkError } from './errors.js';

export type UnsafeBrowserApiKeyOverride = {
  /**
   * Explicitly unsafe test-only escape hatch for exercising API-key clients in
   * browser-like test runtimes. Do not set in production/browser code.
   */
  allowUnsafeBrowserApiKeyForTests?: true;
};

export function isKnownBrowserRuntime() {
  const runtime = globalThis as typeof globalThis & {
    window?: unknown;
    document?: unknown;
    self?: unknown;
    importScripts?: unknown;
    WorkerGlobalScope?: Function;
  };

  if (typeof runtime.window !== 'undefined' && typeof runtime.document !== 'undefined') {
    return true;
  }

  if (typeof runtime.self !== 'undefined') {
    if (typeof runtime.WorkerGlobalScope === 'function' && runtime.self instanceof runtime.WorkerGlobalScope) {
      return true;
    }

    const selfName = typeof runtime.self === 'object' && runtime.self !== null
      ? (runtime.self as { constructor?: { name?: unknown } }).constructor?.name
      : null;
    if (
      selfName === 'DedicatedWorkerGlobalScope'
      || selfName === 'SharedWorkerGlobalScope'
      || selfName === 'ServiceWorkerGlobalScope'
      || selfName === 'WorkerGlobalScope'
    ) {
      return true;
    }
  }

  return typeof runtime.importScripts === 'function' && runtime.self === runtime;
}

export function assertApiKeyClientAllowedInRuntime(input: UnsafeBrowserApiKeyOverride = {}) {
  if (!isKnownBrowserRuntime() || input.allowUnsafeBrowserApiKeyForTests === true) return;

  throw new V1SdkError({
    status: 0,
    message:
      'Advizor Connect group API keys are server/BFF-only. Do not create an integration API-key SDK client in a browser runtime; proxy through your backend instead. The allowUnsafeBrowserApiKeyForTests override is only for tests.',
    body: null,
    code: 'SDK_BROWSER_API_KEY_FORBIDDEN',
    requestId: null,
    retryable: false,
  });
}
