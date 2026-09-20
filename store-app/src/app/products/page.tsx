import { notFound, redirect } from 'next/navigation';
import ProductsClient from './route-handler';
import { parseProductUrl } from '@/lib/url-server';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // این صفحه فقط برای /products یا /products?category=xxx
  // اگر URL محصول باشد، [...slug]/page.tsx آن را handle می‌کند
  
  const resolvedSearchParams = await searchParams;
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
  
  // SEO: Redirect query parameter به clean URL
  if (category && category !== 'همه') {
    redirect(`/products/${category}`);
  }
  
  return <ProductsClient initialCategory={category || 'همه'} />;
}
