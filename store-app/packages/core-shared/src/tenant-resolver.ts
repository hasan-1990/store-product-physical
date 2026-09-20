import type { SiteInstanceRecord } from './types';
import { connectHubDb } from './mongodb';
import { normalizeHost } from './host';
import { coreConfig } from './config';

type CacheEntry = {
  instance: SiteInstanceRecord | null;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function getCached(host: string): SiteInstanceRecord | null | undefined {
  const entry = cache.get(host);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(host);
    return undefined;
  }
  return entry.instance;
}

function setCache(host: string, instance: SiteInstanceRecord | null): void {
  cache.set(host, {
    instance,
    expiresAt: Date.now() + coreConfig.tenantCacheTtlMs,
  });
}

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveSiteInstance(host: string): Promise<SiteInstanceRecord | null> {
  const normalized = normalizeHost(host);
  const cached = getCached(normalized);
  if (cached !== undefined) return cached;

  const db = await connectHubDb();
  const doc = await db.collection('siteInstances').findOne({
    domain: normalized,
    status: { $in: ['active', 'dns_verified'] },
  });

  if (!doc) {
    setCache(normalized, null);
    return null;
  }

  const instance: SiteInstanceRecord = {
    _id: doc._id?.toString(),
    slug: String(doc.slug),
    domain: String(doc.domain),
    templateSlug: String(doc.templateSlug),
    status: doc.status as SiteInstanceRecord['status'],
    databaseName: String(doc.databaseName),
    licenseKey: String(doc.licenseKey),
    folderPath: doc.folderPath ? String(doc.folderPath) : undefined,
  };

  setCache(normalized, instance);
  return instance;
}
