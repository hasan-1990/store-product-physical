import { Metadata } from 'next';
import HeroSliderServer from '@/components/HeroSliderServer';
import BlogSectionServer from '@/components/BlogSectionServer';
import AnimatedCategoriesServer from '@/components/AnimatedCategoriesServer';
import DynamicBannerSections from '@/components/DynamicBannerSections';
import ModernProductShowcase from '@/components/ModernProductShowcase';
import MultipleHoverProductsSections from '@/components/MultipleHoverProductsSections';
import HomePageAnalytics from '@/components/HomePageAnalytics';
import { HomeTopDiscountSections, HomeMiddleDiscountSections } from '@/components/PositionedDiscountSections';
import { getHomePageData, getSiteSettings, getSEOData } from '@/lib/homepage-data';

// تولید JSON-LD Schema برای صفحه اصلی
function generateHomeSchema(siteSettings: any, featuredCategories: any[], seoData: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const siteName = siteSettings?.site_name || 'فروشگاه';
  const siteDescription = seoData?.description || siteSettings?.description || '';
  
  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": baseUrl,
    "description": siteDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": "200",
      "height": "200"
    },
    "description": siteDescription,
    "contactPoint": siteSettings?.contact?.phone ? {
      "@type": "ContactPoint",
      "telephone": siteSettings.contact.phone,
      "contactType": "customer service",
      "availableLanguage": ["Persian", "fa"]
    } : undefined,
    "address": siteSettings?.contact?.address ? {
      "@type": "PostalAddress",
      "addressCountry": "IR",
      "addressLocality": siteSettings.contact.address
    } : undefined,
    "sameAs": [
      siteSettings?.socialMedia?.instagram,
      siteSettings?.socialMedia?.telegram,
      siteSettings?.socialMedia?.twitter,
      siteSettings?.socialMedia?.facebook
    ].filter(Boolean)
  };

  // ItemList Schema برای دسته‌بندی‌ها
  const categoriesSchema = featuredCategories.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "دسته‌بندی‌های محصولات",
    "description": "دسته‌بندی‌های اصلی فروشگاه",
    "numberOfItems": featuredCategories.length,
    "itemListElement": featuredCategories.map((category, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": category.name,
      "url": `${baseUrl}/products/${category.slug || category.id}`
    }))
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "خانه",
        "item": baseUrl
      }
    ]
  };

  return {
    website: websiteSchema,
    organization: organizationSchema,
    categories: categoriesSchema,
    breadcrumb: breadcrumbSchema
  };
}

// generateMetadata برای SEO بهتر
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  
  // دریافت تنظیمات سایت و SEO از database
  let siteSettings = null;
  let seoData = null;
  
  try {
    siteSettings = await getSiteSettings();
    seoData = await getSEOData();
  } catch (error) {
    console.error('خطا در دریافت metadata برای صفحه اصلی:', error);
  }

  const siteName = siteSettings?.site_name || 'فروشگاه';
  const title = seoData?.title || siteName;
  const description = seoData?.description || siteSettings?.description || '';
  const keywords = seoData?.keywords || '';

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
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: siteName,
        }
      ],
      type: 'website',
      locale: 'fa_IR',
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
      site: siteSettings?.socialMedia?.twitter ? `@${siteSettings.socialMedia.twitter.replace(/^@/, '')}` : undefined,
    },
    alternates: {
      canonical: '/',
    },
    other: {
      'robots': 'index, follow',
      'language': 'fa-IR',
      'revisit-after': '3 days',
      'distribution': 'global',
      'rating': 'general',
    },
  };
}

// صفحه اصلی (Server Component)
export default async function HomePage() {
  // دریافت همه داده‌ها از database
  const data = await getHomePageData();
  
  const {
    siteSettings,
    featuredCategories,
    seoData,
  } = data;

  // تولید Schema ها
  const schemas = generateHomeSchema(siteSettings, featuredCategories, seoData);

  // ترکیب همه schemas در یک آرایه برای کاهش script tags
  const allSchemas: any[] = [
    schemas.website,
    schemas.organization,
    schemas.breadcrumb
  ];
  
  // اضافه کردن categories schema اگر موجود است
  if (schemas.categories) {
    allSchemas.push(schemas.categories);
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full">
      {/* JSON-LD Schema - همه schemas در یک script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allSchemas)
        }}
      />
      
      {/* H1 و H2 پنهان برای SEO - فقط اگر در سیستم SEO تعریف شده باشند */}
      {seoData && (
        <div className="hidden">
          {seoData.h1Title && <h1>{seoData.h1Title}</h1>}
          {seoData.h2Title && <h2>{seoData.h2Title}</h2>}
        </div>
      )}

      {/* محتوای SEO پنهان */}
      {seoData?.content && (
        <div className="hidden">
          <div dangerouslySetInnerHTML={{ __html: seoData.content }} />
        </div>
      )}

      {/* پاس دادن همه داده‌ها به Client Component */}
      <HomePageAnalytics />

      <main className="min-h-screen w-full">
        <DynamicBannerSections position="before-hero" />

        <section
          className="relative"
          style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}
        >
          <HeroSliderServer autoPlay={true} autoPlayInterval={6000} />
        </section>

        <DynamicBannerSections position="after-hero" />
        <DynamicBannerSections position="before-categories" />

        <section className="bg-gradient-to-br from-gray-50 to-purple-50 py-10">
          <AnimatedCategoriesServer />
        </section>

        <DynamicBannerSections position="after-categories" />

        <HomeTopDiscountSections />

        <DynamicBannerSections position="before-products" />

        <ModernProductShowcase />

        <HomeMiddleDiscountSections />

        <MultipleHoverProductsSections position="home-top" />
        <MultipleHoverProductsSections position="home-middle" />
        <MultipleHoverProductsSections position="home-bottom" />

        <DynamicBannerSections position="after-products" />

        <BlogSectionServer limit={6} showTitle={true} />
      </main>
    </div>
  );
}