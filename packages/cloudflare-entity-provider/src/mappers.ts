import { Entity, ResourceEntity } from '@backstage/catalog-model';
import {
  CfWorkerScript,
  CfPagesProject,
  CfR2Bucket,
  CfD1Db,
  CfKvNamespace,
  CfQueue,
  CfAiGateway,
  CfVectorizeIndex,
  CfAnalyticsDataset,
  CfSecretsStore,
  CfHyperdrive,
  CfContainerService,
  CfWorkflow,
  CfDurableObject,
  CfAiSearchIndex,
  CfBrowserRendering,
  CfWorkerDeployment,
  CfPagesDeployment,
} from '@internal/cloudflare-client';

/**
 * Configuration for entity mappers
 */
export interface EntityMapperConfig {
  accountId: string;
  defaultOwner?: string;
  defaultSystem?: string;
}

/**
 * Base entity mapper
 */
export abstract class BaseEntityMapper<T> {
  constructor(protected config: EntityMapperConfig) {}

  protected createBaseEntity(
    kind: string,
    type: string,
    name: string,
    description?: string,
    tags?: string[],
  ): Entity {
    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind,
      metadata: {
        name: this.sanitizeName(name),
        description: description || '',
        tags: tags || [],
        annotations: {
          'cloudflare.com/account-id': this.config.accountId,
        },
      },
      spec: {
        type,
        owner: this.config.defaultOwner || 'unknown',
        ...(this.config.defaultSystem ? { system: this.config.defaultSystem } : {}),
      },
    };
  }

  protected sanitizeName(name: string): string {
    // Convert to lowercase and replace invalid characters
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, '-')
      .replace(/^[^a-z0-9]+/, '')
      .replace(/[^a-z0-9]+$/, '');
  }

  abstract map(resource: T, ...args: any[]): ResourceEntity | null;
}

/**
 * Worker entity mapper
 */
export class WorkerEntityMapper extends BaseEntityMapper<CfWorkerScript> {
  map(script: CfWorkerScript, deployment?: CfWorkerDeployment): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-worker',
      `cf-worker-${script.id}`,
      `Cloudflare Worker: ${script.id}`,
      ['cloudflare', 'worker'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      scriptName: script.id,
      usageModel: script.usage_model,
      ...(deployment && {
        lastDeployment: {
          id: deployment.id,
          createdOn: deployment.created_on,
          commitSha: deployment.metadata?.commit_sha,
          ciRunUrl: deployment.metadata?.ci_run_url,
        },
      }),
    };

    return entity;
  }
}

/**
 * Pages entity mapper
 */
export class PagesEntityMapper extends BaseEntityMapper<CfPagesProject> {
  map(project: CfPagesProject, deployment?: CfPagesDeployment): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-pages',
      `cf-pages-${project.name}`,
      `Cloudflare Pages: ${project.name}`,
      ['cloudflare', 'pages'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      projectName: project.name,
      subdomain: project.subdomain,
      domains: project.domains || [],
      productionBranch: project.production_branch,
      ...(deployment && {
        lastDeployment: {
          id: deployment.id,
          environment: deployment.environment,
          createdOn: deployment.created_on,
          url: deployment.url,
          commitHash: deployment.deployment_trigger?.metadata?.commit_hash,
          branch: deployment.deployment_trigger?.metadata?.branch,
        },
      }),
    };

    return entity;
  }
}

/**
 * R2 bucket entity mapper
 */
export class R2EntityMapper extends BaseEntityMapper<CfR2Bucket> {
  map(bucket: CfR2Bucket, lifecycleRules?: any): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-r2',
      `cf-r2-${bucket.name}`,
      `Cloudflare R2 Bucket: ${bucket.name}`,
      ['cloudflare', 'r2', 'storage'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      bucketName: bucket.name,
      creationDate: bucket.creation_date,
      ...(lifecycleRules && { lifecycle: lifecycleRules }),
    };

    return entity;
  }
}

/**
 * D1 database entity mapper
 */
export class D1EntityMapper extends BaseEntityMapper<CfD1Db> {
  map(database: CfD1Db): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-d1',
      `cf-d1-${database.uuid}`,
      `Cloudflare D1 Database: ${database.name}`,
      ['cloudflare', 'd1', 'database'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      uuid: database.uuid,
      name: database.name,
      createdAt: database.created_at,
      version: database.version,
      numTables: database.num_tables,
      fileSize: database.file_size,
    };

    return entity;
  }
}

/**
 * KV namespace entity mapper
 */
export class KVEntityMapper extends BaseEntityMapper<CfKvNamespace> {
  map(namespace: CfKvNamespace): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-kv',
      `cf-kv-${namespace.id}`,
      `Cloudflare KV Namespace: ${namespace.title}`,
      ['cloudflare', 'kv', 'storage'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      namespaceId: namespace.id,
      title: namespace.title,
      keysApprox: namespace.keysApprox,
    };

    return entity;
  }
}

/**
 * Queue entity mapper
 */
export class QueueEntityMapper extends BaseEntityMapper<CfQueue> {
  map(queue: CfQueue): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-queue',
      `cf-queue-${queue.queue_name}`,
      `Cloudflare Queue: ${queue.queue_name}`,
      ['cloudflare', 'queue'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      queueName: queue.queue_name,
      queueId: queue.queue_id,
      createdOn: queue.created_on,
      modifiedOn: queue.modified_on,
      producers: queue.producers || [],
      consumers: queue.consumers || [],
    };

    return entity;
  }
}

/**
 * Create mappers for all other resource types following the same pattern
 */

export class AIGatewayEntityMapper extends BaseEntityMapper<CfAiGateway> {
  map(gateway: CfAiGateway): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-ai-gateway',
      `cf-ai-gateway-${gateway.id}`,
      `Cloudflare AI Gateway: ${gateway.name}`,
      ['cloudflare', 'ai-gateway'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      gatewayId: gateway.id,
      name: gateway.name,
      providers: gateway.providers,
      caching: gateway.caching,
      retries: gateway.retries,
    };

    return entity;
  }
}

export class VectorizeEntityMapper extends BaseEntityMapper<CfVectorizeIndex> {
  map(index: CfVectorizeIndex): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-vectorize',
      `cf-vectorize-${index.name}`,
      `Cloudflare Vectorize Index: ${index.name}`,
      ['cloudflare', 'vectorize', 'ai'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      indexName: index.name,
      dimensions: index.dimensions,
      metric: index.metric,
      vectorCount: index.vector_count,
    };

    return entity;
  }
}

export class WorkflowEntityMapper extends BaseEntityMapper<CfWorkflow> {
  map(workflow: CfWorkflow): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-workflow',
      `cf-workflow-${workflow.name}`,
      `Cloudflare Workflow: ${workflow.name}`,
      ['cloudflare', 'workflow'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      workflowId: workflow.id,
      name: workflow.name,
      steps: workflow.steps,
      retryPolicy: workflow.retry_policy,
    };

    return entity;
  }
}

export class DurableObjectEntityMapper extends BaseEntityMapper<CfDurableObject> {
  map(durableObject: CfDurableObject): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-durable-object',
      `cf-do-${durableObject.class_name}`,
      `Cloudflare Durable Object: ${durableObject.class_name}`,
      ['cloudflare', 'durable-object'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      className: durableObject.class_name,
      scriptName: durableObject.script_name,
      namespace: durableObject.namespace,
    };

    return entity;
  }
}

// Additional mappers for remaining services...
export class AISearchEntityMapper extends BaseEntityMapper<CfAiSearchIndex> {
  map(index: CfAiSearchIndex): ResourceEntity | null {
    const entity = this.createBaseEntity(
      'Resource',
      'cloudflare-ai-search',
      `cf-ai-search-${index.name}`,
      `Cloudflare AI Search: ${index.name}`,
      ['cloudflare', 'ai-search'],
    ) as ResourceEntity;

    entity.spec.parameters = {
      accountId: this.config.accountId,
      indexName: index.name,
      connectors: index.connectors,
      lastCrawlAt: index.last_crawl_at,
      documentCount: index.document_count,
    };

    return entity;
  }
}
