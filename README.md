# Cloudflare Backstage Plugin

A comprehensive Backstage plugin for managing and monitoring Cloudflare resources with SOC 2 compliance features.

## Overview

This plugin provides read-only visibility into your Cloudflare infrastructure directly within Backstage, with features designed for:

- **Change Management** - Track Worker and Pages deployments with commit SHA and CI run URLs
- **Access Control Hygiene** - View Zero Trust audit logs and user authentications
- **Data Retention** - Monitor R2 bucket lifecycle rules and compliance
- **Resource Discovery** - Automatic catalog integration for all Cloudflare services

## Features

### Supported Cloudflare Services

- ✅ **Workers** - Scripts and deployments with provenance tracking
- ✅ **Pages** - Projects and deployments with commit history
- ✅ **R2** - Buckets and lifecycle rules with evidence exports
- ✅ **D1** - SQL databases with metadata
- ✅ **KV** - Key-value namespaces
- ✅ **Queues** - Message queues with producer/consumer tracking
- ✅ **Zero Trust** - Access audit logs and user authentication
- ✅ **AI Gateway** - AI request routing and configuration
- ✅ **Vectorize** - Vector indexes for embeddings
- ✅ **Analytics Engine** - Event dataset management
- ✅ **Secrets Store** - Secret management (metadata only)
- ✅ **Hyperdrive** - Database connection acceleration
- ✅ **Workflows** - Workflow orchestration
- ✅ **Durable Objects** - Stateful object classes
- ✅ **AI Search** - AI-powered search indexes
- ✅ **Browser Rendering** - Headless browser services

### Key Features

- **Automatic Discovery** - Entity provider syncs all resources to Backstage catalog
- **Deployment Provenance** - Capture and display commit SHA and CI run URLs
- **Evidence Exports** - JSON snapshots with SHA256 hashes for audit trails
- **SOC 2 Ready** - Built-in compliance features and evidence collection
- **Response Caching** - Protection against API rate limits
- **Read-only Safety** - All operations are GET-only for security

## Architecture

```
cloudflare-backstage.io/
├── packages/
│   ├── cloudflare-client/           # Typed API clients for all Cloudflare services
│   └── cloudflare-entity-provider/  # Catalog integration and resource discovery
├── plugins/
│   ├── cloudflare/                   # Frontend UI (entity tabs + dashboards)
│   └── cloudflare-backend/           # Backend API routers and endpoints
└── docs/                             # Implementation specs and blueprints
```

## Quick Start

### 1. Prerequisites

- Backstage v1.20.0 or newer
- Cloudflare account with API token
- Node.js 18+ and Yarn

### 2. Installation

Add the packages to your Backstage workspace:

```bash
# Add to your Backstage app
cd your-backstage-app
yarn add @internal/cloudflare-client @internal/cloudflare-entity-provider \
         @internal/plugin-cloudflare @internal/plugin-cloudflare-backend
```

### 3. Backend Setup

Add the backend plugin and entity provider:

```typescript
// packages/backend/src/index.ts
import { createRouter as createCloudflareRouter } from '@internal/plugin-cloudflare-backend';
import { CloudflareEntityProvider } from '@internal/cloudflare-entity-provider';

export default async function createBackend() {
  const backend = createBackend();

  // Add Cloudflare API router
  backend.add({
    id: 'cloudflare',
    async init({ config, logger }) {
      return createCloudflareRouter({ config, logger });
    },
  });

  // Add Cloudflare entity provider
  backend.add(import('@backstage/plugin-catalog-backend/alpha'));
  backend.add({
    id: 'cloudflare-catalog',
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

### 4. Frontend Setup

Add the frontend plugin:

```typescript
// packages/app/src/App.tsx
import { CloudflareOverviewPage, EntityCloudflareContent } from '@internal/plugin-cloudflare';

// Add overview page route
<Route path="/cloudflare" element={<CloudflareOverviewPage />} />

// Add entity tab
import { EntityLayout } from '@backstage/plugin-catalog';

const serviceEntityPage = (
  <EntityLayout>
    {/* ... other tabs */}
    <EntityLayout.Route path="/cloudflare" title="Cloudflare">
      <EntityCloudflareContent />
    </EntityLayout.Route>
  </EntityLayout>
);
```

### 5. Configuration

Add to your `app-config.yaml`:

```yaml
cloudflare:
  # Required: Account ID and API Token
  accountId: ${CLOUDFLARE_ACCOUNT_ID}
  apiToken: ${CLOUDFLARE_API_TOKEN}
  
  # Optional: Fetch configuration
  fetch:
    timeoutMs: 15000
    maxRetries: 3
    backoff: jitter
  
  # Optional: Entity provider configuration
  entityProvider:
    schedule:
      frequency: { minutes: 10 }
      timeout: { minutes: 2 }
    
    import:
      workers: true
      pages: true
      queues: true
      kv: true
      d1: true
      r2: true
      aiGateway: true
      vectorize: true
      workflows: true
      durableObjects: true
      aiSearch: true
    
    defaultOwner: platform-team
    defaultSystem: cloudflare-prod
```

### 6. Create API Token

Create a Cloudflare API token with these permissions:

- Account Settings: Read
- Workers Scripts: Read
- Workers KV Storage: Read
- Workers R2 Storage: Read
- D1: Read
- Zero Trust: Read
- Analytics: Read

## Usage

### Linking Components to Resources

Add annotations to your component's `catalog-info.yaml`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    cloudflare.com/worker: my-api
    cloudflare.com/pages: my-web
    cloudflare.com/r2: my-bucket
    cloudflare.com/d1: my-database
    cloudflare.com/kv: my-cache
spec:
  type: service
  owner: platform-team
```

### Viewing Resources

1. **Entity Tab** - Navigate to any component with Cloudflare annotations to see linked resources, deployments, and configuration
2. **Overview Page** - Visit `/cloudflare` to see a global dashboard of all resources
3. **Catalog** - All Cloudflare resources are automatically imported as `Resource` entities

### Evidence Exports

Export compliance evidence:

```bash
# R2 lifecycle evidence
curl http://localhost:7007/api/cloudflare/v1/r2/my-bucket/lifecycle/export?download=json

# Zero Trust audit log evidence
curl http://localhost:7007/api/cloudflare/v1/zero-trust/export/audit?download=json&since=2025-10-01T00:00:00Z
```

## API Endpoints

All endpoints are mounted at `/api/cloudflare` and documented in the [backend README](./plugins/cloudflare-backend/README.md).

## Development

### Building

```bash
yarn install
yarn build
```

### Linting

```bash
yarn lint
```

### Testing

```bash
yarn test
```

## SOC 2 Compliance Features

This plugin is designed with SOC 2 compliance in mind:

### Change Management
- Worker/Pages deployments show commit SHA and CI run URL
- Deployment history with timestamps
- Immutable evidence exports with SHA256 hashes

### Access Control
- Zero Trust audit log visibility
- User authentication tracking
- API token scope recommendations (no Global API Key)

### Data Retention
- R2 bucket lifecycle rules visualization
- Evidence exports for regulated data
- KV namespace TTL guidance

### Coverage
- Automatic discovery of all Cloudflare resources
- Catalog relations between components and resources
- Tech Insights scorecards (future enhancement)

## Documentation

- [Implementation Specification](./docs/implementation_spec.md) - Detailed technical spec
- [Blueprint](./docs/blueprint.md) - High-level design
- [Scaffolder Templates](./docs/scaffolder.md) - Provisioning templates (future)

## Package Documentation

- [Cloudflare Client](./packages/cloudflare-client/README.md)
- [Entity Provider](./packages/cloudflare-entity-provider/README.md)
- [Backend Plugin](./plugins/cloudflare-backend/README.md)
- [Frontend Plugin](./plugins/cloudflare/README.md)

## Contributing

This plugin follows the Backstage plugin development guidelines. Contributions are welcome!

## License

Apache-2.0

## Support

For issues and questions, please open a GitHub issue.
