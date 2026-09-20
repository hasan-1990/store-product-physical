import Link from 'next/link';
import { Instagram, Send } from 'lucide-react';
import type { NavLink, SiteInfo } from '@/lib/types/site-content';

const serviceLinks = [
  { label: 'تماس با ما', href: '/contact' },
  { label: 'سوالات متداول', href: '/faq' },
  { label: 'ارسال و بازگشت', href: '/shipping' },
  { label: 'پیگیری سفارش', href: '/account/orders' },
];

type FooterProps = {
  site: SiteInfo;
  navLinks: NavLink[];
};

export function Footer({ site, navLinks }: FooterProps) {
  return (
    <footer className="border-t border-outline/40 bg-surface-container/40">
      <div className="page-container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 className="font-display text-xl font-medium text-on-surface">به دنیای {site.name} بپیوندید</h3>
            <p className="mt-3 text-sm text-on-surface-variant">
              آخرین محصولات و تخفیف‌های ویژه را در ایمیل خود دریافت کنید.
            </p>
            <form className="mt-6 flex gap-2" action="#">
              <input
                type="email"
                placeholder="ایمیل شما"
                className="flex-1 rounded-lg border border-outline bg-white px-4 py-3 text-sm outline-none transition focus:border-secondary"
                dir="ltr"
              />
              <button type="submit" className="btn-primary shrink-0 px-6">
                عضویت
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            <div>
              <h4 className="text-sm font-semibold text-on-surface">مجموعه ما</h4>
              <ul className="mt-4 space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-on-surface-variant hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">خدمات مشتریان</h4>
              <ul className="mt-4 space-y-3">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-on-surface-variant hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <Link href="/" className="font-display text-2xl font-semibold text-on-surface">
              {site.name}
            </Link>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">{site.description}</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-outline/30 pt-8 sm:flex-row">
          <div className="flex gap-4">
            <a href="#" aria-label="اینستاگرام" className="text-on-surface-variant hover:text-on-surface">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="تلگرام" className="text-on-surface-variant hover:text-on-surface">
              <Send className="h-5 w-5" />
            </a>
          </div>
          <p className="text-xs text-on-surface-variant" dir="ltr">
            © {new Date().getFullYear()} {site.name.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
