# @internal/plugin-cloudflare-backend

Backend plugin for the Cloudflare Backstage plugin. Provides read-only REST API endpoints for all Cloudflare services.

## Features

- **Comprehensive API Coverage** - Endpoints for Workers, Pages, R2, D1, KV, Queues, AI services, and more
- **Response Caching** - Built-in caching to protect against rate limits
- **Evidence Exports** - JSON snapshot exports with hashes for SOC 2 compliance
- **Read-only Safety** - All endpoints are GET-only for security

## Installation

Add to your Backstage backend:

```typescript
// packages/backend/src/index.ts
import { createRouter as createCloudflareRouter } from '@internal/plugin-cloudflare-backend';

export default async function createBackend() {
  // ... other setup

  const cloudflareEnv = useHotMemoize(module, () => createEnv('cloudflare'));

  apiRouter.use(
    '/cloudflare',
    await createCloudflareRouter({
      logger: cloudflareEnv.logger,
      config: cloudflareEnv.config,
    }),
  );
}
```

## Configuration

Add to `app-config.yaml`:

```yaml
cloudflare:
  accountId: ${CLOUDFLARE_ACCOUNT_ID}
  apiToken: ${CLOUDFLARE_API_TOKEN}
  fetch:
    timeoutMs: 15000
    maxRetries: 3
    backoff: jitter
```

## API Endpoints

All endpoints are mounted under `/api/cloudflare`.

### Workers & Pages

- `GET /v1/workers/:script/deployments` - List Worker deployments
- `GET /v1/pages/:project/deployments` - List Pages deployments

### Zero Trust

- `GET /v1/zero-trust/users` - Recent user authentications
- `GET /v1/zero-trust/access/audit` - Access audit logs
- `GET /v1/zero-trust/export/audit?download=json` - Export audit logs

### Data Services

- `GET /v1/r2/buckets` - List R2 buckets
- `GET /v1/r2/:bucket/lifecycle` - Get lifecycle rules
- `GET /v1/r2/:bucket/lifecycle/export?download=json` - Export lifecycle evidence
- `GET /v1/d1/databases` - List D1 databases
- `GET /v1/d1/:db/metadata` - Get database metadata
- `GET /v1/kv/namespaces` - List KV namespaces
- `GET /v1/kv/:namespace/keys?limit=100&prefix=` - List keys
- `GET /v1/kv/:namespace/sample?limit=50` - Sample keys
- `GET /v1/queues` - List queues
- `GET /v1/queues/:name/metrics` - Queue metrics

### AI Services

- `GET /v1/ai-gateway/:name/metrics` - AI Gateway metrics
- `GET /v1/ai-gateway/:name/config` - AI Gateway configuration
- `GET /v1/vectorize/indexes` - List Vectorize indexes
- `GET /v1/vectorize/:index/stats` - Index statistics
- `GET /v1/analytics-engine/datasets` - List Analytics Engine datasets
- `GET /v1/ai-search/indexes` - List AI Search indexes
- `GET /v1/ai-search/:index/health` - Index health status

### Other Services

- `GET /v1/secrets-store/stores` - List secret stores (metadata only)
- `GET /v1/secrets-store/:store/metadata` - Store metadata
- `GET /v1/hyperdrive/configs` - List Hyperdrive configs
- `GET /v1/containers/services` - List container services
- `GET /v1/workflows` - List workflows
- `GET /v1/workflows/:name/runs?from=&to=` - Workflow runs
- `GET /v1/durable-objects/classes` - List Durable Object classes
- `GET /v1/browser-rendering/quotas` - Browser Rendering quotas

## Caching

Responses are cached for 60-120 seconds to protect against rate limits. Cache is automatically invalidated based on TTL.

## Evidence Exports

Some endpoints support evidence exports with hash and timestamp:

```bash
curl http://localhost:7007/api/cloudflare/v1/r2/my-bucket/lifecycle/export?download=json
```

Returns:

```json
{
  "data": { ... },
  "hash": "sha256:...",
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

## Security

- All endpoints are **read-only** (GET only)
- Secrets Store endpoints return **metadata only** - never secret values
- Redaction rules can be applied via permissions framework (future)

## Example Response

```bash
curl http://localhost:7007/api/cloudflare/v1/workers/my-api/deployments
```

```json
[
  {
    "id": "deploy-123",
    "version": "v1",
    "createdOn": "2025-10-29T12:00:00Z",
    "env": "production",
    "commitSha": "1a2b3c4d",
    "ciRunUrl": "https://github.com/org/repo/actions/runs/12345",
    "status": "active"
  }
]
```
