import dns from 'dns/promises';
import type { SiteInstanceDnsCheck } from '@/types/site-provisioning';
import { provisioningConfig } from './config';

export interface DnsCheckResult {
  isVerified: boolean;
  dnsCheck: SiteInstanceDnsCheck;
}

export async function checkDomainDns(
  domain: string,
  expectedIp?: string
): Promise<DnsCheckResult> {
  const ip = expectedIp || provisioningConfig.serverPublicIp;
  const now = new Date().toISOString();

  if (!ip) {
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
    const isVerified = resolvedIps.includes(ip);

    return {
      isVerified,
      dnsCheck: {
        lastCheckedAt: now,
        resolvedIps,
        expectedIp: ip,
        isVerified,
        failureReason: isVerified
          ? undefined
          : resolvedIps.length === 0
            ? 'not_set'
            : 'wrong_ip',
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
        expectedIp: ip,
        isVerified: false,
        failureReason: code === 'ENOTFOUND' || code === 'ENODATA' ? 'nxdomain' : 'error',
      },
    };
  }
}
