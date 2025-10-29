import { Router } from 'express';
import { Logger } from 'winston';
import { CloudflareClient } from '@internal/cloudflare-client';
import NodeCache from 'node-cache';

export interface RouterOptions {
  logger: Logger;
  client: CloudflareClient;
  cache?: NodeCache;
}

/**
 * Workers & Pages router
 */
export function createWorkersRouter(options: RouterOptions): Router {
  const { logger, client, cache } = options;
  const router = Router();

  // GET /v1/workers/:script/deployments
  router.get('/v1/workers/:script/deployments', async (req, res) => {
    const { script } = req.params;
    const cacheKey = `workers:deployments:${script}`;

    try {
      // Check cache
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }

      const deployments = await client.workers.listDeployments(script);
      const result = deployments.map(d => ({
        id: d.id,
        version: d.versions?.[0]?.version_id,
        createdOn: d.created_on,
        env: 'production', // Could be enhanced to detect env
        commitSha: d.metadata?.commit_sha,
        ciRunUrl: d.metadata?.ci_run_url,
        status: 'active',
      }));

      if (cache) {
        cache.set(cacheKey, result, 60); // Cache for 60 seconds
      }

      res.json(result);
    } catch (error) {
      logger.error(`Error fetching deployments for worker ${script}:`, error);
      res.status(500).json({ error: 'Failed to fetch deployments' });
    }
  });

  // GET /v1/pages/:project/deployments
  router.get('/v1/pages/:project/deployments', async (req, res) => {
    const { project } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 25, 100);
    const cacheKey = `pages:deployments:${project}:${page}:${perPage}`;

    try {
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }

      const deployments = await client.pages.listDeployments(project, page, perPage);
      const result = deployments.map(d => ({
        id: d.id,
        createdAt: d.created_on,
        branch: d.deployment_trigger?.metadata?.branch,
        commitSha: d.deployment_trigger?.metadata?.commit_hash,
        status: d.latest_stage?.status,
        url: d.url,
        environment: d.environment,
      }));

      if (cache) {
        cache.set(cacheKey, result, 60);
      }

      res.json(result);
    } catch (error) {
      logger.error(`Error fetching deployments for Pages project ${project}:`, error);
      res.status(500).json({ error: 'Failed to fetch deployments' });
    }
  });

  return router;
}
