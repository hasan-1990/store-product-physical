'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { accountNavItems } from '@/lib/account';
import type { AccountUserProfile } from '@/components/account/AccountPageWrapper';
import { cn } from '@/lib/utils';

const iconMap = {
  dashboard: LayoutDashboard,
  orders: ShoppingCart,
  addresses: MapPin,
  favorites: Heart,
  settings: Settings,
} as const;

type AccountSidebarProps = {
  user: AccountUserProfile;
};

export function AccountSidebar({ user }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 md:w-64">
      <div className="mb-4 flex items-center gap-4 p-2">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-outline">
          <Image src={user.avatar} alt={user.name} fill className="object-cover" sizes="48px" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight text-on-surface">{user.name}</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{user.tier}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {accountNavItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            item.href === '/account' ? pathname === '/account' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 transition-all',
                isActive
                  ? 'bg-primary-container font-bold text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20 text-primary')} strokeWidth={1.75} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        <hr className="my-4 border-outline/30" />

        <button
          type="button"
          className="group flex items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition-all hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-sm">خروج</span>
        </button>
      </nav>
    </aside>
  );
}
