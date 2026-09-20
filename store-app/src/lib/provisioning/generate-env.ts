import fs from 'fs-extra';
import path from 'path';
import { getInstancePath, provisioningConfig } from './config';
import { slugToDatabaseName } from './domain-utils';

export interface InstanceEnvParams {
  slug: string;
  domain: string;
  licenseKey: string;
  port: number;
}

export async function writeInstanceEnv(params: InstanceEnvParams): Promise<void> {
  const { slug, domain, licenseKey, port } = params;
  const dbName = slugToDatabaseName(slug);
  const instancePath = getInstancePath(slug);

  const baseUri = provisioningConfig.mongoUri.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);

  const envContent = `# Auto-generated — do not edit manually
APP_NAME=${slug}
APP_URL=https://${domain}
NODE_ENV=production
PORT=${port}
MONGODB_URI=${baseUri}
LICENSE_DOMAIN=${domain}
LICENSE_KEY=${licenseKey}
STORE_API_URL=${provisioningConfig.storeApiUrl}
INSTANCE_SLUG=${slug}
DNS_VERIFIED=false
`;

  await fs.writeFile(path.join(instancePath, '.env.local'), envContent, 'utf8');
}

export async function updateInstanceEnvFlag(
  slug: string,
  key: string,
  value: string
): Promise<void> {
  const envPath = path.join(getInstancePath(slug), '.env.local');
  if (!(await fs.pathExists(envPath))) return;

  let content = await fs.readFile(envPath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `${key}=${value}\n`;
  }
  await fs.writeFile(envPath, content, 'utf8');
}
