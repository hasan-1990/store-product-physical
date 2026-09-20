import { provisioningConfig } from './config';
import { slugToDatabaseName } from './domain-utils';

export function tenantMongoUri(slug: string): string {
  const dbName = slugToDatabaseName(slug);
  const uri = provisioningConfig.mongoUri;

  if (!uri) {
    throw new Error('MONGODB_URI تنظیم نشده است');
  }

  return uri.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);
}
