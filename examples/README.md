# Examples

This directory contains example Backstage catalog files demonstrating how to use the Cloudflare plugin.

## Files

- **component-worker.yaml** - Component using Cloudflare Workers, KV, D1, and Queues
- **component-pages.yaml** - Component using Cloudflare Pages and R2
- **component-ai.yaml** - Component using AI Gateway, Vectorize, and AI Search
- **system.yaml** - System and domain grouping Cloudflare components

## Usage

### 1. Import into Backstage Catalog

Add to your `app-config.yaml`:

```yaml
catalog:
  locations:
    - type: url
      target: https://github.com/your-org/cloudflare-backstage.io/blob/main/examples/component-worker.yaml
    - type: url
      target: https://github.com/your-org/cloudflare-backstage.io/blob/main/examples/component-pages.yaml
    - type: url
      target: https://github.com/your-org/cloudflare-backstage.io/blob/main/examples/system.yaml
```

Or import via Backstage UI:
1. Navigate to "Create..."
2. Choose "Register Existing Component"
3. Enter the URL to the example file

### 2. Customize for Your Resources

Replace the example resource names with your actual Cloudflare resource names:

```yaml
metadata:
  annotations:
    # Replace with your actual Worker name
    cloudflare.com/worker: your-worker-name
    
    # Replace with your actual Pages project name
    cloudflare.com/pages: your-pages-project
```

### 3. View in Backstage

1. Navigate to your component in the Backstage catalog
2. Click the "Cloudflare" tab to see:
   - Deployment history with commit SHA and CI run URLs
   - Resource configuration
   - Lifecycle rules (for R2 buckets)
   - Related Cloudflare resources

## Supported Annotations

### Workers
```yaml
cloudflare.com/worker: worker-name
```

### Pages
```yaml
cloudflare.com/pages: project-name
```

### R2
```yaml
cloudflare.com/r2: bucket-name
```

### D1
```yaml
cloudflare.com/d1: database-uuid
```

### KV
```yaml
cloudflare.com/kv: namespace-id
```

### Queues
```yaml
cloudflare.com/queue: queue-name
```

### AI Gateway
```yaml
cloudflare.com/ai-gateway: gateway-name
```

### Vectorize
```yaml
cloudflare.com/vectorize: index-name
```

### AI Search
```yaml
cloudflare.com/ai-search: index-name
```

### Workflows
```yaml
cloudflare.com/workflow: workflow-name
```

### Durable Objects
```yaml
cloudflare.com/durable-object: class-name
```

### Hyperdrive
```yaml
cloudflare.com/hyperdrive: config-name
```

## Dependencies

The Cloudflare entity provider automatically creates `Resource` entities for discovered Cloudflare resources. You can reference these in your component's `dependsOn` field:

```yaml
spec:
  dependsOn:
    - resource:default/cf-worker-your-worker
    - resource:default/cf-pages-your-project
    - resource:default/cf-r2-your-bucket
```

Resource names follow the pattern:
- Workers: `cf-worker-{script-name}`
- Pages: `cf-pages-{project-name}`
- R2: `cf-r2-{bucket-name}`
- D1: `cf-d1-{database-uuid}`
- KV: `cf-kv-{namespace-id}`
- Queues: `cf-queue-{queue-name}`
- etc.

## Real-World Example

Here's a complete example for a full-stack application:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-app
  annotations:
    # Frontend
    cloudflare.com/pages: my-app-web
    
    # Backend API
    cloudflare.com/worker: my-app-api
    
    # Data storage
    cloudflare.com/d1: my-app-database
    cloudflare.com/kv: my-app-cache
    cloudflare.com/r2: my-app-assets
    
    # Async processing
    cloudflare.com/queue: my-app-jobs
    cloudflare.com/workflow: my-app-etl
    
    # AI features
    cloudflare.com/ai-gateway: my-app-ai
    cloudflare.com/vectorize: my-app-embeddings
spec:
  type: service
  owner: my-team
  system: my-system
```
