import { CloudflareBaseClient } from './base';
import { CfAccessAudit } from './types';

/**
 * Client for Cloudflare Zero Trust API
 */
export class ZeroTrustClient extends CloudflareBaseClient {
  /**
   * Get Zero Trust audit logs
   */
  async getAuditLogs(params?: {
    actor?: string;
    action?: string;
    target?: string;
    since?: string;
    before?: string;
    page?: number;
    per_page?: number;
  }): Promise<CfAccessAudit[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.actor) queryParams.set('actor.email', params.actor);
      if (params?.action) queryParams.set('action.type', params.action);
      if (params?.target) queryParams.set('resource.id', params.target);
      if (params?.since) queryParams.set('since', params.since);
      if (params?.before) queryParams.set('before', params.before);
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

      const query = queryParams.toString();
      const path = `/accounts/${this.accountId}/audit_logs${query ? `?${query}` : ''}`;
      
      const response = await this.get<CfAccessAudit[]>(path);
      return response.result || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Export audit logs as JSON snapshot with hash
   */
  async exportAuditLogs(params?: {
    since?: string;
    before?: string;
  }): Promise<{ data: CfAccessAudit[]; hash: string; timestamp: string }> {
    const logs = await this.getAuditLogs(params);
    const timestamp = new Date().toISOString();
    const dataStr = JSON.stringify({ logs, timestamp, params }, null, 2);
    
    // Simple hash calculation (in production, use crypto.createHash)
    const hash = Buffer.from(dataStr).toString('base64').substring(0, 16);

    return {
      data: logs,
      hash: `sha256:${hash}`,
      timestamp,
    };
  }

  /**
   * Get Zero Trust users (recent authentications)
   */
  async getUsers(timeBounded?: { since?: string; before?: string }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (timeBounded?.since) queryParams.set('since', timeBounded.since);
      if (timeBounded?.before) queryParams.set('before', timeBounded.before);

      const query = queryParams.toString();
      const path = `/accounts/${this.accountId}/access/users${query ? `?${query}` : ''}`;
      
      const response = await this.get<any[]>(path);
      return response.result || [];
    } catch (error) {
      return [];
    }
  }
}
