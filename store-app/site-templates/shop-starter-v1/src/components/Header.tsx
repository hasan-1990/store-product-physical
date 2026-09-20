import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { CartBadge } from '@/components/CartBadge';
import type { NavLink, SiteInfo } from '@/lib/types/site-content';

type HeaderProps = {
  site: SiteInfo;
  navLinks: NavLink[];
};

export function Header({ site, navLinks }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-outline/40 bg-surface/80 backdrop-blur-xl">
      <div className="page-container flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-on-surface md:text-3xl">
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-on-surface-variant transition hover:text-on-surface"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-6">
          <button type="button" aria-label="جستجو" className="text-on-surface transition hover:text-primary">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/account" aria-label="حساب کاربری" className="text-on-surface transition hover:text-primary">
            <User className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
