# @internal/plugin-cloudflare

Frontend plugin for visualizing Cloudflare resources in Backstage.

## Features

- **Entity Tab** - Shows linked Cloudflare resources for each component
- **Overview Page** - Global dashboard of all Cloudflare resources
- **Deployment History** - Worker and Pages deployment history with CI provenance
- **Lifecycle Visualization** - R2 bucket lifecycle rules

## Installation

1. Add the plugin to your frontend app:

```typescript
// packages/app/src/App.tsx
import { CloudflareOverviewPage, EntityCloudflareContent } from '@internal/plugin-cloudflare';

// In your app routes
<Route path="/cloudflare" element={<CloudflareOverviewPage />} />

// In your entity page
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

2. Add to your navigation:

```typescript
// packages/app/src/components/Root/Root.tsx
import CloudIcon from '@material-ui/icons/Cloud';

<SidebarItem icon={CloudIcon} to="cloudflare" text="Cloudflare" />
```

## Usage

### Link Components to Cloudflare Resources

Add annotations to your `catalog-info.yaml`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Link to a Worker
    cloudflare.com/worker: my-api-worker
    
    # Link to a Pages project
    cloudflare.com/pages: my-web-app
    
    # Link to an R2 bucket
    cloudflare.com/r2: my-prod-artifacts
    
    # Link to a D1 database
    cloudflare.com/d1: my-core-db
    
    # Link to a KV namespace
    cloudflare.com/kv: my-cache
spec:
  type: service
  owner: platform-team
```

### Entity Tab

The Cloudflare tab on entity pages shows:

- **Worker Deployments** - Recent deployments with commit SHA and CI run URLs
- **Pages Deployments** - Recent deployments with branch, commit, and status
- **R2 Lifecycle Rules** - Configured lifecycle rules for buckets

### Overview Page

The overview page (`/cloudflare`) shows:

- Resource counts (R2, D1, KV, Queues, Workflows)
- Data retention summary
- Database inventory

## API Integration

The plugin uses the Cloudflare backend API:

```typescript
import { useApi } from '@backstage/core-plugin-api';
import { cloudflareApiRef } from '@internal/plugin-cloudflare';

const api = useApi(cloudflareApiRef);

// Fetch deployments
const deployments = await api.getWorkerDeployments('my-worker');

// Fetch audit logs
const logs = await api.getAuditLogs({
  since: '2025-10-01T00:00:00Z',
});
```

## Customization

### Custom Components

You can build custom components using the Cloudflare API:

```tsx
import React from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { cloudflareApiRef } from '@internal/plugin-cloudflare';
import { InfoCard, Progress } from '@backstage/core-components';
import { useAsync } from 'react-use';

export const MyCustomCard = () => {
  const api = useApi(cloudflareApiRef);
  
  const { value, loading } = useAsync(async () => {
    return api.getQueues();
  }, []);

  if (loading) return <Progress />;

  return (
    <InfoCard title="My Queues">
      {/* Render your data */}
    </InfoCard>
  );
};
```

## Screenshots

(Screenshots would go here showing the entity tab and overview page)

## Next Steps

- Add Tech Insights scorecards for SOC 2 compliance
- Add more detailed metrics visualizations
- Add charts and graphs for deployment frequency
- Add alerting for missing lifecycle rules
