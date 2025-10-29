import fetch from 'node-fetch';
import { CloudflareApiResponse } from './types';

export interface CloudflareClientConfig {
  accountId: string;
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Base client for Cloudflare API interactions
 */
export class CloudflareBaseClient {
  protected accountId: string;
  protected apiToken: string;
  protected baseUrl: string;
  protected timeout: number;
  protected maxRetries: number;

  constructor(config: CloudflareClientConfig) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.cloudflare.com/client/v4';
    this.timeout = config.timeout || 15000;
    this.maxRetries = config.maxRetries || 3;
  }

  protected async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<CloudflareApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `Cloudflare API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`,
          );
        }

        return data as CloudflareApiResponse<T>;
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  protected async get<T>(path: string): Promise<CloudflareApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  protected async post<T>(path: string, body?: any): Promise<CloudflareApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async put<T>(path: string, body?: any): Promise<CloudflareApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  protected async delete<T>(path: string): Promise<CloudflareApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
