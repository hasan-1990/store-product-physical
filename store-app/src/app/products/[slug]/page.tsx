import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import ProductsClient from '../route-handler';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryProductsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams.slug;
  
  if (!categorySlug) {
    notFound();
  }
  
  return <ProductsClient initialCategory={categorySlug} isFromSlug={true} />;
}

export async function generateStaticParams() {
  try {
    // مستقیم از دیتابیس بخون (برای build time)
    const db = await connectDB();
    const categories = await db.categories
      .find({ active: true })
      .project({ slug: 1 })
      .limit(100) // محدود کردن برای جلوگیری از build طولانی
      .toArray();
    
    return categories.map((category) => ({
      slug: category.slug
    }));
  } catch (error) {
    console.error('Error generating static params for categories:', error);
    return [];
  }
}