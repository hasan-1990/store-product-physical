import fs from 'fs';
import path from 'path';

export type ScannedPage = { path: string; label: string };

function segmentToUrl(segment: string): string | null {
  if (segment.startsWith('(') && segment.endsWith(')')) return null;
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const inner = segment.slice(1, -1);
    if (inner.startsWith('...')) return `:${inner.slice(3)}`;
    return `:${inner}`;
  }
  return segment;
}

function walk(dir: string, base: string, out: ScannedPage[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hasPage = entries.some((e) => e.isFile() && (e.name === 'page.tsx' || e.name === 'page.ts'));

  if (hasPage) {
    const rel = path.relative(base, dir).split(path.sep).filter(Boolean);
    const urlParts = rel.map(segmentToUrl).filter((s): s is string => s !== null);
    const urlPath = `/${urlParts.join('/')}`.replace(/\/+/g, '/') || '/';
    const label = urlParts[urlParts.length - 1] || 'home';
    out.push({ path: urlPath, label });
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) walk(path.join(dir, entry.name), base, out);
  }
}

export function scanNextPages(appRoot: string): ScannedPage[] {
  const pages: ScannedPage[] = [];
  walk(appRoot, appRoot, pages);
  return pages.sort((a, b) => a.path.localeCompare(b.path));
}
