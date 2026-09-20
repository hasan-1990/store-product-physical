import { cookies } from 'next/headers';
import { listAddresses } from '@/lib/db/content';
import { sitePageMetadata } from '@/lib/metadata';
import { CART_SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('آدرس‌ها', 'آدرس‌های تحویل سفارش');
}

export default async function AccountAddressesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value || '';
  const addresses = sessionId ? await listAddresses(sessionId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-on-surface">آدرس‌ها</h1>
        <p className="mt-1 text-sm text-on-surface-variant">مدیریت آدرس‌های تحویل سفارش</p>
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-xl border border-outline/20 bg-white p-6 text-sm text-on-surface-variant">
          هنوز آدرسی ثبت نکرده‌اید.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-xl border border-outline/20 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-on-surface">{address.title}</h2>
                {address.isDefault && (
                  <span className="rounded-full bg-primary-container px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    پیش‌فرض
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-on-surface">{address.fullName}</p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{address.address}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant">
                <span>تلفن: {address.phone}</span>
                <span>کد پستی: {address.postalCode}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <button type="button" className="btn-outline">
        افزودن آدرس جدید
      </button>
    </div>
  );
}
