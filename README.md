# @advizorconnect/sdk

Typed ESM TypeScript SDK for Advizor Connect v1 APIs. The package separates credential-specific clients and keeps group API keys out of browser runtimes by default.

## Installation

Install the current public release:

```bash
npm install @advizorconnect/sdk
```

The previous `0.1.0` package remains visible until npm deprecation permissions are resolved.

## Requirements

- Node.js `>=22`
- ESM (`import`) consumers
- A server/BFF environment for group API-key integration calls

## Public entrypoints

| Entrypoint | Factory | Credential | Intended runtime |
|------------|---------|------------|------------------|
| `@advizorconnect/sdk/integration` | `createIntegrationClient` | Group API key as `Authorization: Bearer ...` | Server/BFF only |
| `@advizorconnect/sdk/owner` | `createOwnerClient` | Supabase owner access token from `getAccessToken()` per request | Owner-authenticated app or BFF |
| `@advizorconnect/sdk/widget` | `createWidgetClient` | Optional short-lived widget token as `X-AC-Widget-Token`; public routes need no token | Browser/widget-safe |
| `@advizorconnect/sdk` | `createV1Client` | Legacy API-key option | Deprecated compatibility surface for one release |

Group API keys are server-side credentials. Known browser and worker runtimes fail closed for API-key clients unless the explicitly unsafe test-only override is supplied.

## Integration client (server/BFF)

```typescript
import { createIntegrationClient } from '@advizorconnect/sdk/integration';

const client = createIntegrationClient({
  baseUrl: 'https://api.advizor-connect.com',
  apiKey: process.env.ADVIZOR_CONNECT_API_KEY!,
});

const { advisors } = await client.listGroupAdvisors({
  groupId: 'your-group-id',
  onlineStatus: 'available',
});

const { session } = await client.createSession({
  groupId: 'your-group-id',
  advisorId: advisors[0].id,
  callerPhone: '+15551234567',
  idempotencyKey: crypto.randomUUID(),
});

console.log('Session created:', session.id, session.status);
```

## Owner client

```typescript
import { createOwnerClient } from '@advizorconnect/sdk/owner';

const ownerClient = createOwnerClient({
  baseUrl: 'https://api.advizor-connect.com',
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});

const keys = await ownerClient.listApiKeys({ groupId: 'your-group-id' });
```

`getAccessToken()` is called for every SDK request and must provide a Supabase owner/admin user JWT. Owner clients do not accept group API keys.

## Widget/public client

```typescript
import { createWidgetClient } from '@advizorconnect/sdk/widget';

const widgetClient = createWidgetClient({
  baseUrl: 'https://api.advizor-connect.com',
  getWidgetToken: async () => widgetTokenFromYourEmbedFlow,
});

const config = await widgetClient.getWidgetConfig({ groupId: 'your-group-id' });
```

The widget client exposes browser-safe widget-token and public routes only. It does not expose owner/admin methods or group API-key integration methods.

## Retry helper

```typescript
import { withRetry } from '@advizorconnect/sdk';

const session = await withRetry(
  () => client.createSession({
    groupId: 'your-group-id',
    advisorId: 'advisor-id',
    callerPhone: '+15551234567',
    idempotencyKey: crypto.randomUUID(),
  }),
  { maxAttempts: 3, backoffMs: 500 },
);
```

`withRetry` retries only `V1SdkError` instances marked `retryable === true` and respects SDK operation metadata. Read/idempotent operations can retry when opted in; unsafe side-effecting SDK operations do not retry automatically unless the SDK operation is documented as idempotent.

## Error handling

All API, timeout, network, and response-body transport failures are normalized as `V1SdkError` where possible:

```typescript
import { V1SdkError } from '@advizorconnect/sdk';

try {
  await client.getSession({ sessionId: 'session-id' });
} catch (err) {
  if (err instanceof V1SdkError) {
    console.error('Status:', err.status);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Request ID:', err.requestId);
    console.error('Retryable:', err.retryable);
    console.error('Operation:', err.operationId);
    console.error('Cause:', err.cause);
  }
}
```

## TypeScript types

Root exports include shared errors/retry helpers and generated OpenAPI types:

```typescript
import type {
  IntegrationAdvisor,
  SessionEnvelope,
  ApiSession,
  LedgerEvent,
  ApiKeyRecord,
  InviteRecord,
  paths,
  components,
  operations,
} from '@advizorconnect/sdk';
```

Subpath exports include factory-specific option and client types:

```typescript
import type { IntegrationClientOptions } from '@advizorconnect/sdk/integration';
import type { OwnerClientOptions } from '@advizorconnect/sdk/owner';
import type { WidgetClientOptions } from '@advizorconnect/sdk/widget';
```

## Release status boundaries

A successful SDK build or packed-package smoke test means the npm package artifact is locally consumable. It does not by itself mean that npm publish happened, that `0.1.0` was deprecated, that staging platform smoke passed, or that the overall public platform is production-ready. Those are separate gates owned by the release operator and the broader platform readiness work.

## License

Proprietary / unlicensed for public redistribution. See `package.json` (`UNLICENSED`) and repository terms for the current package license status.
