import { cookies } from 'next/headers';
import { AccountPromoSection } from '@/components/account/AccountPromoSection';
import { AccountStatsGrid } from '@/components/account/AccountStatsGrid';
import { RecentOrdersTable } from '@/components/account/RecentOrdersTable';
import { countFavorites, getUserProfile } from '@/lib/db/content';
import { listOrdersBySession } from '@/lib/db/orders';
import { mapDbOrderToAccount } from '@/lib/db/account-helpers';
import { sitePageMetadata } from '@/lib/metadata';
import { CART_SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('پنل کاربری', 'مدیریت سفارش‌ها، آدرس‌ها و تنظیمات حساب');
}

export default async function AccountDashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value || '';
  const [orders, favoriteCount] = await Promise.all([
    sessionId ? listOrdersBySession(sessionId, 5) : Promise.resolve([]),
    sessionId ? countFavorites(sessionId) : Promise.resolve(0),
  ]);

  const user = await getUserProfile(sessionId);

  return (
    <>
      <AccountStatsGrid
        orderCount={orders.length}
        points={user.points}
        favoriteCount={favoriteCount}
      />
      <RecentOrdersTable orders={orders.map(mapDbOrderToAccount)} />
      <AccountPromoSection />
    </>
  );
}
