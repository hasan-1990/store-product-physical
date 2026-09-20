/**
 * CDN URL helpers — static assets و uploads
 */
function normalizeBase(base: string): string {
  return base.replace(/\/$/, '');
}

function joinUrl(base: string, assetPath: string): string {
  const path = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${normalizeBase(base)}${path}`;
}

export function getCdnBaseUrl(): string | null {
  const base =
    process.env.CDN_URL ||
    process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.ASSET_PREFIX ||
    '';
  return base.trim() ? normalizeBase(base.trim()) : null;
}

export function getUploadsCdnBaseUrl(): string | null {
  const uploads =
    process.env.CDN_UPLOADS_URL ||
    process.env.NEXT_PUBLIC_CDN_UPLOADS_URL ||
    getCdnBaseUrl();
  return uploads || null;
}

/** مسیر استاتیک با CDN (در صورت تنظیم env) */
export function cdnUrl(assetPath: string): string {
  const base = getCdnBaseUrl();
  if (!base) return assetPath;
  return joinUrl(base, assetPath);
}

/** URL آپلودها — Nginx یا CDN خارجی */
export function uploadsUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  const path = clean.startsWith('uploads/') ? `/${clean}` : `/uploads/${clean}`;
  const base = getUploadsCdnBaseUrl();
  if (!base) return path;
  return joinUrl(base, path);
}

export function isCdnEnabled(): boolean {
  return getCdnBaseUrl() !== null;
}
