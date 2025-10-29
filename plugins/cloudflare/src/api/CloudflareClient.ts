import { createApiRef, DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';

export interface CloudflareApi {
  // Workers & Pages
  getWorkerDeployments(scriptName: string): Promise<any[]>;
  getPagesDeployments(projectName: string): Promise<any[]>;

  // Zero Trust
  getAuditLogs(params?: {
    actor?: string;
    action?: string;
    since?: string;
    before?: string;
  }): Promise<any[]>;

  // Data Services
  getR2Buckets(): Promise<any[]>;
  getR2Lifecycle(bucketName: string): Promise<any>;
  getD1Databases(): Promise<any[]>;
  getKVNamespaces(): Promise<any[]>;
  getQueues(): Promise<any[]>;

  // AI Services
  getVectorizeIndexes(): Promise<any[]>;
  getAIGateways(): Promise<any[]>;
  getAISearchIndexes(): Promise<any[]>;

  // Other Services
  getWorkflows(): Promise<any[]>;
  getDurableObjectClasses(): Promise<any[]>;
}

export const cloudflareApiRef = createApiRef<CloudflareApi>({
  id: 'plugin.cloudflare.service',
});

export class CloudflareClient implements CloudflareApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  constructor(options: { discoveryApi: DiscoveryApi; identityApi: IdentityApi }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }

  private async fetch<T>(path: string): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('cloudflare');
    const { token } = await this.identityApi.getCredentials();

    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkerDeployments(scriptName: string): Promise<any[]> {
    return this.fetch(`/v1/workers/${scriptName}/deployments`);
  }

  async getPagesDeployments(projectName: string): Promise<any[]> {
    return this.fetch(`/v1/pages/${projectName}/deployments`);
  }

  async getAuditLogs(params?: {
    actor?: string;
    action?: string;
    since?: string;
    before?: string;
  }): Promise<any[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.fetch(`/v1/zero-trust/access/audit${query ? `?${query}` : ''}`);
  }

  async getR2Buckets(): Promise<any[]> {
    return this.fetch('/v1/r2/buckets');
  }

  async getR2Lifecycle(bucketName: string): Promise<any> {
    return this.fetch(`/v1/r2/${bucketName}/lifecycle`);
  }

  async getD1Databases(): Promise<any[]> {
    return this.fetch('/v1/d1/databases');
  }

  async getKVNamespaces(): Promise<any[]> {
    return this.fetch('/v1/kv/namespaces');
  }

  async getQueues(): Promise<any[]> {
    return this.fetch('/v1/queues');
  }

  async getVectorizeIndexes(): Promise<any[]> {
    return this.fetch('/v1/vectorize/indexes');
  }

  async getAIGateways(): Promise<any[]> {
    return this.fetch('/v1/ai-gateway/gateways');
  }

  async getAISearchIndexes(): Promise<any[]> {
    return this.fetch('/v1/ai-search/indexes');
  }

  async getWorkflows(): Promise<any[]> {
    return this.fetch('/v1/workflows');
  }

  async getDurableObjectClasses(): Promise<any[]> {
    return this.fetch('/v1/durable-objects/classes');
  }
}
