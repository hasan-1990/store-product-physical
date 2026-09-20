import path from 'path';

const storeAppRoot = path.resolve(__dirname, '../../..');

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const coreConfig = {
  storeAppRoot,
  get port(): number {
    return envInt('CORE_SERVER_PORT', 4000);
  },
  get hubDomains(): string {
    return process.env.HUB_DOMAINS || 'localhost,127.0.0.1,fathemes.com,www.fathemes.com';
  },
  get mongoUri(): string {
    return (
      process.env.MONGODB_URI?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      'mongodb://127.0.0.1:27017/store-app'
    );
  },
  get redisUrl(): string {
    return process.env.REDIS_URL?.trim() || '';
  },
  get tenantCacheTtlMs(): number {
    return envInt('TENANT_CACHE_TTL_MS', 300_000);
  },
  provisionedRoot: path.join(storeAppRoot, 'provisioned-sites'),
  templatesRoot: path.join(storeAppRoot, 'site-templates'),
};
