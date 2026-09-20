/**
 * مسیرهای دیباگ/تست فقط در development یا با ALLOW_DEV_ROUTES=true در دسترس‌اند.
 */
export function isDevOnlyApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/api/debug/') ||
    pathname.startsWith('/api/test-') ||
    pathname === '/api/simple-test'
  );
}

export function isDevRouteAllowed(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ALLOW_DEV_ROUTES === 'true';
}
