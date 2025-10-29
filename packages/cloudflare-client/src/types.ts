/**
 * Common types for Cloudflare API responses
 */

export type CloudflareApiResponse<T> = {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
};

/**
 * Deployment types
 */
export type CfDeployment = {
  id?: string;
  version?: string;
  createdAt: string;
  env?: string;
  commitSha?: string;
  ciRunUrl?: string;
  status?: string;
};

/**
 * Access Audit types
 */
export type CfAccessAudit = {
  id: string;
  actor: { email?: string; id?: string; type?: string };
  action: string;
  target: string;
  ts: string;
  metadata?: Record<string, any>;
};

/**
 * Queue types
 */
export type CfQueue = {
  queue_id?: string;
  queue_name: string;
  created_on?: string;
  modified_on?: string;
  producers?: string[];
  consumers?: string[];
  producers_total_count?: number;
  consumers_total_count?: number;
};

/**
 * KV Namespace types
 */
export type CfKvNamespace = {
  id: string;
  title: string;
  supports_url_encoding?: boolean;
  keysApprox?: number;
};

export type CfKvKey = {
  name: string;
  expiration?: number;
  metadata?: Record<string, any>;
};

/**
 * D1 Database types
 */
export type CfD1Db = {
  uuid: string;
  name: string;
  version?: string;
  num_tables?: number;
  file_size?: number;
  created_at: string;
};

/**
 * R2 Bucket types
 */
export type CfR2Bucket = {
  name: string;
  creation_date: string;
  location?: string;
};

export type CfR2LifecycleRule = {
  id?: string;
  status: 'Enabled' | 'Disabled';
  filter?: {
    prefix?: string;
    tag?: Record<string, string>;
  };
  expiration?: {
    days?: number;
    date?: string;
  };
  transitions?: Array<{
    days?: number;
    date?: string;
    storage_class: 'STANDARD_IA';
  }>;
  abort_incomplete_multipart_upload?: {
    days_after_initiation: number;
  };
};

export type CfR2Lifecycle = {
  rules: CfR2LifecycleRule[];
};

/**
 * AI Gateway types
 */
export type CfAiGateway = {
  id: string;
  name: string;
  providers: string[];
  caching?: boolean;
  retries?: boolean;
  rate_limit?: string;
  created_at?: string;
  modified_at?: string;
};

/**
 * Vectorize Index types
 */
export type CfVectorizeIndex = {
  id?: string;
  name: string;
  config?: {
    dimensions: number;
    metric?: 'euclidean' | 'cosine' | 'dot-product';
  };
  dimensions: number;
  metric?: string;
  vector_count?: number;
  created_on?: string;
  modified_on?: string;
};

/**
 * Analytics Engine Dataset types
 */
export type CfAnalyticsDataset = {
  name: string;
  bindings: string[];
  dataset?: string;
};

/**
 * Secrets Store types
 */
export type CfSecretsStore = {
  id: string;
  name?: string;
  created: string;
  modified: string;
  secret_count?: number;
};

/**
 * Hyperdrive Config types
 */
export type CfHyperdrive = {
  id: string;
  name: string;
  origin: {
    database?: string;
    host?: string;
    port?: number;
    scheme?: string;
    user?: string;
  };
  caching: {
    disabled?: boolean;
  };
  created_on?: string;
  modified_on?: string;
};

/**
 * Container Service types
 */
export type CfContainerService = {
  id?: string;
  name: string;
  images: string[];
  created_at?: string;
  modified_at?: string;
};

/**
 * Workflow types
 */
export type CfWorkflow = {
  id?: string;
  name: string;
  script_name?: string;
  class_name?: string;
  steps?: number;
  retry_policy?: string;
  created_on?: string;
  modified_on?: string;
};

export type CfWorkflowRun = {
  id: string;
  workflow_id?: string;
  status: string;
  queued_on?: string;
  started_on?: string;
  completed_on?: string;
  duration_ms?: number;
  retries?: number;
};

/**
 * Durable Object types
 */
export type CfDurableObject = {
  id?: string;
  class_name: string;
  script_name?: string;
  namespace?: string;
  created_on?: string;
};

/**
 * AI Search Index types
 */
export type CfAiSearchIndex = {
  id?: string;
  name: string;
  connectors: string[];
  config?: {
    sources?: Array<{
      type: string;
      url?: string;
    }>;
  };
  last_crawl_at?: string;
  document_count?: number;
  created_at?: string;
  modified_at?: string;
};

/**
 * Browser Rendering types
 */
export type CfBrowserRendering = {
  pool?: string;
  quota?: string;
  usage?: {
    used?: number;
    limit?: number;
  };
};

/**
 * Workers Script types
 */
export type CfWorkerScript = {
  id: string;
  etag?: string;
  handlers?: string[];
  modified_on?: string;
  created_on?: string;
  usage_model?: string;
  deployment_id?: string;
  logpush?: boolean;
  tail_consumers?: Array<{
    service: string;
    environment?: string;
  }>;
};

export type CfWorkerDeployment = {
  id: string;
  source?: string;
  strategy?: string;
  author_email?: string;
  author_id?: string;
  created_on?: string;
  modified_on?: string;
  versions?: Array<{
    version_id: string;
    percentage: number;
  }>;
  metadata?: {
    commit_sha?: string;
    ci_run_url?: string;
  };
};

/**
 * Pages Project types
 */
export type CfPagesProject = {
  id?: string;
  name: string;
  subdomain?: string;
  domains?: string[];
  source?: {
    type?: string;
    config?: {
      owner?: string;
      repo_name?: string;
      production_branch?: string;
    };
  };
  build_config?: {
    build_command?: string;
    destination_dir?: string;
    root_dir?: string;
  };
  created_on?: string;
  production_branch?: string;
  canonical_deployment?: {
    id?: string;
    url?: string;
  };
};

export type CfPagesDeployment = {
  id: string;
  short_id?: string;
  project_id?: string;
  project_name?: string;
  environment: string;
  url?: string;
  created_on: string;
  modified_on?: string;
  latest_stage?: {
    name?: string;
    status?: string;
    started_on?: string | null;
    ended_on?: string | null;
  };
  deployment_trigger?: {
    type?: string;
    metadata?: {
      branch?: string;
      commit_hash?: string;
      commit_message?: string;
    };
  };
  stages?: Array<{
    name: string;
    status: string;
    started_on?: string | null;
    ended_on?: string | null;
  }>;
  build_config?: {
    build_command?: string;
    destination_dir?: string;
    root_dir?: string;
  };
  source?: {
    type?: string;
    config?: {
      owner?: string;
      repo_name?: string;
      production_branch?: string;
      deployments_enabled?: boolean;
    };
  };
  production_branch?: string;
  aliases?: string[];
};
