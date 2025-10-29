export * from './types';
export * from './base';
export * from './workers';
export * from './pages';
export * from './r2';
export * from './data';
export * from './ai-services';
export * from './zero-trust';

import { CloudflareClientConfig } from './base';
import { WorkersClient } from './workers';
import { PagesClient } from './pages';
import { R2Client } from './r2';
import { D1Client, KVClient, QueuesClient } from './data';
import {
  AIGatewayClient,
  VectorizeClient,
  AnalyticsEngineClient,
  SecretsStoreClient,
  HyperdriveClient,
  ContainersClient,
  WorkflowsClient,
  DurableObjectsClient,
  AISearchClient,
  BrowserRenderingClient,
} from './ai-services';
import { ZeroTrustClient } from './zero-trust';

/**
 * Main Cloudflare client aggregating all service clients
 */
export class CloudflareClient {
  public workers: WorkersClient;
  public pages: PagesClient;
  public r2: R2Client;
  public d1: D1Client;
  public kv: KVClient;
  public queues: QueuesClient;
  public aiGateway: AIGatewayClient;
  public vectorize: VectorizeClient;
  public analyticsEngine: AnalyticsEngineClient;
  public secretsStore: SecretsStoreClient;
  public hyperdrive: HyperdriveClient;
  public containers: ContainersClient;
  public workflows: WorkflowsClient;
  public durableObjects: DurableObjectsClient;
  public aiSearch: AISearchClient;
  public browserRendering: BrowserRenderingClient;
  public zeroTrust: ZeroTrustClient;

  constructor(config: CloudflareClientConfig) {
    this.workers = new WorkersClient(config);
    this.pages = new PagesClient(config);
    this.r2 = new R2Client(config);
    this.d1 = new D1Client(config);
    this.kv = new KVClient(config);
    this.queues = new QueuesClient(config);
    this.aiGateway = new AIGatewayClient(config);
    this.vectorize = new VectorizeClient(config);
    this.analyticsEngine = new AnalyticsEngineClient(config);
    this.secretsStore = new SecretsStoreClient(config);
    this.hyperdrive = new HyperdriveClient(config);
    this.containers = new ContainersClient(config);
    this.workflows = new WorkflowsClient(config);
    this.durableObjects = new DurableObjectsClient(config);
    this.aiSearch = new AISearchClient(config);
    this.browserRendering = new BrowserRenderingClient(config);
    this.zeroTrust = new ZeroTrustClient(config);
  }
}
