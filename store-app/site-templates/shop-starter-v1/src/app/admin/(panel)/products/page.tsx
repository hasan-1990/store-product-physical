import Link from 'next/link';
import { listProducts } from '@/lib/db/products';
import { formatPrice } from '@/lib/data';
import { sitePageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return sitePageMetadata('محصولات', 'مدیریت محصولات فروشگاه');
}

export default async function AdminProductsPage() {
  const products = await listProducts({ activeOnly: false });

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-on-surface md:text-[32px]">محصولات</h1>
          <p className="mt-1 text-sm text-on-surface-variant">مدیریت کاتالوگ و موجودی محصولات</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          افزودن محصول
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-6 py-4">محصول</th>
              <th className="px-6 py-4">دسته</th>
              <th className="px-6 py-4">قیمت</th>
              <th className="px-6 py-4">برند</th>
              <th className="px-6 py-4">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline text-sm">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-surface">
                <td className="px-6 py-4 font-medium text-on-surface">{product.name}</td>
                <td className="px-6 py-4 text-on-surface-variant">{product.categoryLabel}</td>
                <td className="px-6 py-4">{formatPrice(product.price)}</td>
                <td className="px-6 py-4 text-on-surface-variant">{product.brand}</td>
                <td className="px-6 py-4">
                  <Link href={`/products/${product.slug}`} className="text-primary hover:underline">
                    مشاهده
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
