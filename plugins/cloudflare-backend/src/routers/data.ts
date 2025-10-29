import { Router } from 'express';
import { RouterOptions } from './workers';

/**
 * Data services router - R2, D1, KV, Queues
 */
export function createDataRouter(options: RouterOptions): Router {
  const { logger, client, cache } = options;
  const router = Router();

  // R2 endpoints
  router.get('/v1/r2/buckets', async (req, res) => {
    try {
      const cacheKey = 'r2:buckets';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const buckets = await client.r2.listBuckets();
      if (cache) cache.set(cacheKey, buckets, 120);
      res.json(buckets);
    } catch (error) {
      logger.error('Error fetching R2 buckets:', error);
      res.status(500).json({ error: 'Failed to fetch buckets' });
    }
  });

  router.get('/v1/r2/:bucket/lifecycle', async (req, res) => {
    try {
      const { bucket } = req.params;
      const lifecycle = await client.r2.getLifecycle(bucket);
      res.json(lifecycle || { rules: [] });
    } catch (error) {
      logger.error(`Error fetching lifecycle for ${req.params.bucket}:`, error);
      res.status(500).json({ error: 'Failed to fetch lifecycle' });
    }
  });

  router.get('/v1/r2/:bucket/lifecycle/export', async (req, res) => {
    try {
      const { bucket } = req.params;
      const { download } = req.query;

      const snapshot = await client.r2.exportLifecycle(bucket);
      if (!snapshot) {
        return res.status(404).json({ error: 'Bucket not found or no lifecycle' });
      }

      if (download === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="r2-lifecycle-${bucket}-${snapshot.timestamp}.json"`);
      }

      res.json(snapshot);
    } catch (error) {
      logger.error(`Error exporting lifecycle for ${req.params.bucket}:`, error);
      res.status(500).json({ error: 'Failed to export lifecycle' });
    }
  });

  // D1 endpoints
  router.get('/v1/d1/databases', async (req, res) => {
    try {
      const cacheKey = 'd1:databases';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const databases = await client.d1.listDatabases();
      if (cache) cache.set(cacheKey, databases, 120);
      res.json(databases);
    } catch (error) {
      logger.error('Error fetching D1 databases:', error);
      res.status(500).json({ error: 'Failed to fetch databases' });
    }
  });

  router.get('/v1/d1/:db/metadata', async (req, res) => {
    try {
      const { db } = req.params;
      const database = await client.d1.getDatabase(db);
      if (!database) {
        return res.status(404).json({ error: 'Database not found' });
      }
      res.json({
        uuid: database.uuid,
        name: database.name,
        created_at: database.created_at,
        file_size: database.file_size,
        num_tables: database.num_tables,
      });
    } catch (error) {
      logger.error(`Error fetching D1 metadata for ${req.params.db}:`, error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // KV endpoints
  router.get('/v1/kv/namespaces', async (req, res) => {
    try {
      const cacheKey = 'kv:namespaces';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const namespaces = await client.kv.listNamespaces();
      if (cache) cache.set(cacheKey, namespaces, 120);
      res.json(namespaces);
    } catch (error) {
      logger.error('Error fetching KV namespaces:', error);
      res.status(500).json({ error: 'Failed to fetch namespaces' });
    }
  });

  router.get('/v1/kv/:namespace/keys', async (req, res) => {
    try {
      const { namespace } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const prefix = req.query.prefix as string;

      const keys = await client.kv.listKeys(namespace, limit, prefix);
      res.json(keys);
    } catch (error) {
      logger.error(`Error fetching keys for namespace ${req.params.namespace}:`, error);
      res.status(500).json({ error: 'Failed to fetch keys' });
    }
  });

  router.get('/v1/kv/:namespace/sample', async (req, res) => {
    try {
      const { namespace } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const keys = await client.kv.listKeys(namespace, limit);
      // Return sample (keys only, no values for safety)
      res.json(keys.map(k => ({ name: k.name, metadata: k.metadata })));
    } catch (error) {
      logger.error(`Error fetching sample for namespace ${req.params.namespace}:`, error);
      res.status(500).json({ error: 'Failed to fetch sample' });
    }
  });

  // Queues endpoints
  router.get('/v1/queues', async (req, res) => {
    try {
      const cacheKey = 'queues:list';
      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const queues = await client.queues.listQueues();
      if (cache) cache.set(cacheKey, queues, 120);
      res.json(queues);
    } catch (error) {
      logger.error('Error fetching queues:', error);
      res.status(500).json({ error: 'Failed to fetch queues' });
    }
  });

  router.get('/v1/queues/:name/metrics', async (req, res) => {
    try {
      const { name } = req.params;
      const queue = await client.queues.getQueue(name);
      if (!queue) {
        return res.status(404).json({ error: 'Queue not found' });
      }
      // Note: Actual metrics would require additional API calls
      res.json({
        queue_name: queue.queue_name,
        producers_count: queue.producers_total_count || 0,
        consumers_count: queue.consumers_total_count || 0,
      });
    } catch (error) {
      logger.error(`Error fetching metrics for queue ${req.params.name}:`, error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  return router;
}
