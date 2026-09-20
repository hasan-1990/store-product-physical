import fs from 'fs-extra';
import path from 'path';
import { getTemplatePath } from './config';
import { getTenantAdminCredentials } from './tenant-admin';
import { tenantMongoUri } from './tenant-mongo-uri';

export async function seedTenantDatabase(slug: string, templateFolder: string): Promise<void> {
  const templatePath = getTemplatePath(templateFolder);
  const seedScript = path.join(templatePath, 'scripts', 'seed.ts');

  if (!(await fs.pathExists(seedScript))) {
    console.warn(`[provisioning] seed script not found for ${templateFolder}, skipping seed`);
    return;
  }

  const { email, password } = getTenantAdminCredentials();
  const { execa } = await import('execa');

  await execa('npx', ['tsx', seedScript], {
    cwd: templatePath,
    env: {
      ...process.env,
      MONGODB_URI: tenantMongoUri(slug),
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
    },
    stdio: 'pipe',
  });
}
