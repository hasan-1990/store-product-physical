import dns from 'dns/promises';
import type { Db } from 'mongodb';
import { clearTenantCache } from '@core-shared';

export type DnsCheckPayload = {
  lastCheckedAt: string;
  resolvedIps: string[];
  expectedIp: string;
  isVerified: boolean;
  failureReason?: string;
};

export async function checkDomainDns(
  domain: string,
  expectedIp = process.env.SERVER_PUBLIC_IP || '',
): Promise<{ isVerified: boolean; dnsCheck: DnsCheckPayload }> {
  const now = new Date().toISOString();

  if (!expectedIp) {
    return {
      isVerified: false,
      dnsCheck: {
        lastCheckedAt: now,
        resolvedIps: [],
        expectedIp: '',
        isVerified: false,
        failureReason: 'error',
      },
    };
  }

  try {
    const resolvedIps = await dns.resolve4(domain);
    const isVerified = resolvedIps.includes(expectedIp);
    return {
      isVerified,
      dnsCheck: {
        lastCheckedAt: now,
        resolvedIps,
        expectedIp,
        isVerified,
        failureReason: isVerified ? undefined : resolvedIps.length === 0 ? 'not_set' : 'wrong_ip',
      },
    };
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : '';
    return {
      isVerified: false,
      dnsCheck: {
        lastCheckedAt: now,
        resolvedIps: [],
        expectedIp,
        isVerified: false,
        failureReason: code === 'ENOTFOUND' || code === 'ENODATA' ? 'nxdomain' : 'error',
      },
    };
  }
}

export async function checkAndUpdateInstanceDns(db: Db, slug: string) {
  const instance = await db.collection('siteInstances').findOne({ slug });
  if (!instance) return null;

  const status = String(instance.status);
  if (status === 'suspended' || status === 'failed') {
    return instance;
  }

  const { isVerified, dnsCheck } = await checkDomainDns(String(instance.domain));

  if (isVerified) {
    await db.collection('siteInstances').updateOne(
      { slug },
      {
        $set: {
          status: 'active',
          sslStatus: 'pending',
          dnsCheck,
          updatedAt: new Date().toISOString(),
        },
      },
    );
  } else {
    const newStatus = dnsCheck.resolvedIps.length > 0 ? 'dns_mismatch' : 'awaiting_dns';
    await db.collection('siteInstances').updateOne(
      { slug },
      {
        $set: {
          status: newStatus,
          dnsCheck,
          updatedAt: new Date().toISOString(),
        },
      },
    );
  }

  clearTenantCache();
  return db.collection('siteInstances').findOne({ slug });
}

export async function verifyInstanceLicense(
  db: Db,
  slug: string,
  domain: string,
  licenseKey: string,
): Promise<{ valid: boolean; reason?: string }> {
  const instance = await db.collection('siteInstances').findOne({ slug });
  if (!instance) return { valid: false, reason: 'instance_not_found' };
  if (String(instance.licenseKey) !== licenseKey) return { valid: false, reason: 'invalid_license' };
  if (String(instance.domain) !== domain.replace(/^www\./, '').toLowerCase()) {
    return { valid: false, reason: 'domain_mismatch' };
  }
  if (!['active', 'dns_verified'].includes(String(instance.status))) {
    return { valid: false, reason: 'not_active' };
  }
  return { valid: true };
}
