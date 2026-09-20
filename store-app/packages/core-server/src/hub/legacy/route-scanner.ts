import fs from 'fs';
import path from 'path';

export type ScannedApiRoute = {
  expressPath: string;
  modulePath: string;
  methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
};

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

function segmentToExpress(segment: string): string {
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    const name = segment.slice(4, -1);
    return `*${name}`;
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

function walk(dir: string, base: string, out: ScannedApiRoute[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hasRoute = entries.some((e) => e.isFile() && e.name === 'route.ts');

  if (hasRoute) {
    const rel = path.relative(base, dir).split(path.sep).filter(Boolean);
    const expressSegments = rel.map(segmentToExpress);
    const expressPath = `/api/${expressSegments.join('/')}`.replace(/\/+/g, '/');
    const modulePath = path.join(dir, 'route.ts');
    out.push({ expressPath, modulePath, methods: [...HTTP_METHODS] });
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), base, out);
    }
  }
}

/** Paths already implemented natively in Express hub — skip bridge duplicate */
export const NATIVE_HUB_API_PATHS = new Set([
  '/api/hub/info',
  '/api/health/hub',
  '/api/public-settings',
  '/api/site-templates',
  '/api/instances/verify',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/check',
  '/api/user/profile',
  '/api/user/my-sites',
  '/api/products',
  '/api/cart',
  '/api/orders',
  '/api/payment/request',
  '/api/payment/verify',
  '/api/payment/initiate',
  '/api/categories',
  '/api/categories/by-id/:id',
  '/api/homepage/categories',
  '/api/mega-menu',
  '/api/admin/categories',
  '/api/admin/mega-menu-settings',
  '/api/admin/site-instances',
  '/api/admin/site-templates',
  '/api/orders/create',
  '/api/orders/:id/complete',
  '/api/provinces',
  '/api/discounts/validate',
  '/api/admin/payment-gateways',
  '/api/admin/products',
  '/api/user/change-password',
  '/api/user/digital-products',
  '/api/download/generate',
  '/api/download/file',
  '/api/admin/cron/dns-check',
]);

export function scanNextApiRoutes(apiRoot: string): ScannedApiRoute[] {
  const routes: ScannedApiRoute[] = [];
  walk(apiRoot, apiRoot, routes);

  return routes.sort((a, b) => {
      const aWild = (a.expressPath.match(/:/g) || []).length + (a.expressPath.includes('*') ? 2 : 0);
      const bWild = (b.expressPath.match(/:/g) || []).length + (b.expressPath.includes('*') ? 2 : 0);
      if (aWild !== bWild) return aWild - bWild;
      return b.expressPath.length - a.expressPath.length;
    });
}
