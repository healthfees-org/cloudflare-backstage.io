# @internal/cloudflare-entity-provider

Backstage Entity Provider that syncs Cloudflare resources into the Backstage catalog.

## Features

- **Automatic Discovery** - Periodically discovers all Cloudflare resources
- **Full Coverage** - Supports Workers, Pages, R2, D1, KV, Queues, AI services, and more
- **Configurable** - Fine-grained control over what gets imported
- **Deployment Metadata** - Captures commit SHA and CI run URLs for provenance

## Installation

Add to your Backstage backend:

```typescript
// packages/backend/src/index.ts
import { CloudflareEntityProvider } from '@internal/cloudflare-entity-provider';

export default async function createBackend() {
  const backend = createBackend();
  
  // ... other code
  
  backend.add(import('@backstage/plugin-catalog-backend/alpha'));
  
  // Add Cloudflare entity provider
  backend.add({
    id: 'cloudflare',
    async init({ config, logger, scheduler }) {
      const provider = CloudflareEntityProvider.fromConfig(config, {
        logger,
        scheduler,
      });
      
      const catalogApi = await backend.get('catalogApi');
      await catalogApi.addEntityProvider(provider);
    },
  });
}
```

## Configuration

Add to your `app-config.yaml`:

```yaml
cloudflare:
  accountId: ${CLOUDFLARE_ACCOUNT_ID}
  apiToken: ${CLOUDFLARE_API_TOKEN}
  
  entityProvider:
    # Schedule for resource discovery
    schedule:
      frequency: { minutes: 10 }
      timeout: { minutes: 2 }
    
    # Control what gets imported
    import:
      workers: true
      pages: true
      queues: true
      kv: true
      d1: true
      r2: true
      aiGateway: true
      vectorize: true
      analyticsEngine: true
      secretsStore: true
      hyperdrive: true
      containers: true
      workflows: true
      durableObjects: true
      aiSearch: true
      browserRendering: true
    
    # Default values for discovered entities
    defaultOwner: platform-team
    defaultSystem: cloudflare-prod
```

## Resource Types

The provider creates `Resource` entities with the following types:

- `cloudflare-worker` - Workers scripts
- `cloudflare-pages` - Pages projects
- `cloudflare-r2` - R2 buckets
- `cloudflare-d1` - D1 databases
- `cloudflare-kv` - KV namespaces
- `cloudflare-queue` - Queues
- `cloudflare-ai-gateway` - AI Gateway configurations
- `cloudflare-vectorize` - Vectorize indexes
- `cloudflare-workflow` - Workflows
- `cloudflare-durable-object` - Durable Object classes
- `cloudflare-ai-search` - AI Search indexes

## Entity Metadata

Each discovered resource includes:

- **Name** - Sanitized resource identifier
- **Description** - Human-readable description
- **Tags** - `['cloudflare', '<service-type>']`
- **Annotations** - `cloudflare.com/account-id`
- **Owner** - Configured default or 'unknown'
- **System** - Configured default (optional)
- **Parameters** - Service-specific metadata

### Example: Worker Entity

```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-worker-my-api
  description: Cloudflare Worker: my-api
  tags:
    - cloudflare
    - worker
  annotations:
    cloudflare.com/account-id: abc123...
spec:
  type: cloudflare-worker
  owner: platform-team
  system: cloudflare-prod
  parameters:
    accountId: abc123...
    scriptName: my-api
    usageModel: bundled
    lastDeployment:
      id: deploy-123
      createdOn: 2025-10-29T12:00:00Z
      commitSha: 1a2b3c4d
      ciRunUrl: https://github.com/org/repo/actions/runs/12345
```

## Linking Components to Resources

Link your Backstage components to Cloudflare resources using annotations:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    cloudflare.com/worker: my-api
    cloudflare.com/pages: my-web
    cloudflare.com/r2: my-bucket
spec:
  type: service
  owner: platform-team
```

The entity provider will automatically create `dependsOn` relations between your components and the discovered Cloudflare resources.
