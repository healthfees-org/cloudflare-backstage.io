import { EntityProvider, EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { PluginTaskScheduler, TaskRunner } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import { CloudflareClient } from '@internal/cloudflare-client';
import {
  WorkerEntityMapper,
  PagesEntityMapper,
  R2EntityMapper,
  D1EntityMapper,
  KVEntityMapper,
  QueueEntityMapper,
  AIGatewayEntityMapper,
  VectorizeEntityMapper,
  WorkflowEntityMapper,
  DurableObjectEntityMapper,
  AISearchEntityMapper,
} from './mappers';
import { ResourceEntity } from '@backstage/catalog-model';

export interface CloudflareEntityProviderConfig {
  accountId: string;
  apiToken: string;
  schedule?: {
    frequency: { minutes: number };
    timeout: { minutes: number };
  };
  import?: {
    workers?: boolean;
    pages?: boolean;
    r2?: boolean;
    d1?: boolean;
    kv?: boolean;
    queues?: boolean;
    aiGateway?: boolean;
    vectorize?: boolean;
    workflows?: boolean;
    durableObjects?: boolean;
    aiSearch?: boolean;
  };
  defaultOwner?: string;
  defaultSystem?: string;
}

export class CloudflareEntityProvider implements EntityProvider {
  private readonly config: CloudflareEntityProviderConfig;
  private readonly logger: Logger;
  private readonly client: CloudflareClient;
  private connection?: EntityProviderConnection;

  static fromConfig(
    config: Config,
    options: {
      logger: Logger;
      schedule?: TaskRunner;
      scheduler?: PluginTaskScheduler;
    },
  ): CloudflareEntityProvider {
    const providerConfig: CloudflareEntityProviderConfig = {
      accountId: config.getString('cloudflare.accountId'),
      apiToken: config.getString('cloudflare.apiToken'),
      schedule: config.getOptional('cloudflare.entityProvider.schedule') as any,
      import: config.getOptional('cloudflare.entityProvider.import') as any,
      defaultOwner: config.getOptionalString('cloudflare.entityProvider.defaultOwner'),
      defaultSystem: config.getOptionalString('cloudflare.entityProvider.defaultSystem'),
    };

    return new CloudflareEntityProvider(providerConfig, options.logger, options.scheduler);
  }

  constructor(
    config: CloudflareEntityProviderConfig,
    logger: Logger,
    private readonly scheduler?: PluginTaskScheduler,
  ) {
    this.config = config;
    this.logger = logger.child({ target: this.getProviderName() });
    this.client = new CloudflareClient({
      accountId: config.accountId,
      apiToken: config.apiToken,
    });
  }

  getProviderName(): string {
    return `cloudflare-entity-provider:${this.config.accountId}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;

    // Schedule the provider if scheduler is available
    if (this.scheduler && this.config.schedule) {
      await this.scheduler.scheduleTask({
        id: this.getProviderName(),
        frequency: this.config.schedule.frequency,
        timeout: this.config.schedule.timeout,
        fn: async () => {
          await this.run();
        },
      });
    }
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    this.logger.info('Discovering Cloudflare resources');

    const entities: ResourceEntity[] = [];

    try {
      // Import Workers
      if (this.config.import?.workers !== false) {
        const workerEntities = await this.discoverWorkers();
        entities.push(...workerEntities);
        this.logger.info(`Discovered ${workerEntities.length} Workers`);
      }

      // Import Pages
      if (this.config.import?.pages !== false) {
        const pagesEntities = await this.discoverPages();
        entities.push(...pagesEntities);
        this.logger.info(`Discovered ${pagesEntities.length} Pages projects`);
      }

      // Import R2
      if (this.config.import?.r2 !== false) {
        const r2Entities = await this.discoverR2();
        entities.push(...r2Entities);
        this.logger.info(`Discovered ${r2Entities.length} R2 buckets`);
      }

      // Import D1
      if (this.config.import?.d1 !== false) {
        const d1Entities = await this.discoverD1();
        entities.push(...d1Entities);
        this.logger.info(`Discovered ${d1Entities.length} D1 databases`);
      }

      // Import KV
      if (this.config.import?.kv !== false) {
        const kvEntities = await this.discoverKV();
        entities.push(...kvEntities);
        this.logger.info(`Discovered ${kvEntities.length} KV namespaces`);
      }

      // Import Queues
      if (this.config.import?.queues !== false) {
        const queueEntities = await this.discoverQueues();
        entities.push(...queueEntities);
        this.logger.info(`Discovered ${queueEntities.length} Queues`);
      }

      // Import AI Gateway
      if (this.config.import?.aiGateway !== false) {
        const aiGatewayEntities = await this.discoverAIGateway();
        entities.push(...aiGatewayEntities);
        this.logger.info(`Discovered ${aiGatewayEntities.length} AI Gateways`);
      }

      // Import Vectorize
      if (this.config.import?.vectorize !== false) {
        const vectorizeEntities = await this.discoverVectorize();
        entities.push(...vectorizeEntities);
        this.logger.info(`Discovered ${vectorizeEntities.length} Vectorize indexes`);
      }

      // Import Workflows
      if (this.config.import?.workflows !== false) {
        const workflowEntities = await this.discoverWorkflows();
        entities.push(...workflowEntities);
        this.logger.info(`Discovered ${workflowEntities.length} Workflows`);
      }

      // Import Durable Objects
      if (this.config.import?.durableObjects !== false) {
        const doEntities = await this.discoverDurableObjects();
        entities.push(...doEntities);
        this.logger.info(`Discovered ${doEntities.length} Durable Object classes`);
      }

      // Import AI Search
      if (this.config.import?.aiSearch !== false) {
        const aiSearchEntities = await this.discoverAISearch();
        entities.push(...aiSearchEntities);
        this.logger.info(`Discovered ${aiSearchEntities.length} AI Search indexes`);
      }

      // Apply full mutation to update all entities
      await this.connection.applyMutation({
        type: 'full',
        entities: entities.map(entity => ({
          entity,
          locationKey: this.getProviderName(),
        })),
      });

      this.logger.info(`Successfully synced ${entities.length} total Cloudflare resources`);
    } catch (error) {
      this.logger.error(`Error discovering Cloudflare resources: ${error}`);
      throw error;
    }
  }

  private async discoverWorkers(): Promise<ResourceEntity[]> {
    const mapper = new WorkerEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const scripts = await this.client.workers.listScripts();
    const entities: ResourceEntity[] = [];

    for (const script of scripts) {
      try {
        const deployment = await this.client.workers.getLatestDeployment(script.id);
        const entity = mapper.map(script, deployment || undefined);
        if (entity) {
          entities.push(entity);
        }
      } catch (error) {
        this.logger.warn(`Failed to process Worker ${script.id}: ${error}`);
      }
    }

    return entities;
  }

  private async discoverPages(): Promise<ResourceEntity[]> {
    const mapper = new PagesEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const projects = await this.client.pages.listProjects();
    const entities: ResourceEntity[] = [];

    for (const project of projects) {
      try {
        const deployment = await this.client.pages.getLatestProductionDeployment(project.name);
        const entity = mapper.map(project, deployment || undefined);
        if (entity) {
          entities.push(entity);
        }
      } catch (error) {
        this.logger.warn(`Failed to process Pages project ${project.name}: ${error}`);
      }
    }

    return entities;
  }

  private async discoverR2(): Promise<ResourceEntity[]> {
    const mapper = new R2EntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const buckets = await this.client.r2.listBuckets();
    const entities: ResourceEntity[] = [];

    for (const bucket of buckets) {
      try {
        const lifecycle = await this.client.r2.getLifecycle(bucket.name);
        const entity = mapper.map(bucket, lifecycle || undefined);
        if (entity) {
          entities.push(entity);
        }
      } catch (error) {
        this.logger.warn(`Failed to process R2 bucket ${bucket.name}: ${error}`);
      }
    }

    return entities;
  }

  private async discoverD1(): Promise<ResourceEntity[]> {
    const mapper = new D1EntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const databases = await this.client.d1.listDatabases();
    return databases.map(db => mapper.map(db)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverKV(): Promise<ResourceEntity[]> {
    const mapper = new KVEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const namespaces = await this.client.kv.listNamespaces();
    return namespaces.map(ns => mapper.map(ns)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverQueues(): Promise<ResourceEntity[]> {
    const mapper = new QueueEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const queues = await this.client.queues.listQueues();
    return queues.map(q => mapper.map(q)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverAIGateway(): Promise<ResourceEntity[]> {
    const mapper = new AIGatewayEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const gateways = await this.client.aiGateway.listGateways();
    return gateways.map(gw => mapper.map(gw)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverVectorize(): Promise<ResourceEntity[]> {
    const mapper = new VectorizeEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const indexes = await this.client.vectorize.listIndexes();
    return indexes.map(idx => mapper.map(idx)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverWorkflows(): Promise<ResourceEntity[]> {
    const mapper = new WorkflowEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const workflows = await this.client.workflows.listWorkflows();
    return workflows.map(wf => mapper.map(wf)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverDurableObjects(): Promise<ResourceEntity[]> {
    const mapper = new DurableObjectEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const classes = await this.client.durableObjects.listClasses();
    return classes.map(cls => mapper.map(cls)).filter(Boolean) as ResourceEntity[];
  }

  private async discoverAISearch(): Promise<ResourceEntity[]> {
    const mapper = new AISearchEntityMapper({
      accountId: this.config.accountId,
      defaultOwner: this.config.defaultOwner,
      defaultSystem: this.config.defaultSystem,
    });

    const indexes = await this.client.aiSearch.listIndexes();
    return indexes.map(idx => mapper.map(idx)).filter(Boolean) as ResourceEntity[];
  }
}
