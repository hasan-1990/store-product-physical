import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogPostClient from '@/components/BlogPostClient';

// تولید JSON-LD Schema برای مقاله بلاگ
function generateBlogSchema(post: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const postImage = post.featuredImage || '/images/products/placeholder.svg';
  const fullImageUrl = postImage.startsWith('http') ? postImage : `${baseUrl}${postImage}`;
  
  // Article Schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.description || `مطالعه مقاله ${post.title} در بلاگ ما.`,
    "image": [fullImageUrl],
    "author": {
      "@type": "Person",
      "name": post.author?.name || "نویسنده",
    },
    "publisher": {
      "@type": "Organization",
      "name": "فروشگاه آنلاین",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.updatedAt || post.publishedAt || post.createdAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "keywords": post.tags ? post.tags.map((tag: any) => tag.name).join(', ') : post.category?.name || '',
    "articleSection": post.category?.name || 'عمومی',
    "wordCount": post.content ? post.content.replace(/<[^>]*>/g, '').length : 0,
    "timeRequired": post.readTime ? `PT${post.readTime}M` : 'PT5M'
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
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "بلاگ",
        "item": `${baseUrl}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
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
    article: articleSchema,
    organization: organizationSchema,
    breadcrumb: breadcrumbSchema,
    website: websiteSchema
  };
}

// generateMetadata برای SEO بهتر
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // For server-side, use internal API call or direct DB access
    // Try multiple base URLs for different environments
    const possibleUrls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean);
    
    let data = null;
    for (const baseUrl of possibleUrls) {
      try {
        const res = await fetch(`${baseUrl}/api/blog/posts?slug=${encodeURIComponent(slug)}&status=all`, { 
          cache: 'no-store',
          headers: { 'User-Agent': 'NextJS-SSR' }
        });
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${baseUrl}:`, e instanceof Error ? e.message : String(e));
        continue;
      }
    }
    
    if (!data) throw new Error('All fetch attempts failed');
    const post = data?.data && Array.isArray(data.data) && data.data.length ? data.data[0] : null;
    if (!post) return { title: 'مقاله یافت نشد', description: 'مقاله موجود نیست.' };
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const img = post.featuredImage || '/images/products/placeholder.svg';
    const fullImg = img.startsWith('http') ? img : `${siteUrl}${img}`;
    const title = `${post.title} | بلاگ فروشگاه آنلاین`;
    const desc = post.excerpt || post.description || `مطالعه ${post.title}`;
    return {
      title,
      description: desc,
      openGraph: { title, description: desc, images: [{ url: fullImg }] },
      twitter: { card: 'summary_large_image', title, description: desc, images: [fullImg] },
      alternates: { canonical: `/blog/${slug}` }
    };
  } catch (e) {
    console.error('generateMetadata blog slug error', e);
    return { title: 'خطای مقاله', description: 'خطا در واکشی مقاله' };
  }
}

// تابع دریافت مقاله و مقالات مرتبط
async function getBlogPost(slug: string) {
  try {
    // Try multiple base URLs for different environments
    const possibleUrls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean);
    
    let data = null;
    let workingBaseUrl = null;
    
    for (const baseUrl of possibleUrls) {
      try {
        const apiUrl = `${baseUrl}/api/blog/posts?slug=${encodeURIComponent(slug)}&status=all`;
        const res = await fetch(apiUrl, { 
          cache: 'no-store',
          headers: { 'User-Agent': 'NextJS-SSR' }
        });
        if (res.ok) {
          data = await res.json();
          workingBaseUrl = baseUrl;
          break;
        }
      } catch (e) {
        console.warn(`getBlogPost failed for ${baseUrl}:`, e instanceof Error ? e.message : String(e));
        continue;
      }
    }
    
    if (!data?.success || !Array.isArray(data.data) || !data.data.length) return null;
    const post = data.data[0];
    let relatedPosts: any[] = [];
    
    if (post.category?._id && workingBaseUrl) {
      try {
        const relRes = await fetch(`${workingBaseUrl}/api/blog/posts?category=${post.category._id}&limit=3&status=published`, { 
          cache: 'no-store',
          headers: { 'User-Agent': 'NextJS-SSR' }
        });
        if (relRes.ok) {
          const rel = await relRes.json();
          if (rel?.success && Array.isArray(rel.data?.posts)) relatedPosts = rel.data.posts.filter((p: any) => p._id !== post._id);
        }
      } catch (e) {
        console.error('related posts fetch error', e instanceof Error ? e.message : String(e));
      }
    }
    return { post, relatedPosts };
  } catch (e) {
    console.error('getBlogPost error', e instanceof Error ? e.message : String(e));
    return null;
  }
}

// صفحه اصلی (Server Component)
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blogData = await getBlogPost(slug);

  if (!blogData) {
    notFound();
  }

  const { post, relatedPosts } = blogData;

  // تولید Schema ها
  const schemas = generateBlogSchema(post);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD Schema برای SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.article)
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
          __html: JSON.stringify(schemas.breadcrumb)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.website)
        }}
      />
      
      {/* H1 پنهان برای SEO */}
      <div className="hidden">
        <h1>{post.title}</h1>
        {post.excerpt && <h2>{post.excerpt}</h2>}
      </div>

      {/* پاس دادن به Client Component */}
      <BlogPostClient 
        post={post} 
        relatedPosts={relatedPosts}
        slug={slug}
      />
    </div>
  );
}