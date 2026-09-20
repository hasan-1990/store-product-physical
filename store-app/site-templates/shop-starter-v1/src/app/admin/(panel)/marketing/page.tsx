import { listCampaigns } from '@/lib/db/content';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('بازاریابی', 'کمپین‌ها و بازاریابی فروشگاه');
}

export default async function AdminMarketingPage() {
  const campaigns = await listCampaigns();

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-on-surface md:text-[32px]">بازاریابی</h1>
          <p className="mt-1 text-sm text-on-surface-variant">کمپین‌ها، کدهای تخفیف و خبرنامه</p>
        </div>
        <button type="button" className="btn-primary">
          کمپین جدید
        </button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-on-surface-variant">هنوز کمپینی ثبت نشده است. با seed دیتابیس پر می‌شود.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {campaigns.map((campaign) => (
            <article key={campaign.title} className="glass-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-on-surface">{campaign.title}</h2>
                <span
                  className={
                    campaign.status === 'فعال'
                      ? 'rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold text-secondary'
                      : 'rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant'
                  }
                >
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">دسترسی: {campaign.reach}</p>
              <p className="mt-1 text-sm text-on-surface-variant">نرخ تبدیل: {campaign.conversion}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
