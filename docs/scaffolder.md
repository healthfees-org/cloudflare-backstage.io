# Cloudflare Scaffolder Templates — Guardrails Blueprint
*(Generated on 2025-10-29)*

This document defines **Backstage Scaffolder** templates and custom actions to **provision and guard-rail Cloudflare resources** using Cloudflare APIs and Wrangler where applicable. It aligns with SOC 2 objectives: **change management, access control, retention, provenance, and evidence exports**.

---

## 1) Design Goals
- **Read‑only first, write with approvals**: All provisioning actions protected by permissions and reviewers.
- **Deterministic outputs**: Every run emits an **evidence bundle** (JSON) summarizing inputs, actions, API responses (redacted), and a SHA256.
- **Catalog‑first**: Each template emits a Backstage entity YAML with correct **relations** and **annotations**.
- **Wrangler + API**: Prefer **Cloudflare API** for creation when supported; fall back to **Wrangler** for developer‑ergonomic flows.

---

## 2) Required Backstage Capabilities
- **Scaffolder** enabled with built‑in actions and **custom actions** registry.
- **Permissions** policy that gates write actions to `group:platform` or `group:security`.
- **Publishers** for GitHub `publish:github` and optional PR‑only mode.
- **TechDocs** for template and ops runbooks.

References: Backstage built‑in actions and Scaffolder config; custom actions guide.

---

## 3) Template Catalog (v1)

Each template lives in `templates/cloudflare/<template-id>/template.yaml` and exposes inputs, approval gates, actions, and outputs.

### 3.1 Worker (with Deploy Provenance)
**ID**: `cf-worker-service`  
**Purpose**: Create a new Worker bound to optional KV/R2/Queues/D1, wire GitHub Actions, enforce commit SHA + run URL provenance.  
**Inputs**: `service_name`, `env` (`prod`/`stg`), `kv_namespaces[]`, `r2_buckets[]`, `queue_bindings[]`, `d1_db?`, `secrets[]`, `ai_gateway?`, `vectorize_index?`.  
**Guardrails**:
- Require **API Token** auth (no Global API Key).
- Block deployment unless **commit SHA** and **Actions run URL** are injected into deployment metadata.
- Optionally enforce **gradual deployments** toggle.

**Steps** (abridged):
1. `fetch:template` → clone template repo.
2. `script` → generate Wrangler `wrangler.toml` with bindings.
3. `github:actions:workflow:write` → add CI with provenance exports.
4. `cf:api:workers:create` → create script (stub).
5. `cf:api:workers:deploy` → deploy latest (provenance attached).
6. `catalog:register` → register `Resource` (type `cloudflare-worker`) and related `Component`.

**Outputs**: `component_path`, `entity_refs`, `provenance.json`, `wrangler.toml`.

### 3.2 Pages Project
**ID**: `cf-pages-project`  
**Purpose**: Create a Cloudflare Pages project with branch protection, CI, and R2 artifacts bucket.  
**Guardrails**: commit SHA + Action URL captured on every deployment; evidence snapshot after first deploy.

### 3.3 R2 Bucket (Retention‑ready)
**ID**: `cf-r2-bucket`  
**Purpose**: Create an **R2 bucket** with default lifecycle rules and optional WORM‑like retention.  
**Guardrails**: lifecycle rules are **required**; evidence JSON exported post‑create.  
**Inputs**: `bucket_name`, `jurisdiction (default|eu|fedramp)`, `lifecycle_rules[]` (default provided), `evidence_folder`.
**Outputs**: `r2-bucket.yaml` entity, `r2-lifecycle.json` evidence.

### 3.4 D1 Database
**ID**: `cf-d1-database`  
**Purpose**: Create a **D1 DB**, optionally import schema, bind to Worker.  
**Guardrails**: schema must be versioned; import emits evidence; optional **region** parameter.

### 3.5 Queues
**ID**: `cf-queue`  
**Purpose**: Create a **Queue**, register producers/consumers by linking to Workers.  
**Guardrails**: require DLQ binding or at least retention policy; emit metrics pointer.

### 3.6 KV Namespace
**ID**: `cf-kv-namespace`  
**Purpose**: Create a **KV namespace**, attach TTL policy doc.  
**Guardrails**: prohibit storage of secrets (must use Secrets Store); require TTL guidance in TechDocs.

### 3.7 AI Gateway
**ID**: `cf-ai-gateway`  
**Purpose**: Create an **AI Gateway** profile with rate‑limit, retries, and logging enabled.  
**Guardrails**: must set provider allow‑list; evidence snapshot of config.

### 3.8 Vectorize Index
**ID**: `cf-vectorize-index`  
**Purpose**: Provision a **Vectorize index** at specified `dimensions` and distance metric.  
**Guardrails**: `dimensions` must match embedding model; enforce naming and environment suffix.

### 3.9 Analytics Engine Dataset
**ID**: `cf-analytics-engine-dataset`  
**Purpose**: Create a **Workers Analytics Engine** dataset for structured event logs.  
**Guardrails**: SQL allow‑list for read‑only queries; privacy note added to TechDocs.

### 3.10 Secrets Store (Metadata‑only)
**ID**: `cf-secrets-store-meta`  
**Purpose**: Register an **account‑level Secrets Store** reference and inject bindings into Workers; **never** reads secret values.  
**Guardrails**: policy requires secrets consumption only via binding; values managed in Secrets Store dashboard/API.

### 3.11 Hyperdrive Config
**ID**: `cf-hyperdrive-config`  
**Purpose**: Create **Hyperdrive** config for an origin DB.  
**Guardrails**: redact credentials; verify TLS; emit connection policy doc.

### 3.12 Containers (Serverless Containers)
**ID**: `cf-container-service`  
**Purpose**: Register **Container** service and image tags; optional traffic policy.  
**Guardrails**: signed image digests required; provenance references.

### 3.13 Workflows
**ID**: `cf-workflow`  
**Purpose**: Create a **Workflow** definition, schedule, and bindings to Vectorize/R2/D1.  
**Guardrails**: retry + backoff required; max duration guard; evidence of last dry‑run.

### 3.14 Durable Objects
**ID**: `cf-durable-object`  
**Purpose**: Register a **Durable Object** class + namespace and add Worker binding.  
**Guardrails**: error budget SLO doc and alarm defaults.

### 3.15 AI Search
**ID**: `cf-ai-search-index`  
**Purpose**: Create an **AI Search** index, connect Website data source, and schedule crawls.  
**Guardrails**: explicitly set crawler allow‑list/exception; evidence of last crawl health.

### 3.16 Browser Rendering
**ID**: `cf-browser-rendering`  
**Purpose**: Register **Browser Rendering** usage for a service, set quotas and capture example screenshot task.  
**Guardrails**: enforce per‑env quota; evidence of limits & first run.

---

## 4) Custom Actions (examples)

**`cf:api:r2:create-bucket`**
- **Inputs**: `accountId`, `bucketName`, `jurisdiction`, `lifecycleRules`  
- **Effect**: Calls R2 Create Bucket; then Put Lifecycle; writes `r2-lifecycle.json` evidence.  
- **Outputs**: `bucketUrl`, `evidencePath`

**`cf:api:d1:create`**
- **Inputs**: `accountId`, `name`, `primaryRegion?`, `schemaSql?`  
- **Effect**: Create DB; optional Import SQL (polling); emit evidence.  
- **Outputs**: `databaseUuid`

**`cf:api:kv:create-namespace`**
- **Inputs**: `accountId`, `title`  
- **Effect**: Create Namespace; emit evidence.

**`cf:api:queues:create`**
- **Inputs**: `accountId`, `name`, `dlq?`  
- **Effect**: Create Queue; create consumer on target Worker (if provided).

**`cf:api:vectorize:create-index`**
- **Inputs**: `accountId`, `indexName`, `dimensions`, `metric`  
- **Effect**: Ensure index exists; attach metadata; emit evidence.

**`cf:api:ai-search:create-index`**
- **Inputs**: `accountId`, `indexName`, `connector=website`, `seedUrl`, `crawlSchedule`  
- **Effect**: Create index; configure Website connector; emit health snapshot.

**`cf:api:workers:deploy-with-provenance`**
- **Inputs**: `scriptName`, `commitSha`, `ciRunUrl`, `gradual?`  
- **Effect**: Create deployment via API; attach provenance; emit deployment evidence.

Each action returns `{{ evidencePath, summary }}` and is permission‑gated.

---

## 5) Example Template (R2 Bucket — excerpt)

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: cf-r2-bucket
  title: Cloudflare R2 bucket (with retention)
  description: Create an R2 bucket with lifecycle rules and evidence export
spec:
  owner: group:platform
  type: service
  parameters:
    - title: R2 settings
      required: [bucketName]
      properties:
        bucketName:
          type: string
          pattern: "^[a-z0-9-]+$"
        jurisdiction:
          type: string
          enum: [default, eu, fedramp]
        expirationDays:
          type: integer
          default: 180
  steps:
    - id: ensure-bucket
      name: Create R2 bucket
      action: cf:api:r2:create-bucket
      input:
        accountId: ${{ parameters.accountId }}
        bucketName: ${{ parameters.bucketName }}
        jurisdiction: ${{ parameters.jurisdiction }}
        lifecycleRules:
          - id: retain-expire
            status: Enabled
            filter: {{ prefix: "" }}
            expiration: {{ days: ${{ parameters.expirationDays }} }}
    - id: emit-entity
      name: Register catalog entity
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.fetch.output.repoContentsUrl }}
        catalogInfoPath: ./catalog-info.yaml
  output:
    links:
      - title: Evidence (R2 lifecycle)
        url: ${{ steps.ensure-bucket.output.evidencePath }}
```

---

## 6) Permissions & Approvals
- All `cf:api:*:create` actions require `allowAction('cloudflare.write')` and membership in `group:platform` or `group:security`.
- **Manual approval** step may be required for `prod` targets; PR‑only mode optional.

---

## 7) Evidence Bundle Schema
```json
{{
  "templateId": "cf-r2-bucket",
  "runId": "uuid",
  "timestamp": "ISO-8601",
  "actor": "user:default/jake",
  "inputs": {{ "bucketName": "hfo-prod-artifacts", "jurisdiction": "fedramp" }},
  "apiCalls": [
    {{ "method": "POST", "path": "/accounts/{{id}}/r2/buckets", "status": 200 }}
  ],
  "outputs": {{ "bucketUrl": "r2://hfo-prod-artifacts" }},
  "hash": "sha256:..."
}}
```

---

## 8) Guardrail Policies (per resource)
- **Workers/Pages**: provenance required (commit SHA + CI URL); gradual deploy optional; deployments recorded.
- **R2**: lifecycle **mandatory**; jurisdiction selectable.
- **KV**: secrets banned; TTL guidance required in TechDocs.
- **D1**: schema versioning required; import emits evidence.
- **Queues**: DLQ or retention policy required.
- **Vectorize**: `dimensions` must match embedding model; name must be `{{env}}-{{name}}`.
- **AI Gateway**: provider allow‑list; rate‑limit + retries enabled.
- **AI Search**: explicit crawler allow‑list/exception configured.
- **Secrets Store**: metadata only; no values exposed.
- **Browser Rendering**: per‑env quotas; proof via first‑run screenshot.

---

## 9) Outputs & Catalog Annotations
- Every template emits a `Resource` entity (`spec.type: cloudflare-*`) and appends annotations on the owning `Component`:
  - `cloudflare.com/<resource-type>: <name-or-id>`
- Relations: `Component` **DEPENDS_ON** the new `Resource`.

---

## 10) Rollback & Drift
- Rollback script (PR‑based) to delete or quarantine the resource (where safe).
- Drift detector job compares Catalog inventory to Cloudflare API; differences raise tickets.

---

## 11) Next Steps
- Implement the listed `cf:api:*` custom actions with typed clients.
- Add **template unit tests** (JSON schema validation) and **action contract tests** (recorded fixtures).
- Wire **Tech Insights** checks to enforce guardrails at review time.
