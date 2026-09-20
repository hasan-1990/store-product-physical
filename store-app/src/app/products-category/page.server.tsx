import { Metadata } from 'next';
import CategoriesClient from '@/components/CategoriesClient';

// تولید JSON-LD Schema برای صفحه دسته‌بندی‌ها
function generateCategoriesSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  
  // CollectionPage Schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "دسته‌بندی محصولات",
    "description": "مرور کامل دسته‌بندی‌های محصولات و پیدا کردن محصول مورد نظر",
    "url": `${baseUrl}/categories`,
    "mainEntity": {
      "@type": "ItemList",
      "name": "دسته‌بندی‌های محصولات",
      "description": "فهرست کامل دسته‌بندی‌های محصولات فروشگاه",
      "numberOfItems": "10+"
    },
    "breadcrumb": {
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
          "name": "دسته‌بندی محصولات",
          "item": `${baseUrl}/categories`
        }
      ]
    }
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "فروشگاه آنلاین",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+98-21-12345678",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://www.instagram.com/your-shop",
      "https://www.telegram.me/your-shop"
    ]
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "فروشگاه آنلاین",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return {
    collection: collectionSchema,
    organization: organizationSchema,
    website: websiteSchema
  };
}

// generateMetadata برای SEO بهتر
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  
  // سعی در دریافت SEO settings از API
  let seoData = null;
  try {
    const response = await fetch(`${baseUrl}/api/seo?url=/categories`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // 1 ساعت cache
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        seoData = data.data;
      }
    }
  } catch (error) {
    console.error('خطا در دریافت SEO data برای صفحه دسته‌بندی‌ها:', error);
  }

  const title = seoData?.title || 'دسته‌بندی محصولات | فروشگاه آنلاین';
  const description = seoData?.description || 'مرور کامل دسته‌بندی‌های محصولات و پیدا کردن محصول مورد نظر. انواع دسته‌بندی‌ها با بهترین قیمت‌ها.';
  const keywords = seoData?.keywords || 'دسته‌بندی محصولات, کاتگوری, انواع محصولات, فروشگاه آنلاین, خرید آنلاین';

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/images/products/placeholder.svg',
          width: 1200,
          height: 630,
          alt: 'دسته‌بندی محصولات',
        }
      ],
      type: 'website',
      locale: 'fa_IR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/products/placeholder.svg'],
    },
    alternates: {
      canonical: '/categories',
    },
    other: {
      'robots': 'index, follow',
      'language': 'fa-IR',
      'revisit-after': '7 days',
    },
  };
}

// تابع دریافت دسته‌بندی‌ها
async function getCategories() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/categories`, {
      cache: 'force-cache',
      next: { revalidate: 600 } // 10 دقیقه cache
    });
    
    if (!response.ok) {
      throw new Error('خطا در دریافت دسته‌بندی‌ها');
    }
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی‌ها:', error);
    return [];
  }
}

// تابع دریافت SEO data
async function getSEOData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/seo?url=/categories`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // 1 ساعت cache
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.data : null;
    }
    return null;
  } catch (error) {
    console.error('خطا در دریافت SEO data:', error);
    return null;
  }
}

// صفحه اصلی (Server Component)
export default async function CategoriesPage() {
  // دریافت داده‌ها در Server Component
  const [categories, seoData] = await Promise.all([
    getCategories(),
    getSEOData()
  ]);

  // تولید Schema ها
  const schemas = generateCategoriesSchema();
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  return (
    <div className="min-h-screen bg-gray-50">
      <head>
        <link rel="canonical" href={base.replace(/\/$/, '') + '/categories'} />
      </head>
      {/* JSON-LD Schema برای SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.collection)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.organization)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.website)
        }}
      />
      
      {/* H1 و H2 پنهان برای SEO */}
      <div className="hidden">
        <h1>{seoData?.h1Title || 'دسته‌بندی محصولات - فروشگاه آنلاین'}</h1>
        <h2>{seoData?.h2Title || 'کاوش در مجموعه کامل محصولات'}</h2>
      </div>

      {/* محتوای SEO پنهان */}
      {seoData?.content && (
        <div className="hidden">
          <div dangerouslySetInnerHTML={{ __html: seoData.content }} />
        </div>
      )}

      {/* پاس دادن به Client Component */}
      <CategoriesClient 
        initialCategories={categories}
      />
    </div>
  );
}