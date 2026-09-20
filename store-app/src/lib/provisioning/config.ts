import path from 'path';

const storeAppRoot = path.resolve(process.cwd());

export const provisioningConfig = {
  storeAppRoot,
  templatesRoot: path.join(storeAppRoot, 'site-templates'),
  provisionedRoot: path.join(storeAppRoot, 'provisioned-sites'),
  nginxSitesDir: path.join(storeAppRoot, 'nginx', 'sites'),
  serverPublicIp: process.env.SERVER_PUBLIC_IP || '',
  coreServerPort: parseInt(process.env.CORE_SERVER_PORT || '4000', 10),
  /** @deprecated Per-tenant ports are no longer used — all vhosts proxy to core-server */
  portRangeStart: parseInt(process.env.PROVISION_PORT_START || '3001', 10),
  maxInstances: parseInt(process.env.MAX_PROVISIONED_INSTANCES || '100', 10),
  autoSsl: process.env.AUTO_SSL !== 'false',
  provisioningEnabled: process.env.PROVISIONING_ENABLED !== 'false',
  storeApiUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || '',
};

export function getTemplatePath(folderName: string): string {
  return path.join(provisioningConfig.templatesRoot, folderName);
}

export function getInstancePath(slug: string): string {
  return path.join(provisioningConfig.provisionedRoot, slug);
}
