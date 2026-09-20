import fs from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/mongodb';
import { provisioningConfig } from '@/lib/provisioning/config';
import type { SiteTemplate } from '@/types/site-provisioning';

export type TemplateConfigFile = {
  slug: string;
  name: string;
  version?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  previewImage?: string;
  gallery?: string[];
  features?: string[];
  demoUrl?: string;
  active?: boolean;
  basePrice?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
};

export function templateFromConfig(
  folderName: string,
  config: TemplateConfigFile,
  existing?: SiteTemplate | null
): SiteTemplate {
  const now = new Date().toISOString();
  const slug = config.slug || folderName;
  const thumbnail = config.thumbnail || config.previewImage || '';

  return {
    slug,
    name: config.name,
    folderPath: `site-templates/${folderName}`,
    shortDescription: config.shortDescription || config.description?.slice(0, 160) || '',
    description: config.description || '',
    thumbnail,
    gallery: config.gallery || [],
    features: config.features || [],
    version: config.version || '1.0.0',
    demoUrl: config.demoUrl || '',
    active: config.active !== false,
    seo: {
      title: config.seo?.title || config.name,
      description: config.seo?.description || config.shortDescription || config.description || '',
      keywords: config.seo?.keywords || 'فروشگاه آنلاین, قالب فروشگاه, RTL',
      ogImage: config.seo?.ogImage || thumbnail,
      canonicalUrl: config.seo?.canonicalUrl || `/templates/${slug}`,
    },
    basePrice: existing?.basePrice ?? config.basePrice,
    linkedProductId: existing?.linkedProductId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

async function readTemplateConfig(folderPath: string): Promise<TemplateConfigFile | null> {
  const configPath = path.join(folderPath, 'template.config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw) as TemplateConfigFile;
  } catch {
    return null;
  }
}

export async function syncTemplatesFromDisk(): Promise<{
  synced: string[];
  skipped: string[];
}> {
  const root = provisioningConfig.templatesRoot;
  const synced: string[] = [];
  const skipped: string[] = [];

  let entries: string[] = [];
  try {
    entries = await fs.readdir(root);
  } catch {
    return { synced, skipped };
  }

  const db = await connectDB();

  for (const folderName of entries) {
    const folderPath = path.join(root, folderName);
    const stat = await fs.stat(folderPath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const config = await readTemplateConfig(folderPath);
    if (!config?.slug && !config?.name) {
      skipped.push(folderName);
      continue;
    }

    const slug = config.slug || folderName;
    const existing = (await db.siteTemplates.findOne({ slug })) as SiteTemplate | null;
    const template = templateFromConfig(folderName, { ...config, slug }, existing);

    await db.siteTemplates.updateOne(
      { slug },
      { $set: template },
      { upsert: true }
    );

    synced.push(slug);
  }

  return { synced, skipped };
}
