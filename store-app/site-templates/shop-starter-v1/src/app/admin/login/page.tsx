import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { sitePageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  return sitePageMetadata('ورود مدیر', 'ورود به پنل مدیریت فروشگاه');
}

export default function AdminLoginPage() {
  return (
    <div className="page-container flex min-h-screen items-center justify-center py-24">
      <AdminLoginForm />
    </div>
  );
}
