import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from '@/components/CategoryClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// generateMetadata برای SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // دریافت اطلاعات دسته‌بندی
  let categoryData = null;
  try {
    const response = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        categoryData = data.data;
      }
    }
  } catch (error) {
    console.error('خطا در دریافت اطلاعات دسته‌بندی:', error);
  }

  if (!categoryData) {
    return {
      title: 'دسته‌بندی پیدا نشد | فروشگاه آنلاین',
      description: 'دسته‌بندی مورد نظر یافت نشد'
    };
  }

  const title = `${categoryData.name} | فروشگاه آنلاین`;
  const description = categoryData.description || `مشاهده همه محصولات ${categoryData.name}`;

  return {
    title,
    description,
    keywords: `${categoryData.name}, خرید ${categoryData.name}, فروشگاه آنلاین`,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/products-category/${slug}`,
      type: 'website',
      images: (categoryData.imageUrl || categoryData.image) ? [
        {
          url: categoryData.imageUrl || categoryData.image,
          width: 1200,
          height: 630,
          alt: categoryData.name
        }
      ] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: (categoryData.imageUrl || categoryData.image) ? [categoryData.imageUrl || categoryData.image] : []
    },
    alternates: {
      canonical: `${baseUrl}/products-category/${slug}`
    }
  };
}

// صفحه اصلی
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // دریافت اطلاعات دسته‌بندی
  let categoryData = null;
  let products = [];
  let subcategories = [];

  try {
    // دریافت اطلاعات دسته‌بندی
    const categoryResponse = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: 'no-store'
    });

    console.log('Category Response Status:', categoryResponse.status);

    if (!categoryResponse.ok) {
      console.error('Category not found:', slug);
      notFound();
    }

    const categoryResult = await categoryResponse.json();
    console.log('Category Result:', JSON.stringify(categoryResult, null, 2));
    
    if (!categoryResult.success) {
      console.error('Category fetch failed:', categoryResult);
      notFound();
    }

    categoryData = categoryResult.data;

    // دریافت زیردسته‌های این دسته‌بندی با آمار کامل
    if (categoryData._id) {
      const subcategoriesResponse = await fetch(
        `${baseUrl}/api/categories?parentId=${categoryData._id}&limit=100`,
        { cache: 'no-store' }
      );

      if (subcategoriesResponse.ok) {
        const subcategoriesResult = await subcategoriesResponse.json();
        if (subcategoriesResult.success && subcategoriesResult.data) {
          // دریافت تعداد زیردسته‌های هر زیردسته و تعداد محصولات
          const subcategoriesWithStats = await Promise.all(
            subcategoriesResult.data.map(async (subcat: any) => {
              // دریافت تعداد زیردسته‌های این زیردسته
              const subSubcatsResponse = await fetch(
                `${baseUrl}/api/categories?parentId=${subcat._id}&limit=1`,
                { cache: 'no-store' }
              );
              let subcategoryCount = 0;
              if (subSubcatsResponse.ok) {
                const subSubcatsResult = await subSubcatsResponse.json();
                subcategoryCount = subSubcatsResult.pagination?.total || 0;
              }

              return {
                ...subcat,
                productCount: subcat.productCount || 0,
                subcategoryCount
              };
            })
          );
          subcategories = subcategoriesWithStats;
        }
      }
    }

    // دریافت محصولات این دسته‌بندی
    const productsResponse = await fetch(
      `${baseUrl}/api/products?category=${slug}&limit=50`,
      { cache: 'no-store' }
    );

    if (productsResponse.ok) {
      const productsResult = await productsResponse.json();
      if (productsResult.success) {
        products = productsResult.products || [];
      }
    }
  } catch (error) {
    console.error('خطا در دریافت اطلاعات:', error);
    notFound();
  }

  if (!categoryData) {
    notFound();
  }

  // JSON-LD Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "خانه",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "دسته‌بندی‌ها",
        "item": `${baseUrl}/categories`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryData.name,
        "item": `${baseUrl}/products-category/${slug}`
      }
    ]
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />

      {/* محتوای صفحه */}
      <CategoryClient 
        category={categoryData} 
        products={products}
        subcategories={subcategories}
        slug={slug}
      />
    </>
  );
}
