import { CloudflareBaseClient } from './base';
import { CfPagesProject, CfPagesDeployment } from './types';

/**
 * Client for Cloudflare Pages API
 */
export class PagesClient extends CloudflareBaseClient {
  /**
   * List all Pages projects
   */
  async listProjects(): Promise<CfPagesProject[]> {
    const response = await this.get<CfPagesProject[]>(
      `/accounts/${this.accountId}/pages/projects`,
    );
    return response.result || [];
  }

  /**
   * Get a specific Pages project
   */
  async getProject(projectName: string): Promise<CfPagesProject | null> {
    try {
      const response = await this.get<CfPagesProject>(
        `/accounts/${this.accountId}/pages/projects/${projectName}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }

  /**
   * List deployments for a Pages project
   */
  async listDeployments(projectName: string, page = 1, perPage = 25): Promise<CfPagesDeployment[]> {
    try {
      const response = await this.get<CfPagesDeployment[]>(
        `/accounts/${this.accountId}/pages/projects/${projectName}/deployments?page=${page}&per_page=${perPage}`,
      );
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(projectName: string, deploymentId: string): Promise<CfPagesDeployment | null> {
    try {
      const response = await this.get<CfPagesDeployment>(
        `/accounts/${this.accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the latest production deployment for a Pages project
   */
  async getLatestProductionDeployment(projectName: string): Promise<CfPagesDeployment | null> {
    const deployments = await this.listDeployments(projectName, 1, 10);
    const productionDeployments = deployments.filter(d => d.environment === 'production');
    if (productionDeployments.length === 0) {
      return null;
    }
    // Sort by created_on descending
    return productionDeployments.sort((a, b) => {
      const dateA = new Date(a.created_on).getTime();
      const dateB = new Date(b.created_on).getTime();
      return dateB - dateA;
    })[0];
  }
}
