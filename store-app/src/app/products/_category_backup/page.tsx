import { notFound } from 'next/navigation';
import ProductsClient from '../route-handler';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryProductsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const categorySlug = resolvedParams.category;
  
  if (!categorySlug) {
    notFound();
  }
  
  return <ProductsClient initialCategory={categorySlug} isFromSlug={true} />;
}

export async function generateStaticParams() {
  try {
    // در production، category های موجود را از API دریافت کنید
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/categories`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((category: any) => ({
        category: category.slug || category._id
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error generating static params for categories:', error);
    return [];
  }
}