import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { listFavorites } from '@/lib/db/content';
import { formatPrice } from '@/lib/data';
import { sitePageMetadata } from '@/lib/metadata';
import { CART_SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('علاقه‌مندی‌ها');
}

export default async function AccountFavoritesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value || '';
  const favorites = sessionId ? await listFavorites(sessionId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-on-surface">علاقه‌مندی‌ها</h1>
        <p className="mt-1 text-sm text-on-surface-variant">محصولاتی که ذخیره کرده‌اید</p>
      </div>

      {favorites.length === 0 ? (
        <p className="rounded-xl border border-outline/20 bg-white p-6 text-sm text-on-surface-variant">
          هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {favorites.map((product) =>
            product ? (
              <Link
                key={product.id}
                href={product.href}
                className="flex gap-4 rounded-xl border border-outline/20 bg-white p-4 transition hover:shadow-soft"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-sm font-semibold text-on-surface">{product.name}</h2>
                  <p className="mt-1 text-sm text-secondary">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
