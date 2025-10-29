# @internal/cloudflare-client

Typed TypeScript client library for Cloudflare APIs used in the Backstage plugin.

## Features

- **Type-safe** - Full TypeScript coverage with detailed type definitions
- **Comprehensive** - Covers all Cloudflare services: Workers, Pages, R2, D1, KV, Queues, AI Gateway, Vectorize, and more
- **Resilient** - Built-in retry logic with exponential backoff and jitter
- **Evidence-friendly** - Snapshot exporters for audit trails

## Usage

```typescript
import { CloudflareClient } from '@internal/cloudflare-client';

const client = new CloudflareClient({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  timeout: 15000,
  maxRetries: 3,
});

// Workers
const scripts = await client.workers.listScripts();
const deployment = await client.workers.getLatestDeployment('my-worker');

// Pages
const projects = await client.pages.listProjects();
const deployments = await client.pages.listDeployments('my-project');

// R2
const buckets = await client.r2.listBuckets();
const lifecycle = await client.r2.getLifecycle('my-bucket');
const evidence = await client.r2.exportLifecycle('my-bucket');

// D1
const databases = await client.d1.listDatabases();

// KV
const namespaces = await client.kv.listNamespaces();
const keys = await client.kv.listKeys('namespace-id');

// Zero Trust
const auditLogs = await client.zeroTrust.getAuditLogs({
  since: '2025-10-01T00:00:00Z',
  before: '2025-10-29T00:00:00Z',
});
const auditSnapshot = await client.zeroTrust.exportAuditLogs();
```

## API Clients

- `workers` - Workers scripts and deployments
- `pages` - Pages projects and deployments  
- `r2` - R2 buckets and lifecycle rules
- `d1` - D1 databases
- `kv` - KV namespaces and keys
- `queues` - Queues
- `aiGateway` - AI Gateway configurations
- `vectorize` - Vectorize indexes
- `analyticsEngine` - Analytics Engine datasets
- `secretsStore` - Secrets Store (metadata only)
- `hyperdrive` - Hyperdrive configurations
- `containers` - Container services
- `workflows` - Workflows and runs
- `durableObjects` - Durable Objects classes
- `aiSearch` - AI Search indexes
- `browserRendering` - Browser Rendering quotas
- `zeroTrust` - Zero Trust audit logs and users

## Configuration

All clients accept a `CloudflareClientConfig`:

```typescript
interface CloudflareClientConfig {
  accountId: string;      // Cloudflare account ID
  apiToken: string;       // API token with appropriate scopes
  baseUrl?: string;       // Default: https://api.cloudflare.com/client/v4
  timeout?: number;       // Request timeout in ms (default: 15000)
  maxRetries?: number;    // Max retry attempts (default: 3)
}
```

## Error Handling

All API calls include automatic retry logic with exponential backoff. Failed requests will retry up to `maxRetries` times before throwing an error.

## Evidence Exports

Some clients support evidence exports for SOC 2 compliance:

```typescript
// R2 lifecycle evidence
const r2Evidence = await client.r2.exportLifecycle('bucket-name');
// { data: {...}, hash: 'sha256:...', timestamp: '2025-10-29T...' }

// Zero Trust audit log evidence
const ztEvidence = await client.zeroTrust.exportAuditLogs({
  since: '2025-10-01T00:00:00Z',
});
// { data: [...], hash: 'sha256:...', timestamp: '2025-10-29T...' }
```
