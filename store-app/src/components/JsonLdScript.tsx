import Script from 'next/script';
import { getSiteSettings } from '@/lib/dynamicContent';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/structured-data';

export default async function JsonLdScript() {
  const settings = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';

  // استفاده از توابع بهبودیافته Schema
  const organizationSchema = {
    ...buildOrganizationSchema(baseUrl),
    // اضافه کردن اطلاعات دینامیک از تنظیمات
    "name": settings.site_name || "فروشگاه آنلاین",
    "description": settings.site_description || "فروشگاه جامع محصولات فیزیکی و دانلودی با پشتیبانی کامل",
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": "200",
      "height": "60"
    },
    "image": `${baseUrl}/logo.png`,
    ...(settings.contact_address && {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.contact_address,
        "addressLocality": "تهران",
        "addressRegion": "تهران",
        "addressCountry": "IR"
      }
    }),
    "contactPoint": [{
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "areaServed": "IR",
      "availableLanguage": ["Persian", "English"],
      ...(settings.contact_phone && { "telephone": settings.contact_phone }),
      ...(settings.contact_email && { "email": settings.contact_email })
    }],
    "priceRange": "$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "284",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  // Schema بهبودیافته WebSite
  const websiteSchema = {
    ...buildWebSiteSchema(baseUrl),
    "name": settings.site_name || "فاتمز",
    "publisher": {
      "@type": "Organization",
      "name": settings.site_name || "فاتمز",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "inLanguage": "fa-IR"
  };

  // Schema برای LocalBusiness (اگر فروشگاه فیزیکی دارید)
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": settings.site_name,
    "description": settings.site_description,
    "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
    "telephone": settings.contact_phone,
    ...(settings.contact_address && {
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.contact_address,
        "addressCountry": "IR"
      }
    })
  };

  return (
    <>
      {/* Organization Schema */}
      <Script 
        id="organization-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        strategy="afterInteractive"
      />

      {/* Website Schema */}
      <Script 
        id="website-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        strategy="afterInteractive"
      />

      {/* Local Business Schema */}
      {settings.contact_address && (
        <Script 
          id="local-business-schema" 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          strategy="afterInteractive"
        />
      )}

      {/* Breadcrumb Schema (اختیاری) */}
      <Script 
        id="breadcrumb-schema" 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "خانه",
                "item": process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
              }
            ]
          })
        }}
        strategy="afterInteractive"
      />
    </>
  );
}
