import { CloudflareBaseClient } from './base';
import { CfD1Db, CfKvNamespace, CfKvKey, CfQueue } from './types';

/**
 * Client for Cloudflare D1 API
 */
export class D1Client extends CloudflareBaseClient {
  async listDatabases(): Promise<CfD1Db[]> {
    const response = await this.get<CfD1Db[]>(
      `/accounts/${this.accountId}/d1/database`,
    );
    return response.result || [];
  }

  async getDatabase(databaseId: string): Promise<CfD1Db | null> {
    try {
      const response = await this.get<CfD1Db>(
        `/accounts/${this.accountId}/d1/database/${databaseId}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Client for Cloudflare KV API
 */
export class KVClient extends CloudflareBaseClient {
  async listNamespaces(): Promise<CfKvNamespace[]> {
    const response = await this.get<CfKvNamespace[]>(
      `/accounts/${this.accountId}/storage/kv/namespaces`,
    );
    return response.result || [];
  }

  async getNamespace(namespaceId: string): Promise<CfKvNamespace | null> {
    try {
      const namespaces = await this.listNamespaces();
      return namespaces.find(ns => ns.id === namespaceId) || null;
    } catch (error) {
      return null;
    }
  }

  async listKeys(namespaceId: string, limit = 100, prefix?: string): Promise<CfKvKey[]> {
    try {
      let path = `/accounts/${this.accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=${limit}`;
      if (prefix) {
        path += `&prefix=${encodeURIComponent(prefix)}`;
      }
      const response = await this.get<CfKvKey[]>(path);
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Client for Cloudflare Queues API
 */
export class QueuesClient extends CloudflareBaseClient {
  async listQueues(): Promise<CfQueue[]> {
    const response = await this.get<CfQueue[]>(
      `/accounts/${this.accountId}/queues`,
    );
    return response.result || [];
  }

  async getQueue(queueName: string): Promise<CfQueue | null> {
    try {
      const response = await this.get<CfQueue>(
        `/accounts/${this.accountId}/queues/${queueName}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }
}
