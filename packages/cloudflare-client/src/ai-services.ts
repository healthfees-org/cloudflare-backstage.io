import { CloudflareBaseClient } from './base';
import {
  CfAiGateway,
  CfVectorizeIndex,
  CfAnalyticsDataset,
  CfSecretsStore,
  CfHyperdrive,
  CfContainerService,
  CfWorkflow,
  CfWorkflowRun,
  CfDurableObject,
  CfAiSearchIndex,
  CfBrowserRendering,
} from './types';

/**
 * Client for Cloudflare AI Gateway API
 */
export class AIGatewayClient extends CloudflareBaseClient {
  async listGateways(): Promise<CfAiGateway[]> {
    try {
      const response = await this.get<CfAiGateway[]>(
        `/accounts/${this.accountId}/ai-gateway/gateways`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  async getGateway(gatewayId: string): Promise<CfAiGateway | null> {
    try {
      const response = await this.get<CfAiGateway>(
        `/accounts/${this.accountId}/ai-gateway/gateways/${gatewayId}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Client for Cloudflare Vectorize API
 */
export class VectorizeClient extends CloudflareBaseClient {
  async listIndexes(): Promise<CfVectorizeIndex[]> {
    try {
      const response = await this.get<CfVectorizeIndex[]>(
        `/accounts/${this.accountId}/vectorize/indexes`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  async getIndex(indexName: string): Promise<CfVectorizeIndex | null> {
    try {
      const response = await this.get<CfVectorizeIndex>(
        `/accounts/${this.accountId}/vectorize/indexes/${indexName}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Client for Cloudflare Analytics Engine API
 */
export class AnalyticsEngineClient extends CloudflareBaseClient {
  async listDatasets(): Promise<CfAnalyticsDataset[]> {
    try {
      // Note: This endpoint may vary based on actual API
      const response = await this.get<CfAnalyticsDataset[]>(
        `/accounts/${this.accountId}/analytics_engine/datasets`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare Secrets Store API
 */
export class SecretsStoreClient extends CloudflareBaseClient {
  async listStores(): Promise<CfSecretsStore[]> {
    try {
      // Note: Metadata only - no secret values
      const response = await this.get<CfSecretsStore[]>(
        `/accounts/${this.accountId}/workers/secrets`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare Hyperdrive API
 */
export class HyperdriveClient extends CloudflareBaseClient {
  async listConfigs(): Promise<CfHyperdrive[]> {
    try {
      const response = await this.get<CfHyperdrive[]>(
        `/accounts/${this.accountId}/hyperdrive/configs`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  async getConfig(configId: string): Promise<CfHyperdrive | null> {
    try {
      const response = await this.get<CfHyperdrive>(
        `/accounts/${this.accountId}/hyperdrive/configs/${configId}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Client for Cloudflare Containers API
 */
export class ContainersClient extends CloudflareBaseClient {
  async listServices(): Promise<CfContainerService[]> {
    try {
      // Note: This endpoint may vary based on actual API
      const response = await this.get<CfContainerService[]>(
        `/accounts/${this.accountId}/workers/containers`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare Workflows API
 */
export class WorkflowsClient extends CloudflareBaseClient {
  async listWorkflows(): Promise<CfWorkflow[]> {
    try {
      const response = await this.get<CfWorkflow[]>(
        `/accounts/${this.accountId}/workflows`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  async getWorkflow(workflowId: string): Promise<CfWorkflow | null> {
    try {
      const response = await this.get<CfWorkflow>(
        `/accounts/${this.accountId}/workflows/${workflowId}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }

  async listRuns(workflowId: string, from?: string, to?: string): Promise<CfWorkflowRun[]> {
    try {
      let path = `/accounts/${this.accountId}/workflows/${workflowId}/runs`;
      const params = [];
      if (from) params.push(`from=${from}`);
      if (to) params.push(`to=${to}`);
      if (params.length > 0) path += `?${params.join('&')}`;
      
      const response = await this.get<CfWorkflowRun[]>(path);
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare Durable Objects API
 */
export class DurableObjectsClient extends CloudflareBaseClient {
  async listClasses(): Promise<CfDurableObject[]> {
    try {
      const response = await this.get<CfDurableObject[]>(
        `/accounts/${this.accountId}/workers/durable_objects/namespaces`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare AI Search API
 */
export class AISearchClient extends CloudflareBaseClient {
  async listIndexes(): Promise<CfAiSearchIndex[]> {
    try {
      // Note: This endpoint may vary based on actual API
      const response = await this.get<CfAiSearchIndex[]>(
        `/accounts/${this.accountId}/ai-search/indexes`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  async getIndex(indexName: string): Promise<CfAiSearchIndex | null> {
    try {
      const response = await this.get<CfAiSearchIndex>(
        `/accounts/${this.accountId}/ai-search/indexes/${indexName}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Client for Cloudflare Browser Rendering API
 */
export class BrowserRenderingClient extends CloudflareBaseClient {
  async getQuotas(): Promise<CfBrowserRendering | null> {
    try {
      // Note: This endpoint may vary based on actual API
      const response = await this.get<CfBrowserRendering>(
        `/accounts/${this.accountId}/browser-rendering/quotas`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}
