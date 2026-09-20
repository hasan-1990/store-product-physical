import { cookies } from 'next/headers';
import { getUserProfile } from '@/lib/db/content';
import { sitePageMetadata } from '@/lib/metadata';
import { CART_SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('تنظیمات حساب');
}

export default async function AccountSettingsPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value || '';
  const user = await getUserProfile(sessionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-on-surface">تنظیمات حساب</h1>
        <p className="mt-1 text-sm text-on-surface-variant">ویرایش اطلاعات شخصی و امنیت حساب</p>
      </div>

      <form className="space-y-6 rounded-xl border border-outline/20 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">نام و نام خانوادگی</span>
            <input
              type="text"
              defaultValue={user.name}
              className="w-full rounded-lg border border-outline/40 bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">شماره موبایل</span>
            <input
              type="tel"
              defaultValue={user.phone || ''}
              className="w-full rounded-lg border border-outline/40 bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">ایمیل</span>
            <input
              type="email"
              defaultValue={user.email || ''}
              className="w-full rounded-lg border border-outline/40 bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            ذخیره تغییرات
          </button>
          <button type="button" className="btn-outline">
            تغییر رمز عبور
          </button>
        </div>
      </form>
    </div>
  );
}
