# Changelog

## 0.2.1 — 2026-05-11

Patch release to correct the npm registry README after `0.2.0` was published.
No SDK runtime, type, or API surface changes were made.

### Changed

- Updated installation wording so the package README reflects that public npm
  `latest` is now `0.2.x`.

## 0.2.0 — Prepared 2026-05-09 (not yet published)

Release preparation for the public SDK auth/runtime hardening package. This entry
records the package contents intended for `@advizorconnect/sdk@0.2.0`; it does
not claim that npm publish, dist-tag changes, or `0.1.0` deprecation have
occurred. Those external npm mutations require explicit operator approval.

### Added

- Auth-specific ESM entrypoints:
  - `@advizorconnect/sdk/integration` with `createIntegrationClient` for server/BFF group API-key integration and session operations.
  - `@advizorconnect/sdk/owner` with `createOwnerClient` for Supabase owner/admin token operations.
  - `@advizorconnect/sdk/widget` with `createWidgetClient` for browser-safe widget-token and public operations.
- Package metadata for a public, provenance-backed npm release target: Node `>=22`, subpath export/type declarations, repository/homepage/bugs metadata, keywords, and public publish config.
- Operation-aware retry helper behavior with bounded backoff, jitter, `Retry-After` support, retry exhaustion metadata, and SDK-authored retry-safety metadata.

### Changed

- Root `createV1Client` remains available for one-release compatibility but is deprecated in favor of auth-specific clients.
- SDK transport errors now normalize network failures, timeouts, and response-body read failures into `V1SdkError` with stable `code`, `requestId`, `retryable`, `cause`, and operation metadata fields.
- Group API-key clients fail closed in known browser/window/worker runtimes unless the explicitly unsafe test-only override is supplied.
- Unsafe side-effecting SDK operations do not retry automatically unless the SDK marks the operation idempotent; generic `RetryOptions.idempotencyKey` is for custom retry functions and does not override SDK side-effect metadata.

### Release status

- Package build readiness, packed-package smoke evidence, staging platform smoke, production readiness, npm publish, dist-tag mutation, and `0.1.0` deprecation are separate gates.
- `0.2.0` publish preparation can be performed by the release workflow, but actual npm publish/deprecate/dist-tag mutations have not been run as part of SRV-045.

## 0.1.0 — 2026-03-02

Initial release.

### Features

- **32 typed methods** across 7 API tag groups:
  - Integration (2): list/get group advisors
  - Sessions (13): full call lifecycle from create through end-and-capture
  - Owner / API Keys (4): CRUD + rotation with overlap windows
  - Widget (3): token minting, config, advisor listing
  - Owner / Widget (2): security settings (allowed origins)
  - Owner / Invites (5): create, list, rotate, revoke, send
  - Owner / Groups (4): slug management, settings
- **`V1SdkError`** with structured fields: `status`, `message`, `code`, `requestId`, `retryable`
- **AbortController timeout** — 20s default, configurable via `timeoutMs`
- **Custom fetch injection** — pass your own `fetchImpl` for testing or custom HTTP clients
- **Generated types** from OpenAPI v1 spec via `openapi-typescript`
- **Tree-shakeable** ESM package with `sideEffects: false`
