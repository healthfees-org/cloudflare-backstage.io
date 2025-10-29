import { CloudflareBaseClient } from './base';
import { CfWorkerScript, CfWorkerDeployment } from './types';

/**
 * Client for Cloudflare Workers API
 */
export class WorkersClient extends CloudflareBaseClient {
  /**
   * List all Workers scripts
   */
  async listScripts(): Promise<CfWorkerScript[]> {
    const response = await this.get<CfWorkerScript[]>(
      `/accounts/${this.accountId}/workers/scripts`,
    );
    return response.result || [];
  }

  /**
   * Get a specific Worker script
   */
  async getScript(scriptName: string): Promise<CfWorkerScript | null> {
    try {
      const response = await this.get<CfWorkerScript>(
        `/accounts/${this.accountId}/workers/scripts/${scriptName}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }

  /**
   * List deployments for a Worker script
   */
  async listDeployments(scriptName: string): Promise<CfWorkerDeployment[]> {
    try {
      const response = await this.get<CfWorkerDeployment[]>(
        `/accounts/${this.accountId}/workers/scripts/${scriptName}/deployments`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the latest deployment for a Worker script
   */
  async getLatestDeployment(scriptName: string): Promise<CfWorkerDeployment | null> {
    const deployments = await this.listDeployments(scriptName);
    if (deployments.length === 0) {
      return null;
    }
    // Sort by created_on descending
    return deployments.sort((a, b) => {
      const dateA = new Date(a.created_on || 0).getTime();
      const dateB = new Date(b.created_on || 0).getTime();
      return dateB - dateA;
    })[0];
  }
}
