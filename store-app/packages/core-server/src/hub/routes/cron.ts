import type { Express } from 'express';
import { withHubAdmin } from '../middleware';
import { runBatchDnsCheck } from '../services/provisioning-bridge';

export function registerHubCronRoutes(app: Express): void {
  app.post(
    '/api/admin/cron/dns-check',
    withHubAdmin(async (_req, res) => {
      try {
        const result = await runBatchDnsCheck();
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در بررسی DNS',
        });
      }
    }),
  );
}
