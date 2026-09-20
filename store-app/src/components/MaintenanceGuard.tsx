'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        // مسیرهای مجاز در حالت تعمیر
        const allowedPaths = [
          '/maintenance',
          '/admin/settings',
          '/admin',
        ];

        if (allowedPaths.some(path => pathname.startsWith(path))) {
          return;
        }

        // صبر کن تا وضعیت سشن مشخص شود
        if (status === 'loading') return;

        // اگر ادمین است، اجازه بده
        const role = (session?.user as any)?.role;
        if (role && role.toString().toLowerCase().includes('admin')) return;

        // برای کاربران عادی وضعیت maintenance را چک کن
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data?.maintenanceMode === true) {
            if (result.data.maintenanceEndTime) {
              const now = new Date().getTime();
              const endTime = new Date(result.data.maintenanceEndTime).getTime();
              
              if (now < endTime) {
                router.push('/maintenance');
                return;
              }
            } else {
              router.push('/maintenance');
              return;
            }
          }
        }
      } catch (error) {
        console.error('خطا در بررسی حالت تعمیر:', error);
      }
    };

    checkMaintenanceMode();
  }, [pathname, router, session, status]);

  return <>{children}</>;
}
