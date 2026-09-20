/** Native Express hub routes — skip bridge registration to avoid double handlers */

const FULL_SKIP = new Set([
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
  '/api/categories/by-id/:id',
]);

const METHOD_SKIP = new Map<string, Set<string>>([
  ['/api/products', new Set(['GET'])],
  ['/api/products/:id', new Set(['GET'])],
  ['/api/cart', new Set(['GET', 'POST', 'DELETE'])],
  ['/api/orders', new Set(['GET', 'POST'])],
  ['/api/categories', new Set(['GET', 'POST'])],
  ['/api/categories/:slug', new Set(['GET'])],
  ['/api/payment/request', new Set(['POST'])],
  ['/api/payment/verify', new Set(['GET'])],
  ['/api/payment/initiate', new Set(['POST'])],
]);

export function shouldSkipBridgeRoute(expressPath: string, method: string): boolean {
  if (FULL_SKIP.has(expressPath)) return true;
  const methods = METHOD_SKIP.get(expressPath);
  return methods?.has(method) ?? false;
}
