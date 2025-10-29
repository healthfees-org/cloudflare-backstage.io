# Cloudflare Backstage Plugin — Implementation Spec (v2)
*(Generated on 2025-10-29)*

> Scope: **Cloudflare-only** plugin set for Backstage, covering: Workers, Zero Trust, Queues, KV, D1, R2, AI Gateway, Vectorize, Analytics Engine, Secrets Store, Hyperdrive, Containers, Workflows, Durable Objects, AI Search, and Browser Rendering. This spec defines package layout, entity modeling, backend routes & permissions, SOC 2 scorecards/evidence, CI provenance wiring, and phased delivery.

---

## 0) Design Principles
- **Read-only first** for safety (SOC 2 evidence, posture, inventory). Add write actions later with approvals.
- **Backstage-native**: Catalog relations, Tech Insights Scorecards, Permissions framework, TechDocs runbooks.
- **Evidence-friendly**: Deterministic JSON snapshot exporters for audit trails (hash + timestamp).

---

## 1) Packages & High-Level Architecture

**Packages**
- `plugins/cloudflare` — Frontend UI (entity tabs + global posture dashboards)
- `plugins/cloudflare-backend` — Backend routers per product area (auth, rate limits, evidence exports)
- `packages/cloudflare-entity-provider` — Catalog _Entity Provider_ importing Cloudflare resources as `Resource` entities
- `packages/cloudflare-client` — Typed clients (thin wrappers) for Cloudflare APIs (per product area)

**Data Flow**
1. Backend authenticates via Cloudflare **API Token** (read scopes per product).
2. Schedulers periodically ingest resources -> `Resource` entities + relations.
3. Frontend renders entity tabs & global posture dashboards.
4. Tech Insights runs Scorecards on schedule; results shown on dashboards.

---

## 2) Catalog Modeling

**Entity Types**
- `Component` — your service/app repo
- `Resource` — one per Cloudflare asset type
- `System` — product-level grouping (e.g., acme-org)

**Relations**
- `Component` **DEPENDS_ON** Cloudflare `Resource` entities (reverse relation computed).

**Resource Types**
- `cloudflare-worker` (Workers script)
- `cloudflare-pages`
- `cloudflare-queue`
- `cloudflare-kv`
- `cloudflare-d1`
- `cloudflare-r2`
- `cloudflare-ai-gateway`
- `cloudflare-vectorize`
- `cloudflare-analytics-engine`
- `cloudflare-secrets-store`
- `cloudflare-hyperdrive`
- `cloudflare-container`
- `cloudflare-workflow`
- `cloudflare-durable-object`
- `cloudflare-ai-search`
- `cloudflare-browser-rendering`

**Recommended Annotations on Components**
```yaml
metadata:
  annotations:
    cloudflare.com/worker: acme-api
    cloudflare.com/pages: acme-web
    cloudflare.com/queue: acme-events
    cloudflare.com/kv: acme-cache
    cloudflare.com/d1: acme-core
    cloudflare.com/r2: acme-prod-artifacts
    cloudflare.com/ai-gateway: acme-ai-gateway
    cloudflare.com/vectorize: acme-idx-main
    cloudflare.com/analytics-engine: acme-analytics
    cloudflare.com/secrets-store: acme-account-secrets
    cloudflare.com/hyperdrive: acme-hyperdrive
    cloudflare.com/container: acme-containers
    cloudflare.com/workflow: acme-etl
    cloudflare.com/durable-object: acme-session-coordinator
    cloudflare.com/ai-search: acme-site-index
    cloudflare.com/browser-rendering: acme-browser
    backstage.io/techdocs-ref: dir:./docs
```

---

## 3) Backend Routers & Endpoints (Read-only v1)

**Base Mount:** `/api/cloudflare`

### 3.1 Workers & Pages
- `GET /v1/workers/:script/deployments` — list deployments (ts, env, version, commitSha?, ciRunUrl?).
- `GET /v1/pages/:project/deployments` — list deployments (id, createdAt, branch, commitSha, status, ciRunUrl?).

### 3.2 Zero Trust (Access)
- `GET /v1/zero-trust/users` — recent user authentications (time-bounded), device/enrollment summary.
- `GET /v1/zero-trust/access/audit` — Access authentication audit logs (filters: actor, action, target, time range).
- `GET /v1/zero-trust/export/audit?download=json` — deterministic JSON snapshot export (hash + ts).

### 3.3 Queues
- `GET /v1/queues` — list queues (producers/consumers bindings where available).
- `GET /v1/queues/:name/metrics` — delivery stats (best-effort via API/metrics endpoints).

### 3.4 KV
- `GET /v1/kv/namespaces` — list namespaces.
- `GET /v1/kv/:namespace/keys` — list keys (paged) + metadata flag.
- `GET /v1/kv/:namespace/sample?limit=50` — sample keys/values (redacted rules).

### 3.5 D1
- `GET /v1/d1/databases` — list DBs (uuid, name, createdAt).
- `GET /v1/d1/:db/metadata` — size (if exposed), createdAt, last modified (if exposed).

### 3.6 R2
- `GET /v1/r2/buckets` — list buckets.
- `GET /v1/r2/:bucket/lifecycle` — lifecycle rules (evidence).
- `GET /v1/r2/:bucket/lifecycle/export?download=json` — snapshot export.

### 3.7 AI Gateway
- `GET /v1/ai-gateway/:name/metrics` — request count, latency, provider breakdown, cache hit-rate (where API exposes).
- `GET /v1/ai-gateway/:name/config` — basic policy flags (rate limits, retries, fallback enabled).

### 3.8 Vectorize
- `GET /v1/vectorize/indexes` — list indexes.
- `GET /v1/vectorize/:index/stats` — dimensions, vectors count, lastWrite, replicas (if exposed).

### 3.9 Analytics Engine
- `GET /v1/analytics-engine/datasets` — list datasets bound to Workers.
- `POST /v1/analytics-engine/:dataset/query` — pass-through read-only SQL (with allowlist).

### 3.10 Secrets Store
- `GET /v1/secrets-store/stores` — list account stores.
- `GET /v1/secrets-store/:store/metadata` — counts by type (no secret values).

### 3.11 Hyperdrive
- `GET /v1/hyperdrive/configs` — list configs (origin DB host, plan, caching flags; redact secrets).

### 3.12 Containers
- `GET /v1/containers/services` — list container-backed services and their images/tags (where exposed).
- `GET /v1/containers/:service/status` — health summary if available.

### 3.13 Workflows
- `GET /v1/workflows` — list workflows and step graphs.
- `GET /v1/workflows/:name/runs?from=&to=` — last N runs, duration, retries, terminal state.

### 3.14 Durable Objects
- `GET /v1/durable-objects/classes` — list classes/namespaces with counts.
- `GET /v1/durable-objects/:class/metrics` — alarms, storage footprint, WebSocket usage (if available).

### 3.15 AI Search
- `GET /v1/ai-search/indexes` — list indexes; data connectors, last crawl time.
- `GET /v1/ai-search/:index/health` — indexing status, document count.

### 3.16 Browser Rendering
- `GET /v1/browser-rendering/pools` — capacity/usage summary (if exposed).
- `GET /v1/browser-rendering/quotas` — quotas per account/zone.

**Implementation Notes**
- All endpoints default to **masked** views; sensitive fields appear only for authorized roles.
- Add response caching (30–120s) to protect rate limits.
- Evidence exporters create **immutable JSON** with SHA256 + timestamp.

---

## 4) Entity Provider (Ingestion)

**Scheduler**: default every 10 minutes (configurable).

**Mappings & Examples**

**Workers (Resource)**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-worker-acme-api
  description: Cloudflare Worker for API routing
  tags: [cloudflare, worker, prod]
spec:
  type: cloudflare-worker
  owner: platform-team
  system: acme-org
  parameters:
    accountId: <cf_account_id>
    scriptName: acme-api
    lastDeployment:
      version: 2025-10-20T18:22:31Z
      commitSha: 1a2b3c4d
      ciRunUrl: https://github.com/HealthFees/.../runs/12345678
```

**Zero Trust Access (Resource)**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-zt-access
  description: Zero Trust Access posture for protected apps
  tags: [cloudflare, zero-trust, access]
spec:
  type: cloudflare-zero-trust
  owner: security-team
  system: acme-org
  parameters:
    authProviders: [okta, github]
    policyCount: 12
    lastAuditEvent: 2025-10-28T19:02:00Z
```

**Queues**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-queue-acme-events
  description: Primary events queue
  tags: [cloudflare, queues]
spec:
  type: cloudflare-queue
  owner: platform-team
  system: acme-org
  parameters:
    producers: [component:default/acme-api]
    consumers: [component:default/acme-worker-consumer]
```

**KV**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-kv-acme-cache
  description: KV namespace for request cache
  tags: [cloudflare, kv]
spec:
  type: cloudflare-kv
  owner: platform-team
  system: acme-org
  parameters:
    namespaceId: <uuid>
    keysApprox: 125000
```

**D1**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-d1-acme-core
  description: D1 database for app config
  tags: [cloudflare, d1]
spec:
  type: cloudflare-d1
  owner: platform-team
  system: acme-org
  parameters:
    uuid: <uuid>
    name: acme-core
    createdAt: 2025-09-18T12:44:19Z
```

**R2**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-r2-acme-prod-artifacts
  description: R2 bucket for artifacts and evidence
  tags: [cloudflare, r2, retention]
spec:
  type: cloudflare-r2
  owner: data-team
  system: acme-org
  parameters:
    bucketName: acme-prod-artifacts
    lifecycle:
      rules:
        - id: retain-180-days
          status: Enabled
          filter: { prefix: "" }
          transitions:
            - { days: 30, storageClass: Standard-IA }
          expiration: { days: 180 }
```

**AI Gateway**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-ai-gateway
  description: Central gateway for AI requests
  tags: [cloudflare, ai-gateway]
spec:
  type: cloudflare-ai-gateway
  owner: platform-team
  system: acme-org
  parameters:
    providers: [openai, anthropic]
    caching: enabled
    retries: enabled
```

**Vectorize**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-vectorize-acme-idx
  description: Vectorize index for site content embeddings
  tags: [cloudflare, vectorize, ai]
spec:
  type: cloudflare-vectorize
  owner: ai-team
  system: acme-org
  parameters:
    indexName: acme-idx
    dimensions: 1536
```

**Analytics Engine**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-analytics-engine-acme
  description: Workers Analytics Engine dataset for events
  tags: [cloudflare, analytics-engine]
spec:
  type: cloudflare-analytics-engine-dataset
  owner: data-team
  system: acme-org
  parameters:
    dataset: acme_analytics
```

**Secrets Store**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-secrets-store
  description: Account-wide secrets store
  tags: [cloudflare, secrets]
spec:
  type: cloudflare-secrets-store
  owner: security-team
  system: acme-org
  parameters:
    stores: 1
```

**Hyperdrive**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-hyperdrive
  description: Hyperdrive config for regional DB acceleration
  tags: [cloudflare, hyperdrive]
spec:
  type: cloudflare-hyperdrive-config
  owner: platform-team
  system: acme-org
  parameters:
    originDb: postgres://prod-db
    caching: enabled
```

**Containers**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-containers-acme
  description: Serverless containers backing select endpoints
  tags: [cloudflare, containers]
spec:
  type: cloudflare-container-service
  owner: platform-team
  system: acme-org
  parameters:
    images: ["registry/acme-converter:2025-10-25"]
```

**Workflows**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-workflow-etl
  description: Workflow for ETL pipeline
  tags: [cloudflare, workflows]
spec:
  type: cloudflare-workflow
  owner: data-team
  system: acme-org
  parameters:
    steps: 6
    retryPolicy: exponential
```

**Durable Objects**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-do-session
  description: Durable Object for session coordination
  tags: [cloudflare, durable-objects]
spec:
  type: cloudflare-durable-object
  owner: platform-team
  system: acme-org
  parameters:
    class: SessionCoordinator
```

**AI Search**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-ai-search
  description: AI Search index of acme-org.org
  tags: [cloudflare, ai-search]
spec:
  type: cloudflare-ai-search
  owner: ai-team
  system: acme-org
  parameters:
    connectors: [website]
    lastCrawlAt: 2025-10-28T12:00:00Z
```

**Browser Rendering**
```yaml
apiVersion: backstage.io/v1alpha1
kind: Resource
metadata:
  name: cf-browser-rendering
  description: Headless browser pool for capture/render
  tags: [cloudflare, browser-rendering]
spec:
  type: cloudflare-browser-rendering
  owner: platform-team
  system: acme-org
  parameters:
    usageWindow: 24h
```

---

## 5) Permissions & Security

**Permission IDs**
- `cloudflare.read.*` per product area (e.g., `cloudflare.read.workers`, `cloudflare.read.kv`, ...)
- `cloudflare.export.evidence` for snapshot download
- `cloudflare.read.secretsstore.meta` (metadata only)

**Policy Matrix (suggested)**
| Group              | Workers | Pages | ZT | Queues | KV | D1 | R2 | AI GW | Vec | AE | Secrets | Hyper | Cont | Flows | DO | AISearch | Browser | Evidence |
|-------------------|:------:|:----:|:--:|:-----:|:--:|:--:|:--:|:----:|:---:|:--:|:------:|:----:|:----:|:----:|:--:|:------:|:------:|:-------:|
| `group:security`  |  ✓     |  ✓   | ✓  |  ✓    | ✓  | ✓  | ✓  |  ✓   |  ✓  | ✓  | meta   | ✓    | ✓    | ✓    | ✓  |  ✓     |  ✓     | ✓       |
| `group:platform`  |  ✓     |  ✓   | ✓  |  ✓    | ✓  | ✓  | ✓  |  ✓   |  ✓  | ✓  | meta   | ✓    | ✓    | ✓    | ✓  |  ✓     |  ✓     | ✓       |
| `group:engineering`| ✓     |  ✓   | —  |  ✓    | ✓  | ✓  | ✓  |  ✓   |  ✓  | ✓  | —      | ✓    | ✓    | ✓    | ✓  |  ✓     |  ✓     | —       |
| `group:readers`   |  ✓     |  ✓   | —  |  ✓    | ✓  | ✓  | ✓  |  ✓   |  ✓  | ✓  | —      | ✓    | ✓    | ✓    | ✓  |  ✓     |  ✓     | —       |

**Notes**
- Secrets Store: **metadata only** in UI; no values are ever exposed.
- Evidence export allowed only to `security` and `platform`.

---

## 6) Tech Insights Scorecards (SOC 2)

**Schedule**: hourly; history retained 180 days.

1) **Access Hygiene**
- Zero Trust audit log availability within last 24h.
- API Tokens used (no **Global API Key**); token TTL ≤ 180d; unused >90d flagged.
- Secrets centralized in **Secrets Store**; no per-Worker plaintext secrets.

2) **Change Management / Provenance**
- Workers/Pages deployments show **commit SHA** and **CI run URL**.
- For each prod deployment, an audit event (ZT or account audit) exists within ±24h.

3) **Data Retention & Storage**
- R2 buckets with regulated data have lifecycle rules.
- KV namespaces with PII have TTLs/namespace policy docs attached (TechDocs).

4) **Resilience & Runtime**
- Queues lag < threshold; no dead-letter buildup (where metrics available).
- Workflows steps have retry policies; last run status green.
- Durable Objects: error rate below threshold; WebSocket usage documented.

5) **AI Stack Governance**
- AI Gateway configured with rate limits and retries.
- Vectorize index dimensions match configured embedding model; last write < 7d.
- AI Search index has a successful crawl within last 7d.

6) **Coverage**
- ≥95% prod Components have at least one Cloudflare Resource relation.

---

## 7) CI/Deploy Provenance

- **Workers**: capture `GITHUB_SHA` and Actions run URL during build; attach to deployment metadata.
- **Pages**: use deployment metadata (commit/branch) or upload a build manifest for direct uploads.
- **Evidence**: exporter can bundle deployment record + commit + run URL as a JSON snapshot.

---

## 8) Configuration (`app-config.yaml` excerpts)
```yaml
cloudflare:
  accountId: ${CLOUDFLARE_ACCOUNT_ID}
  apiToken:
    $env: CLOUDFLARE_API_TOKEN
  fetch:
    timeoutMs: 15000
    maxRetries: 3
    backoff: jitter
  entityProvider:
    schedule: { frequency: { minutes: 10 }, timeout: { minutes: 2 } }
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

permission:
  enabled: true
  policy: ./packages/policies/src/policy.ts
```

---

## 9) Operational Runbooks (TechDocs)

- **Credentials**: Use API Tokens with least privilege, rotate ≤180d.
- **Evidence**: export Zero Trust audit logs monthly; R2 lifecycle rules per bucket; deployment provenance snapshots per release.
- **Data Handling**: KV/D1 schemas documented; retention notes in TechDocs; PII tagged in Catalog.
- **Incident Links**: map account audit/Access events to incident tickets for traceability.

---

## 10) Testing Strategy
- Contract tests for each `CloudflareClient` area.
- Entity Provider mapping tests (types, relations, drift).
- Permission tests (redaction and denial paths).
- E2E: fixtures for each product; smoke the dashboards/tabs.

---

## 11) Delivery Plan & Acceptance

**Milestones**
- **M1 (Week 1)**: Workers + Pages + Zero Trust (audit) + core UI.
- **M2 (Week 2)**: KV, D1, R2 + evidence exporters.
- **M3 (Week 3)**: Queues, Workflows, Durable Objects.
- **M4 (Week 4)**: AI Gateway, Vectorize, AI Search, Analytics Engine.
- **M5 (Week 5)**: Secrets Store (meta), Hyperdrive, Containers, Browser Rendering.
- **M6 (Week 6)**: Scorecards + acceptance tests.

**Acceptance Criteria**
- 100% prod deployments show commit SHA + CI URL.
- Zero Trust audit snapshots exportable (JSON).
- All regulated R2 buckets show lifecycle configuration.
- AI Gateway + Vectorize + AI Search resources discovered and visible.
- ≥95% prod Components linked to at least one Cloudflare Resource.
- Secrets: only metadata shown; no values in logs/UI.

---

## 12) Appendix — Typings (abbrev.)
```ts
type CfDeployment = { id?: string; version?: string; createdAt: string; env?: string; commitSha?: string; ciRunUrl?: string; status?: string };
type CfAccessAudit = { id: string; actor: { email?: string }; action: string; target: string; ts: string };
type CfQueue = { name: string; producers?: string[]; consumers?: string[] };
type CfKvNamespace = { id: string; title: string; keysApprox?: number };
type CfD1Db = { uuid: string; name: string; createdAt: string };
type CfR2Lifecycle = { rules: Array<any> };
type CfAiGateway = { name: string; providers: string[]; caching?: boolean; retries?: boolean; rateLimit?: string };
type CfVectorizeIndex = { name: string; dimensions: number; vectorCount?: number };
type CfAnalyticsDataset = { name: string; bindings: string[] };
type CfSecretsStore = { id: string; created: string; modified: string; secretCount?: number };
type CfHyperdrive = { name: string; origin: string; caching: boolean };
type CfContainerService = { name: string; images: string[] };
type CfWorkflow = { name: string; steps: number; retryPolicy: string };
type CfDurableObject = { className: string; namespace?: string };
type CfAiSearchIndex = { name: string; connectors: string[]; lastCrawlAt?: string };
type CfBrowserRendering = { pool?: string; quota?: string };
```

---

### Out-of-Scope (for v1)
- Write operations (provision/update/delete).
- Cost analytics and WAF rule drift (future work).
