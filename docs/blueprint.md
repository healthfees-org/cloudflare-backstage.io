# Cloudflare Backstage Plugin — Blueprint
*(Generated on 2025-10-29)*

## 1) Purpose
Establish a Cloudflare-focused Backstage plugin that provides **read-only posture, SOC 2 evidence surfaces, and deploy provenance** for Cloudflare resources used by HealthFees.org. This blueprint defines scope, data sources, catalog modeling, scorecards, security, and a phased delivery plan.

**Primary SOC 2 objectives**
- Change management & deploy provenance: visible commit/CI trace for Workers/Pages deployments and account audit events. 
- Access control hygiene: enumerate members, roles, API tokens and scopes; discourage legacy Global API Key; adopt token TTL/rotation. 
- Data retention & backups: expose R2 lifecycle policies as evidence of retention/IA transitions/deletion. 

---

## 2) In‑Scope Cloudflare Surfaces (Read‑only v1)
1. **Account & Access**
   - Accounts (id, name), Members (user, roles), API Tokens (id, last used, scopes) with warnings for broad scopes/age. 
   - **Audit Logs (v1/v2 beta)**: filter by actor, action, target, time; downloadable JSON snapshots for evidence. 

2. **Compute & Web**
   - **Workers**: scripts and **deployments** with version, environment, and live/provisional status; link to GitHub Actions run and commit SHA. 
   - **Pages**: projects and deployments (id, commit, branch, created_at), with retry/delete status pointers.

3. **Data**
   - **R2**: buckets with lifecycle rules (read-only surface; flag buckets missing lifecycle). 
   - **D1**: databases (uuid, name, created_at); show backup/export guidance link for docs; note API list coverage. 

4. **Queues (awareness)**
   - Note: queue config changes appear in account audit logs; no dedicated v1 scope beyond audit. 

**Non‑Goals (v1)**
- Write operations (no create/update/delete for any CF resources).
- Cost reporting or WAF rule drift (future consideration).

---

## 3) Backstage Modeling & Annotations
### Entity Types & Relations
- **Component**: your app/service repo (e.g., `hfo-api`, `hfo-web`). 
- **Resource**: Cloudflare asset (Worker, Pages project, R2 bucket, D1 database).
- Relation: `component -> resource` (`relations.type=DEPENDS_ON`), grouped in **System** (product-level). 

### Proposed Annotations (on Components)
- `cloudflare.com/worker-name: <name>` (links to Worker Resource) 
- `cloudflare.com/pages-project: <project_name>` 
- `cloudflare.com/r2-bucket: <bucket_name>` 
- `cloudflare.com/d1-db: <database_uuid>` 
- `backstage.io/techdocs-ref: dir:./docs` (TechDocs evidence/runbooks colocated) 

### Entity Provider (Backend)
- Implement a **Cloudflare Entity Provider** that queries CF APIs and **pushes Resource entities** into the Catalog with proper ownership and relations to Components via annotations. Mirrors Provider patterns used for other clouds. 

---

## 4) Data Sources & Endpoints
- **Audit Logs**: `GET /accounts/<built-in function id>/audit_logs` (v1), `GET /accounts/<built-in function id>/logs/audit` (v2 beta, 30‑day window). 
- **Accounts / Members**: `GET /accounts`, `GET /accounts/<built-in function id>/members` (note legacy auth vs tokens guidance).
- **API Tokens**: creation/permissions/TTL docs for rotation and minimal scope checks. 
- **Workers**: list scripts & **deployments** (versioned deployments surface). 
- **Pages**: list projects & deployments; deployment metadata includes commit info. 
- **R2**: object lifecycle rules (get/put); IA transitions & deletions. 
- **D1**: list/get database metadata (uuid, name, created_at). 

---

## 5) Plugin Surfaces (Backstage UI)
- **Cloudflare Overview (Entity Page Tab)**  
  Shows linked Resources for a Component: current Worker/Pages deployment, last commit, last CI run, and recent related audit events. 
- **Account Posture (Global Page)**  
  - Members & roles list, API tokens (redacted), age/last_used, scope analysis (Zone/Account/User). Warn if Global API Key detected anywhere. 
- **Data Retention (Global Page)**  
  - R2 buckets table (lifecycle rules present? days to IA? delete after N?). Export evidence JSON. 
- **D1 Inventory (Global Page)**  
  - Databases with created_at; link to operational docs for backup/export. 

---

## 6) Tech Insights Scorecards (SOC 2 checks)
Implement checks using the community Tech Insights plugin (or equivalent) and display them as Scorecards. 

**Initial Scorecards**
1. **Access Hygiene**
   - No Global API Key usage (advisory).  
   - 100% API tokens have **least privilege** and **TTL/expiry** ≤ 180 days; no token unused in >90 days. 
2. **Change Management**
   - 100% prod deployments (Workers/Pages) show **commit SHA** and GH Actions **run URL** in the entity view. 
3. **Retention**
   - 100% regulated-data R2 buckets have lifecycle rules configured and visible. 
4. **Coverage**
   - ≥95% of production Components have at least one Cloudflare Resource relation. 

---

## 7) Permissions & Security
- Use Backstage **permissions framework** to restrict views of tokens/member details/audit logs to Security/Platform groups; show redacted token IDs to others. 
- Store Cloudflare credentials as **Account API tokens** (not Global API Key), scoped to read-only permissions. Enforce TTL/rotation in operational runbook. 

---

## 8) Evidence & TechDocs
- For each Catalog entity, colocate runbooks and evidence instructions using TechDocs (`backstage.io/techdocs-ref`).  
- Allow **JSON snapshot export** for Audit Logs/R2 lifecycle to attach in audits. 

---

## 9) Implementation Plan (Phased)
**Phase 0 — Foundations (1 unit)**
- Enable TechDocs; define annotations; pick initial services to onboard. 

**Phase 1 — Read-only posture (2–3 units)**
- Implement Cloudflare **Entity Provider** to sync Workers, Pages, R2, D1 into Catalog as Resources.  
- Build **Account Posture** & **Data Retention** pages; entity tabs for deployment & audit highlights.

**Phase 2 — Scorecards & Evidence (1–2 units)**
- Wire Tech Insights checks & Scorecards; add evidence snapshot downloads. 

*(Future Phase: Scaffolder templates for CF resources with guardrails; out of scope for this Cloudflare read‑only v1 but feasible via Backstage Scaffolder.)* 

---

## 10) Acceptance Criteria
- **Inventory coverage**: ≥95% prod Components linked to Cloudflare Resources in Catalog. 
- **Provenance**: 100% prod deployments display commit SHA + CI run URL. 
- **Access hygiene**: Zero active Global API Key usage; tokens have minimal scopes & TTL ≤ 180 days. 
- **Retention evidence**: All regulated-data R2 buckets show lifecycle rules in UI and exportable JSON.

---

## 11) Risks & Mitigations
- **Audit Logs v2 beta limits (30-day window)**: Maintain periodic exports to storage as evidence.
- **Legacy auth endpoints** required for some list calls: prefer API tokens and phase out old flows. 

---

## 12) Appendix — Key Docs
- Backstage permissions & policies.
- Catalog model, relations & annotations. 
- TechDocs basics & how‑to.
- Tech Insights / Scorecards.
- Cloudflare APIs: Audit Logs, Tokens, Members, Workers, Pages, R2 Lifecycle, D1. 
