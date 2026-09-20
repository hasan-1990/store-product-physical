import Image from 'next/image';
import Link from 'next/link';

export function AccountPromoSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="group relative h-64 cursor-pointer overflow-hidden rounded-xl border border-outline/10">
        <Image
          src="/images/account/night-care.jpg"
          alt="مراقبت شبانه پیشرفته"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent" />
        <div className="absolute bottom-6 right-6">
          <span className="mb-2 inline-block rounded bg-secondary/80 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
            پیشنهاد ویژه
          </span>
          <h4 className="font-display text-2xl text-white">مراقبت شبانه پیشرفته</h4>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-4 rounded-xl bg-primary-container p-8">
        <h4 className="text-lg font-semibold text-on-surface">باشگاه مشتریان MUSE</h4>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          با تکمیل پروفایل خود و خرید از مجموعه‌های جدید، سطح کاربری خود را ارتقا دهید و از تخفیف‌های
          اختصاصی و ارسال رایگان بهره‌مند شوید.
        </p>
        <Link
          href="/account/settings"
          className="w-fit rounded-lg bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-on-surface"
        >
          تکمیل پروفایل
        </Link>
      </div>
    </div>
  );
}
