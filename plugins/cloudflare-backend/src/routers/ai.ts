import { Router } from 'express';
import { RouterOptions } from './workers';

/**
 * AI services router - AI Gateway, Vectorize, Analytics Engine, AI Search
 */
export function createAIRouter(options: RouterOptions): Router {
  const { logger, client, cache } = options;
  const router = Router();

  // AI Gateway endpoints
  router.get('/v1/ai-gateway/:name/metrics', async (req, res) => {
    try {
      const { name } = req.params;
      const gateway = await client.aiGateway.getGateway(name);
      if (!gateway) {
        return res.status(404).json({ error: 'AI Gateway not found' });
      }
      // Simplified metrics response
      res.json({
        name: gateway.name,
        providers: gateway.providers,
        caching: gateway.caching,
        retries: gateway.retries,
      });
    } catch (error) {
      logger.error(`Error fetching AI Gateway metrics:`, error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  router.get('/v1/ai-gateway/:name/config', async (req, res) => {
    try {
      const { name } = req.params;
      const gateway = await client.aiGateway.getGateway(name);
      if (!gateway) {
        return res.status(404).json({ error: 'AI Gateway not found' });
      }
      res.json(gateway);
    } catch (error) {
      logger.error(`Error fetching AI Gateway config:`, error);
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  });

  // Vectorize endpoints
  router.get('/v1/vectorize/indexes', async (req, res) => {
    try {
      const cacheKey = 'vectorize:indexes';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const indexes = await client.vectorize.listIndexes();
      if (cache) cache.set(cacheKey, indexes, 120);
      res.json(indexes);
    } catch (error) {
      logger.error('Error fetching Vectorize indexes:', error);
      res.status(500).json({ error: 'Failed to fetch indexes' });
    }
  });

  router.get('/v1/vectorize/:index/stats', async (req, res) => {
    try {
      const { index } = req.params;
      const indexData = await client.vectorize.getIndex(index);
      if (!indexData) {
        return res.status(404).json({ error: 'Index not found' });
      }
      res.json({
        name: indexData.name,
        dimensions: indexData.dimensions,
        metric: indexData.metric,
        vector_count: indexData.vector_count,
      });
    } catch (error) {
      logger.error(`Error fetching Vectorize stats:`, error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Analytics Engine endpoints
  router.get('/v1/analytics-engine/datasets', async (req, res) => {
    try {
      const cacheKey = 'ae:datasets';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const datasets = await client.analyticsEngine.listDatasets();
      if (cache) cache.set(cacheKey, datasets, 120);
      res.json(datasets);
    } catch (error) {
      logger.error('Error fetching Analytics Engine datasets:', error);
      res.status(500).json({ error: 'Failed to fetch datasets' });
    }
  });

  // AI Search endpoints
  router.get('/v1/ai-search/indexes', async (req, res) => {
    try {
      const cacheKey = 'ai-search:indexes';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const indexes = await client.aiSearch.listIndexes();
      if (cache) cache.set(cacheKey, indexes, 120);
      res.json(indexes);
    } catch (error) {
      logger.error('Error fetching AI Search indexes:', error);
      res.status(500).json({ error: 'Failed to fetch indexes' });
    }
  });

  router.get('/v1/ai-search/:index/health', async (req, res) => {
    try {
      const { index } = req.params;
      const indexData = await client.aiSearch.getIndex(index);
      if (!indexData) {
        return res.status(404).json({ error: 'Index not found' });
      }
      res.json({
        name: indexData.name,
        connectors: indexData.connectors,
        last_crawl_at: indexData.last_crawl_at,
        document_count: indexData.document_count,
        status: indexData.last_crawl_at ? 'healthy' : 'unknown',
      });
    } catch (error) {
      logger.error(`Error fetching AI Search health:`, error);
      res.status(500).json({ error: 'Failed to fetch health' });
    }
  });

  return router;
}
