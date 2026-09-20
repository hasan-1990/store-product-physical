export type SiteInstanceStatus =
  | 'pending'
  | 'provisioning'
  | 'awaiting_dns'
  | 'dns_mismatch'
  | 'dns_verified'
  | 'active'
  | 'suspended'
  | 'failed';

export type ProvisioningType = 'download' | 'managed-site';

export interface SiteTemplateSeo {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface SiteTemplate {
  _id?: string;
  slug: string;
  name: string;
  folderPath: string;
  shortDescription: string;
  description: string;
  thumbnail?: string;
  gallery?: string[];
  features?: string[];
  version?: string;
  demoUrl?: string;
  active: boolean;
  seo: SiteTemplateSeo;
  basePrice?: number;
  linkedProductId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteInstanceDnsCheck {
  lastCheckedAt?: string;
  resolvedIps: string[];
  expectedIp: string;
  isVerified: boolean;
  failureReason?: 'wrong_ip' | 'not_set' | 'nxdomain' | 'error';
}

export interface SiteInstanceTenantAdmin {
  email: string;
  password: string;
  loginPath: string;
}

export interface SiteInstance {
  _id?: string;
  slug: string;
  domain: string;
  userId: string;
  userEmail?: string;
  orderId: string;
  productId: string;
  productName?: string;
  templateSlug: string;
  templateId?: string;
  status: SiteInstanceStatus;
  folderPath: string;
  databaseName: string;
  appName: string;
  /** @deprecated Per-tenant ports removed — all traffic goes to core-server */
  port?: number;
  tenantAdmin?: SiteInstanceTenantAdmin;
  nginxConfigPath?: string;
  sslStatus: 'pending' | 'active' | 'failed';
  dnsRecords: {
    type: 'A';
    host: string;
    value: string;
  };
  dnsCheck: SiteInstanceDnsCheck;
  licenseKey: string;
  errorLog?: string;
  provisionLog?: string[];
  createdAt: string;
  updatedAt: string;
}
