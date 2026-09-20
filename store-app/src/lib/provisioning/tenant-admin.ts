export function getTenantAdminCredentials(): { email: string; password: string } {
  return {
    email: (
      process.env.TENANT_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      'admin@muse.local'
    ).toLowerCase(),
    password:
      process.env.TENANT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123',
  };
}
