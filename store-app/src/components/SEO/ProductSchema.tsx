/**
 * کامپوننت JSON-LD Schema Markup برای محصولات
 * این کامپوننت structured data استاندارد گوگل را تولید می‌کند
 * و امتیاز مثبت SEO و Rich Results می‌دهد
 */

import { Product } from '@/types';

interface ProductSchemaProps {
  product: Product;
  averageRating?: number;
  reviewCount?: number;
}

export default function ProductSchema({ 
  product, 
  averageRating = 0, 
  reviewCount = 0 
}: ProductSchemaProps) {
  
  // تبدیل قیمت به فرمت استاندارد
  const price = product.price || 0;
  
  // URL تصویر اصلی
  const imageUrl = product.images?.[0] || product.image || '';
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${imageUrl}`;

  // دسته‌بندی محصول
  const categoryName = typeof product.category === 'string' 
    ? product.category 
    : product.category?.name || 'محصولات';

  // ایجاد schema markup
  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.description || '',
    "image": fullImageUrl,
    "sku": product._id || '',
    "brand": {
      "@type": "Brand",
      "name": product.brand || "فروشگاه ما"
    },
    "offers": {
      "@type": "Offer",
      "url": `${process.env.NEXT_PUBLIC_BASE_URL || ''}/products/${product.slug}`,
      "priceCurrency": "IRR",
      "price": price,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": product.stock && product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStack",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "category": categoryName,
  };

  // اضافه کردن rating اگر وجود داشته باشد
  if (reviewCount > 0 && averageRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // اضافه کردن ویژگی‌های اضافی
  if (product.specifications && Array.isArray(product.specifications)) {
    schema.additionalProperty = product.specifications.map((spec: any) => ({
      "@type": "PropertyValue",
      "name": spec.key || spec.name,
      "value": spec.value
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0) // بدون فاصله برای کاهش حجم
      }}
    />
  );
}

/**
 * کامپوننت BreadcrumbList Schema برای نمایش مسیر دسته‌بندی
 */
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.url}`
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0)
      }}
    />
  );
}

/**
 * کامپوننت FAQ Schema برای سوالات متداول
 */
interface FAQSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0)
      }}
    />
  );
}

/**
 * کامپوننت ItemList Schema برای لیست محصولات (صفحه محصولات)
 */
interface ProductListSchemaProps {
  products: Array<{
    id?: string;
    _id?: string;
    name: string;
    price: number;
    image?: string;
    images?: string[];
    slug?: string;
    description?: string;
  }>;
  category?: string;
  currentPage?: number;
}

export function ProductListSchema({ products, category, currentPage = 1 }: ProductListSchemaProps) {
  if (!products || products.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  const schema = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": category ? `محصولات ${category}` : "لیست محصولات",
    "description": category ? `تمام محصولات در دسته ${category}` : "لیست کامل محصولات فروشگاه",
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => {
      const imageUrl = product.images?.[0] || product.image || '';
      const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
      const productId = product._id || product.id || '';
      
      return {
        "@type": "ListItem",
        "position": (currentPage - 1) * 20 + index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "description": product.description || '',
          "image": fullImageUrl,
          "url": product.slug ? `${baseUrl}/products/${product.slug}` : `${baseUrl}/products/${productId}`,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "IRR",
            "price": product.price,
            "availability": "https://schema.org/InStock"
          }
        }
      };
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0)
      }}
    />
  );
}

/**
 * کامپوننت CollectionPage Schema برای صفحات دسته‌بندی
 */
interface CategorySchemaProps {
  categoryName: string;
  description?: string;
  productCount?: number;
}

export function CategorySchema({ categoryName, description, productCount = 0 }: CategorySchemaProps) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": categoryName,
    "description": description || `دسته‌بندی ${categoryName}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "خانه",
          "item": process.env.NEXT_PUBLIC_BASE_URL || ''
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "محصولات",
          "item": `${process.env.NEXT_PUBLIC_BASE_URL || ''}/products`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": categoryName
        }
      ]
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": productCount
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0)
      }}
    />
  );
}
