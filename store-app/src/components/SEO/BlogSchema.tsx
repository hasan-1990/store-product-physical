/**
 * کامپوننت JSON-LD Schema Markup برای بلاگ و مقالات
 * برای امتیاز بهتر SEO و Rich Results در گوگل
 */

/**
 * Schema برای یک مقاله بلاگ
 */
interface BlogPostSchemaProps {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  image?: string;
  slug: string;
  category?: string;
  tags?: string[];
}

export function BlogPostSchema({
  title,
  description,
  author,
  publishDate,
  modifiedDate,
  image,
  slug,
  category,
  tags = []
}: BlogPostSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const fullImageUrl = image?.startsWith('http') ? image : `${baseUrl}${image || '/default-blog.jpg'}`;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": fullImageUrl,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "فروشگاه آنلاین",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": publishDate,
    "dateModified": modifiedDate || publishDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${slug}`
    },
    "articleSection": category,
    "keywords": tags.join(', ')
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
 * Schema برای لیست مقالات بلاگ
 */
interface BlogListSchemaProps {
  posts: Array<{
    title: string;
    description?: string;
    slug: string;
    author?: string;
    publishDate?: string;
    image?: string;
  }>;
  category?: string;
}

export function BlogListSchema({ posts, category }: BlogListSchemaProps) {
  if (!posts || posts.length === 0) return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const schema = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": category ? `مقالات ${category}` : "مقالات بلاگ",
    "description": category ? `تمام مقالات در دسته ${category}` : "لیست کامل مقالات بلاگ",
    "numberOfItems": posts.length,
    "itemListElement": posts.map((post, index) => {
      const imageUrl = post.image || '';
      const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl || '/default-blog.jpg'}`;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.description || '',
          "image": fullImageUrl,
          "url": `${baseUrl}/blog/${post.slug}`,
          "author": {
            "@type": "Person",
            "name": post.author || "نویسنده"
          },
          "datePublished": post.publishDate || new Date().toISOString()
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
 * Schema برای صفحه Blog (CollectionPage)
 */
interface BlogPageSchemaProps {
  totalPosts?: number;
  category?: string;
}

export function BlogPageSchema({ totalPosts = 0, category }: BlogPageSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Blog",
    "name": category ? `مجله ${category}` : "مجله آنلاین",
    "description": category ? `مقالات و اخبار ${category}` : "مجله آنلاین با مقالات، راهنماها و اخبار",
    "url": category ? `${baseUrl}/blog?category=${category}` : `${baseUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "فروشگاه آنلاین",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "blogPost": {
      "@type": "ItemList",
      "numberOfItems": totalPosts
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

/**
 * Schema برای دسته‌بندی بلاگ
 */
interface BlogCategorySchemaProps {
  categoryName: string;
  description?: string;
  postCount?: number;
}

export function BlogCategorySchema({ 
  categoryName, 
  description, 
  postCount = 0 
}: BlogCategorySchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const schema = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    "name": `دسته ${categoryName}`,
    "description": description || `مقالات مربوط به ${categoryName}`,
    "url": `${baseUrl}/blog?category=${categoryName}`,
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
          "name": "مجله",
          "item": `${baseUrl}/blog`
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
      "numberOfItems": postCount
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
