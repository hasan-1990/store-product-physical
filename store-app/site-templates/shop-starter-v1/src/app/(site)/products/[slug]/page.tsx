import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProductBySlug } from '@/lib/db/products';
import { buildCanonicalPath, buildProductJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'محصول یافت نشد' };

  const title = product.name;
  const description = product.shortDescription;
  const canonical = buildCanonicalPath(`/products/${slug}`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: product.image, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image],
    },
    alternates: { canonical },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <JsonLd
        data={buildProductJsonLd({
          slug: product.slug,
          name: product.name,
          description: product.shortDescription,
          image: product.image,
          price: product.price,
          rating: product.rating,
          reviewCount: product.reviewCount,
        })}
      />
      <ProductDetailView product={product} />
    </>
  );
}
