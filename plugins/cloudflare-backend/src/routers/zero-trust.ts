import { Router } from 'express';
import { RouterOptions } from './workers';

/**
 * Zero Trust router - Access audit logs and users
 */
export function createZeroTrustRouter(options: RouterOptions): Router {
  const { logger, client, cache } = options;
  const router = Router();

  // GET /v1/zero-trust/users
  router.get('/v1/zero-trust/users', async (req, res) => {
    try {
      const { since, before } = req.query;
      const cacheKey = `zt:users:${since}:${before}`;

      if (cache) {
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      const users = await client.zeroTrust.getUsers({
        since: since as string,
        before: before as string,
      });

      if (cache) cache.set(cacheKey, users, 120);
      res.json(users);
    } catch (error) {
      logger.error('Error fetching Zero Trust users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // GET /v1/zero-trust/access/audit
  router.get('/v1/zero-trust/access/audit', async (req, res) => {
    try {
      const { actor, action, target, since, before, page, per_page } = req.query;
      
      const logs = await client.zeroTrust.getAuditLogs({
        actor: actor as string,
        action: action as string,
        target: target as string,
        since: since as string,
        before: before as string,
        page: page ? parseInt(page as string) : undefined,
        per_page: per_page ? parseInt(per_page as string) : undefined,
      });

      res.json(logs);
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // GET /v1/zero-trust/export/audit
  router.get('/v1/zero-trust/export/audit', async (req, res) => {
    try {
      const { since, before, download } = req.query;

      const snapshot = await client.zeroTrust.exportAuditLogs({
        since: since as string,
        before: before as string,
      });

      if (download === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="zt-audit-${snapshot.timestamp}.json"`);
      }

      res.json(snapshot);
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  });

  return router;
}
