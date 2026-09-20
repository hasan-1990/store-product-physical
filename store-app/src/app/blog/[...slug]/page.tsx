import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { parseLegacyAware, generateBlogPostUrl } from '@/lib/blog-url-server';
// Temporary debug: remove after 404 issue resolved


// Fetch blog post by slug (API wrapper)
async function fetchPost(slug: string) {
  // Always request status=all so legacy posts without status or drafts (for preview) can be handled; visibility control can be added later
  const base = process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL : '';
  const res = await fetch(`${base}/api/blog/posts?slug=${encodeURIComponent(slug)}&status=all`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.success && Array.isArray(data.data) && data.data.length) return data.data[0];
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseLegacyAware(slug);
  if (!parsed.postSlug) return { title: 'بلاگ' };
  const post = await fetchPost(parsed.postSlug);
  if (!post) return { title: 'مقاله یافت نشد' };
  const title = `${post.title} | بلاگ`;
  const desc = post.excerpt || post.description || `مطالعه ${post.title}`;
  const image = post.featuredImage || '/images/products/placeholder.svg';
  return {
    title,
    description: desc,
    alternates: { canonical: generateBlogPostUrl(post) },
    openGraph: { title, description: desc, images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title, description: desc, images: [image] }
  };
}

export default async function BlogCatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  
  // If it's a simple slug (single segment), redirect to proper [slug] route
  if (slug.length === 1) {
    redirect(`/blog/${slug[0]}`);
  }
  
  // For multi-segment paths, try to extract the last segment as post slug
  // This handles legacy URLs like /blog/category/post-slug
  const postSlug = slug[slug.length - 1];
  if (postSlug) {
    redirect(`/blog/${postSlug}`);
  }
  
  // Fallback to 404 if no valid slug found
  notFound();
}