export type SiteInstanceStatus =
  | 'pending'
  | 'provisioning'
  | 'awaiting_dns'
  | 'dns_mismatch'
  | 'dns_verified'
  | 'active'
  | 'suspended'
  | 'failed';

export type SiteInstanceRecord = {
  _id?: string;
  slug: string;
  domain: string;
  templateSlug: string;
  status: SiteInstanceStatus;
  databaseName: string;
  licenseKey: string;
  folderPath?: string;
};

export type HubRequestContext = {
  type: 'hub';
  host: string;
};

export type TenantRequestContext = {
  type: 'tenant';
  host: string;
  instance: SiteInstanceRecord;
  databaseName: string;
  templateSlug: string;
  uploadsDir: string;
};

export type RequestContext = HubRequestContext | TenantRequestContext;
