import fs from 'fs-extra';
import { connectDB } from '@/lib/mongodb';
import { clearTenantCache } from '@core-shared';
import { ObjectId } from 'mongodb';
import type { SiteInstance, SiteInstanceStatus } from '@/types/site-provisioning';
import { createInstanceDatabase } from './create-database';
import { ensureInstanceUploads } from './ensure-uploads';
import { writeNginxConfig, reloadNginx } from './nginx-config';
import { checkDomainDns } from './dns-checker';
import { domainToSlug, generateLicenseKey, normalizeDomain, slugToDatabaseName } from './domain-utils';
import { provisioningConfig } from './config';
import { getTenantAdminCredentials } from './tenant-admin';

export async function assertSlugAvailable(slug: string, domain: string): Promise<void> {
  const db = await connectDB();
  const existing = await db.siteInstances.findOne({
    $or: [{ slug }, { domain: normalizeDomain(domain) }],
  });
  if (existing) {
    throw new Error('این دامنه قبلاً ثبت شده است');
  }
}

export interface ProvisionParams {
  userId: string;
  userEmail?: string;
  orderId: string;
  productId: string;
  productName?: string;
  templateSlug: string;
  templateId?: string;
  templateFolder: string;
  domain: string;
}

export async function runProvision(params: ProvisionParams): Promise<SiteInstance> {
  const domain = normalizeDomain(params.domain);
  const slug = domainToSlug(domain);
  const now = new Date().toISOString();
  const licenseKey = generateLicenseKey();
  const expectedIp = provisioningConfig.serverPublicIp;
  const tenantAdmin = getTenantAdminCredentials();

  await assertSlugAvailable(slug, domain);
  await fs.ensureDir(provisioningConfig.provisionedRoot);

  const db = await connectDB();

  const instanceDoc: SiteInstance = {
    slug,
    domain,
    userId: params.userId,
    userEmail: params.userEmail,
    orderId: params.orderId,
    productId: params.productId,
    productName: params.productName,
    templateSlug: params.templateSlug,
    templateId: params.templateId,
    status: 'provisioning',
    folderPath: `provisioned-sites/${slug}`,
    databaseName: slugToDatabaseName(slug),
    appName: slug,
    sslStatus: 'pending',
    dnsRecords: { type: 'A', host: '@', value: expectedIp || 'تنظیم نشده' },
    dnsCheck: {
      resolvedIps: [],
      expectedIp: expectedIp || '',
      isVerified: false,
    },
    tenantAdmin: {
      email: tenantAdmin.email,
      password: tenantAdmin.password,
      loginPath: '/admin/login',
    },
    licenseKey,
    provisionLog: [`شروع provisioning در ${now}`],
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await db.siteInstances.insertOne(instanceDoc as any);
  const instanceId = insertResult.insertedId.toString();

  try {
    await ensureInstanceUploads(slug);
    instanceDoc.provisionLog?.push('پوشه uploads ایجاد شد');

    await createInstanceDatabase(slug, params.templateFolder);
    instanceDoc.provisionLog?.push(`دیتابیس ${instanceDoc.databaseName} + seed ایجاد شد`);

    const nginxPath = await writeNginxConfig(slug, domain, 'maintenance');
    instanceDoc.nginxConfigPath = nginxPath;
    await reloadNginx();
    instanceDoc.provisionLog?.push('Nginx (maintenance) تنظیم شد');

    instanceDoc.status = 'awaiting_dns';
    instanceDoc.updatedAt = new Date().toISOString();

    await db.siteInstances.updateOne(
      { _id: new ObjectId(instanceId) },
      {
        $set: {
          status: instanceDoc.status,
          nginxConfigPath: instanceDoc.nginxConfigPath,
          tenantAdmin: instanceDoc.tenantAdmin,
          provisionLog: instanceDoc.provisionLog,
          updatedAt: instanceDoc.updatedAt,
        },
      },
    );

    clearTenantCache();
    return { ...instanceDoc, _id: instanceId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای provisioning';
    await db.siteInstances.updateOne(
      { _id: new ObjectId(instanceId) },
      {
        $set: {
          status: 'failed' as SiteInstanceStatus,
          errorLog: message,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    throw error;
  }
}

export async function checkAndUpdateInstanceDns(slug: string): Promise<SiteInstance | null> {
  const db = await connectDB();
  const instance = (await db.siteInstances.findOne({ slug })) as SiteInstance | null;
  if (!instance) return null;

  if (instance.status === 'suspended' || instance.status === 'failed') {
    return instance;
  }

  const { isVerified, dnsCheck } = await checkDomainDns(instance.domain);

  if (isVerified) {
    await writeNginxConfig(instance.slug, instance.domain, 'active');
    await reloadNginx();

    await db.siteInstances.updateOne(
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
    const newStatus: SiteInstanceStatus =
      dnsCheck.resolvedIps.length > 0 ? 'dns_mismatch' : 'awaiting_dns';

    await db.siteInstances.updateOne(
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
  return (await db.siteInstances.findOne({ slug })) as SiteInstance | null;
}

export async function verifyInstanceLicense(
  slug: string,
  domain: string,
  licenseKey: string,
): Promise<{ valid: boolean; reason?: string }> {
  const db = await connectDB();
  const instance = (await db.siteInstances.findOne({ slug })) as SiteInstance | null;

  if (!instance) return { valid: false, reason: 'instance_not_found' };
  if (instance.licenseKey !== licenseKey) return { valid: false, reason: 'invalid_license' };
  if (normalizeDomain(domain) !== instance.domain) return { valid: false, reason: 'domain_mismatch' };
  if (instance.status === 'suspended') return { valid: false, reason: 'suspended' };
  if (instance.status !== 'active') return { valid: false, reason: 'not_active' };

  return { valid: true };
}

export async function triggerProvisioningForOrder(orderId: string): Promise<SiteInstance[]> {
  const db = await connectDB();
  const order = await db.orders.findOne({ _id: new ObjectId(orderId) });
  if (!order) return [];

  const results: SiteInstance[] = [];
  const items = (order.items || []) as Array<{
    productId: string;
    name?: string;
    provisioningType?: string;
    templateSlug?: string;
    templateId?: string;
    siteDomain?: string;
  }>;

  for (const item of items) {
    if (item.provisioningType !== 'managed-site' || !item.siteDomain || !item.templateSlug) {
      continue;
    }

    const existing = await db.siteInstances.findOne({ orderId, productId: item.productId });
    if (existing) continue;

    const template = item.templateId
      ? await db.siteTemplates.findOne({ _id: new ObjectId(item.templateId) })
      : await db.siteTemplates.findOne({ slug: item.templateSlug });

    if (!template) {
      console.error(`Template not found for ${item.templateSlug}`);
      continue;
    }

    const folderName = String(template.folderPath || '').split('/').pop() || template.slug;

    const instance = await runProvision({
      userId: String(order.userId),
      userEmail: order.contactInfo?.email,
      orderId,
      productId: item.productId,
      productName: item.name,
      templateSlug: template.slug,
      templateId: template._id?.toString(),
      templateFolder: folderName,
      domain: item.siteDomain,
    });

    results.push(instance);
  }

  return results;
}
