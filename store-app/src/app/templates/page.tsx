import Link from 'next/link';
import type { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import type { SiteTemplate } from '@/types/site-provisioning';

export const metadata: Metadata = {
  title: 'قالب‌های فروشگاه آنلاین',
  description: 'قالب‌های اختصاصی فروشگاه با راه‌اندازی خودکار روی دامنه شما',
};

async function getTemplates(): Promise<SiteTemplate[]> {
  try {
    const db = await connectDB();
    return (await db.siteTemplates.find({ active: true }).sort({ createdAt: -1 }).toArray()) as unknown as SiteTemplate[];
  } catch {
    return [];
  }
}

export default async function TemplatesListPage() {
  const templates = await getTemplates();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">قالب‌های فروشگاه</h1>
        <p className="text-gray-400 mb-10">
          قالب اختصاصی بخرید — سایت روی دامنه خودتان با DNS خودکار راه‌اندازی می‌شود
        </p>

        {templates.length === 0 ? (
          <p className="text-gray-500">به‌زودی قالب‌های جدید اضافه می‌شوند.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <Link
                key={t.slug}
                href={`/templates/${t.slug}`}
                className="group bg-white/5 border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-500/50 transition"
              >
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900/50 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl">🛍️</span>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold group-hover:text-purple-300">{t.name}</h2>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{t.shortDescription}</p>
                  {t.basePrice ? (
                    <p className="text-purple-400 mt-3 font-semibold">
                      از {t.basePrice.toLocaleString('fa-IR')} تومان
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
