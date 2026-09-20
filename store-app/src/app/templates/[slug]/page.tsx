import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import type { SiteTemplate } from '@/types/site-provisioning';

type Props = { params: Promise<{ slug: string }> };

async function getTemplate(slug: string): Promise<SiteTemplate | null> {
  try {
    const db = await connectDB();
    return (await db.siteTemplates.findOne({ slug, active: true })) as SiteTemplate | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) return { title: 'قالب یافت نشد' };

  return {
    title: template.seo?.title || template.name,
    description: template.seo?.description || template.shortDescription,
    keywords: template.seo?.keywords,
    openGraph: {
      title: template.seo?.title || template.name,
      description: template.seo?.description,
      images: template.seo?.ogImage ? [template.seo.ogImage] : undefined,
    },
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: template.name,
    description: template.shortDescription,
    applicationCategory: 'BusinessApplication',
    offers: template.basePrice
      ? {
          '@type': 'Offer',
          price: template.basePrice,
          priceCurrency: 'IRR',
        }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/templates" className="text-purple-400 text-sm hover:underline">
          ← همه قالب‌ها
        </Link>

        {template.thumbnail && (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full max-h-96 object-cover rounded-2xl mt-6"
          />
        )}

        <h1 className="text-4xl font-bold mt-8">{template.name}</h1>
        <p className="text-gray-400 mt-2">{template.shortDescription}</p>

        {template.features && template.features.length > 0 && (
          <ul className="mt-8 grid sm:grid-cols-2 gap-2">
            {template.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> {f}
              </li>
            ))}
          </ul>
        )}

        {template.description && (
          <div
            className="mt-8 prose prose-invert max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: template.description }}
          />
        )}

        {template.gallery && template.gallery.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            {template.gallery.map((img) => (
              <img key={img} src={img} alt="" className="rounded-lg" />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          {template.linkedProductId ? (
            <Link
              href={`/products/${template.linkedProductId}`}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold"
            >
              خرید قالب
            </Link>
          ) : (
            <p className="text-gray-500">محصول متصل هنوز تعریف نشده — از پنل ادمین محصول بسازید.</p>
          )}
          {template.demoUrl && (
            <a
              href={template.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border border-purple-500/50 rounded-xl hover:bg-white/5"
            >
              مشاهده دمو
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
