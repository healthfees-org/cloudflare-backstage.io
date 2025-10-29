import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import NodeCache from 'node-cache';
import { CloudflareClient } from '@internal/cloudflare-client';
import { createWorkersRouter } from './routers/workers';
import { createZeroTrustRouter } from './routers/zero-trust';
import { createDataRouter } from './routers/data';
import { createAIRouter } from './routers/ai';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  // Initialize Cloudflare client
  const client = new CloudflareClient({
    accountId: config.getString('cloudflare.accountId'),
    apiToken: config.getString('cloudflare.apiToken'),
    timeout: config.getOptionalNumber('cloudflare.fetch.timeoutMs') || 15000,
    maxRetries: config.getOptionalNumber('cloudflare.fetch.maxRetries') || 3,
  });

  // Initialize response cache
  const cache = new NodeCache({
    stdTTL: 60, // Default TTL of 60 seconds
    checkperiod: 120, // Cleanup every 2 minutes
  });

  const router = Router();
  router.use(express.json());

  // Health check
  router.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  // Mount sub-routers
  const routerOpts = { logger, client, cache };
  
  router.use('/', createWorkersRouter(routerOpts));
  router.use('/', createZeroTrustRouter(routerOpts));
  router.use('/', createDataRouter(routerOpts));
  router.use('/', createAIRouter(routerOpts));

  // Additional service routers
  router.get('/v1/secrets-store/stores', async (req, res) => {
    try {
      const cacheKey = 'secrets:stores';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const stores = await client.secretsStore.listStores();
      cache.set(cacheKey, stores, 120);
      res.json(stores);
    } catch (error) {
      logger.error('Error fetching secrets stores:', error);
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  });

  router.get('/v1/secrets-store/:store/metadata', async (req, res) => {
    try {
      // Metadata only - never return secret values
      const stores = await client.secretsStore.listStores();
      const store = stores.find(s => s.id === req.params.store);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({
        id: store.id,
        created: store.created,
        modified: store.modified,
        secret_count: store.secret_count,
      });
    } catch (error) {
      logger.error('Error fetching secrets store metadata:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  router.get('/v1/hyperdrive/configs', async (req, res) => {
    try {
      const cacheKey = 'hyperdrive:configs';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const configs = await client.hyperdrive.listConfigs();
      cache.set(cacheKey, configs, 120);
      res.json(configs);
    } catch (error) {
      logger.error('Error fetching Hyperdrive configs:', error);
      res.status(500).json({ error: 'Failed to fetch configs' });
    }
  });

  router.get('/v1/containers/services', async (req, res) => {
    try {
      const cacheKey = 'containers:services';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const services = await client.containers.listServices();
      cache.set(cacheKey, services, 120);
      res.json(services);
    } catch (error) {
      logger.error('Error fetching container services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  router.get('/v1/workflows', async (req, res) => {
    try {
      const cacheKey = 'workflows:list';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const workflows = await client.workflows.listWorkflows();
      cache.set(cacheKey, workflows, 120);
      res.json(workflows);
    } catch (error) {
      logger.error('Error fetching workflows:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  });

  router.get('/v1/workflows/:name/runs', async (req, res) => {
    try {
      const { name } = req.params;
      const { from, to } = req.query;
      
      const workflow = await client.workflows.getWorkflow(name);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const runs = await client.workflows.listRuns(
        workflow.id!,
        from as string,
        to as string,
      );
      res.json(runs);
    } catch (error) {
      logger.error('Error fetching workflow runs:', error);
      res.status(500).json({ error: 'Failed to fetch runs' });
    }
  });

  router.get('/v1/durable-objects/classes', async (req, res) => {
    try {
      const cacheKey = 'do:classes';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const classes = await client.durableObjects.listClasses();
      cache.set(cacheKey, classes, 120);
      res.json(classes);
    } catch (error) {
      logger.error('Error fetching Durable Object classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  router.get('/v1/browser-rendering/quotas', async (req, res) => {
    try {
      const cacheKey = 'br:quotas';
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const quotas = await client.browserRendering.getQuotas();
      cache.set(cacheKey, quotas, 120);
      res.json(quotas || {});
    } catch (error) {
      logger.error('Error fetching browser rendering quotas:', error);
      res.status(500).json({ error: 'Failed to fetch quotas' });
    }
  });

  router.use(errorHandler());

  return router;
}
