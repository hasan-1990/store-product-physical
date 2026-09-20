'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { adminNavItems } from '@/lib/admin';
import { cn } from '@/lib/utils';

const iconMap = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  products: Package,
  orders: ShoppingCart,
  customers: Users,
  marketing: Megaphone,
} as const;

export type AdminProfile = {
  name: string;
  role: string;
  avatar: string;
  email: string;
};

type AdminShellProps = {
  children: React.ReactNode;
  siteName: string;
  admin: AdminProfile;
};

export function AdminShell({ children, siteName, admin }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-64 flex-col border-l border-outline bg-white lg:flex">
        <div className="px-8 py-10">
          <span className="font-display text-3xl tracking-tighter text-on-surface">{siteName}</span>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary opacity-60">ADMIN CONSOLE</p>
        </div>

        <nav className="mt-8 flex-1 space-y-2 px-4">
          {adminNavItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-lg px-4 py-3 transition-all',
                  isActive
                    ? 'admin-sidebar-active font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container',
                )}
              >
                <Icon
                  className={cn('h-5 w-5 transition-transform group-hover:scale-110', isActive && 'text-primary')}
                  strokeWidth={1.75}
                />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-outline p-6">
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary-container">
              <Image src={admin.avatar} alt={admin.name} fill className="object-cover" sizes="40px" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">{admin.name}</p>
              <p className="text-xs text-on-surface-variant opacity-70">{admin.role}</p>
            </div>
            <button type="button" aria-label="تنظیمات" className="text-on-surface-variant">
              <Settings className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-5 md:p-10 lg:mr-64">{children}</main>
    </div>
  );
}
