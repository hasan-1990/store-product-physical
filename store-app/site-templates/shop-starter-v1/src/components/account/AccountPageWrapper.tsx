'use client';

import type { ReactNode } from 'react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { SupportFab } from '@/components/account/SupportFab';

export type AccountUserProfile = {
  name: string;
  tier: string;
  avatar: string;
  points: number;
  email?: string;
  phone?: string;
};

type AccountPageWrapperProps = {
  children: ReactNode;
  user: AccountUserProfile;
};

export function AccountPageWrapper({ children, user }: AccountPageWrapperProps) {
  return (
    <>
      <div className="page-container flex min-h-[70vh] flex-col gap-8 pb-24 pt-28 md:flex-row md:gap-6 md:pt-32">
        <AccountSidebar user={user} />
        <section className="flex flex-1 flex-col gap-8">{children}</section>
      </div>
      <SupportFab />
    </>
  );
}
