import { cookies } from 'next/headers';
import { AccountPageWrapper } from '@/components/account/AccountPageWrapper';
import { getUserProfile } from '@/lib/db/content';
import { CART_SESSION_COOKIE } from '@/lib/session';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value || '';
  const user = await getUserProfile(sessionId);

  return <AccountPageWrapper user={user}>{children}</AccountPageWrapper>;
}
