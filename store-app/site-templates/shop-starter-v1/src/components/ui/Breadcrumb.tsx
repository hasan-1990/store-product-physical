import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="مسیر صفحه" className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <ChevronLeft className="h-4 w-4" />}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-on-surface">
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
