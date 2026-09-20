import { connectDB } from '@/lib/mongodb';
import BlogSectionClient from './BlogSectionClient';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  tags?: Array<{ _id?: string; name: string }>;
}

interface BlogSectionServerProps {
  limit?: number;
  showTitle?: boolean;
}

// Server Component - داده‌ها را از دیتابیس می‌گیرد
export default async function BlogSectionServer({ 
  limit = 6, 
  showTitle = true 
}: BlogSectionServerProps) {
  let posts: BlogPost[] = [];

  try {
    const db = await connectDB();
    
    // دریافت پست‌های منتشر شده از دیتابیس
    const blogPosts = await db.blogPosts
      .find({ 
        status: 'published',
        publishedAt: { $lte: new Date() }
      })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .toArray();
    
    // تبدیل به فرمت مورد نیاز
    posts = blogPosts.map((post: any) => ({
      _id: post._id?.toString() || '',
      title: post.title || '',
      slug: post.slug || '',
      featuredImage: post.featuredImage || '',
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      tags: Array.isArray(post.tags) ? post.tags.map((tag: any) => ({
        _id: tag._id?.toString(),
        name: tag.name || tag
      })) : []
    }));
  } catch (error) {
    console.error('Error loading blog posts from database:', error);
    // در صورت خطا، آرایه خالی برمی‌گرداند
    posts = [];
  }

  // اگر پستی نیست، null برگردان تا چیزی رندر نشود
  if (posts.length === 0) {
    return null;
  }

  // wrapper با ارتفاع ثابت برای جلوگیری از Layout Shift
  return (
    <div className="w-full min-h-[600px]">
      <BlogSectionClient 
        posts={posts}
        showTitle={showTitle}
      />
    </div>
  );
}
