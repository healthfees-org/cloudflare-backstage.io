import { CloudflareBaseClient } from './base';
import { CfR2Bucket, CfR2Lifecycle } from './types';
import { createHash } from 'crypto';

/**
 * Client for Cloudflare R2 API
 */
export class R2Client extends CloudflareBaseClient {
  /**
   * List all R2 buckets
   */
  async listBuckets(): Promise<CfR2Bucket[]> {
    const response = await this.get<{ buckets: CfR2Bucket[] }>(
      `/accounts/${this.accountId}/r2/buckets`,
    );
    return response.result?.buckets || [];
  }

  /**
   * Get a specific R2 bucket
   */
  async getBucket(bucketName: string): Promise<CfR2Bucket | null> {
    try {
      const buckets = await this.listBuckets();
      return buckets.find(b => b.name === bucketName) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get lifecycle configuration for a bucket
   */
  async getLifecycle(bucketName: string): Promise<CfR2Lifecycle | null> {
    try {
      const response = await this.get<CfR2Lifecycle>(
        `/accounts/${this.accountId}/r2/buckets/${bucketName}/lifecycle`,
      );
      return response.result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Export lifecycle configuration as JSON snapshot with hash
   */
  async exportLifecycle(bucketName: string): Promise<{ data: CfR2Lifecycle; hash: string; timestamp: string } | null> {
    const lifecycle = await this.getLifecycle(bucketName);
    if (!lifecycle) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const dataStr = JSON.stringify({ lifecycle, timestamp }, null, 2);
    
    // Use SHA256 for proper integrity verification
    const hash = createHash('sha256').update(dataStr).digest('hex');

    return {
      data: lifecycle,
      hash: `sha256:${hash}`,
      timestamp,
    };
  }
}
