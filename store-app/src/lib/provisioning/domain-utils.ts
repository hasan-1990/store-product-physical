import { z } from 'zod';

const domainSchema = z
  .string()
  .min(3)
  .max(253)
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
    'فرمت دامنه نامعتبر است'
  );

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .replace(/:\d+$/, '');
}

export function validateDomain(input: string): { valid: boolean; domain?: string; error?: string } {
  const domain = normalizeDomain(input);
  const result = domainSchema.safeParse(domain);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message || 'دامنه نامعتبر است' };
  }
  return { valid: true, domain };
}

/** shop.ir → shop-ir */
export function domainToSlug(domain: string): string {
  const normalized = normalizeDomain(domain);
  return normalized.replace(/\./g, '-');
}

/** shop-ir → shop_ir (MongoDB database name) */
export function slugToDatabaseName(slug: string): string {
  return slug.replace(/-/g, '_');
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
}
