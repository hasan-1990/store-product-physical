import { getAdminFromCookies } from '@/lib/auth';
import { getSiteContent } from '@/lib/db/site-content';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [admin, content] = await Promise.all([getAdminFromCookies(), getSiteContent()]);

  const adminProfile = {
    name: admin?.email?.split('@')[0] || 'مدیر',
    role: 'مدیر فروشگاه',
    avatar: '/images/account/avatar.jpg',
    email: admin?.email || '',
  };

  return (
    <AdminShell siteName={content.site.name} admin={adminProfile}>
      {children}
    </AdminShell>
  );
}
