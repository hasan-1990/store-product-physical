import { generateSlug } from './url-server';

// Generate canonical blog post URL
// Pattern: /blog/<categoryPath?>/<postSlug>
// If categoryPath array exists (ordered), join; else just slug.
export function generateBlogPostUrl(post: any, options?: { categoryPath?: Array<{ slug: string }> }) {
  const slug = post.slug || generateSlug(post.title || post.name || 'post');
  let categoryPathStr = '';
  const path = options?.categoryPath || post.categoryPath || [];
  if (Array.isArray(path) && path.length) {
    categoryPathStr = path.map(c => c.slug).filter(Boolean).join('/');
  } else if (post.category && typeof post.category === 'object' && post.category.slug) {
    categoryPathStr = post.category.slug;
  }
  if (categoryPathStr) return `/blog/${categoryPathStr}/${slug}`;
  return `/blog/${slug}`;
}

// Parse blog URL segments for dynamic catch-all route
// Accept forms: [slug] OR [...categorySegments, slug]
export function parseBlogUrl(slugs: string[]): { postSlug?: string; categoryPath?: string[] } {
  if (!slugs || slugs.length === 0) return {};
  if (slugs.length === 1) return { postSlug: slugs[0] };
  const postSlug = slugs[slugs.length - 1];
  const categoryPath = slugs.slice(0, -1);
  return { postSlug, categoryPath };
}

// Basic validation for blog slug (Persian + Latin alphanumerics and dashes)
export function isValidBlogSlug(str: string) {
  return /^[\u0600-\u06FFa-z0-9\-]+$/i.test(str);
}

// Normalize legacy patterns (e.g., /blog/post-slug-<id>)
export function normalizeLegacyBlogSlug(segment: string) {
  // If ends with -<24hex> or -<digits>, strip ID
  const match = segment.match(/^(.*?)-(?:[a-f\d]{24}|\d{1,10})$/i);
  if (match) return match[1];
  return segment;
}

export function parseLegacyAware(slugs: string[]) {
  if (!slugs.length) return {};
  if (slugs.length === 1) {
    return { postSlug: normalizeLegacyBlogSlug(slugs[0]) };
  }
  const last = normalizeLegacyBlogSlug(slugs[slugs.length - 1]);
  return { postSlug: last, categoryPath: slugs.slice(0, -1) };
}