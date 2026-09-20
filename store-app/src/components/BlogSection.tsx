'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface BlogSectionProps {
  limit?: number;
  showTitle?: boolean;
}

const BlogSection: React.FC<BlogSectionProps> = ({ 
  limit = 6, 
  showTitle = true 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const postsPerPage = 3;

  const { data: blogData, isLoading, error } = useQuery({
    queryKey: ['blog-posts', { limit, status: 'published' }],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts?limit=${limit}&status=published`);
      if (!response.ok) {
        throw new Error('خطا در دریافت پست‌های بلاگ');
      }
      return response.json();
    },
  });

  const posts = Array.isArray(blogData?.data?.posts) ? blogData.data.posts : [];
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const currentPosts = posts.slice(currentIndex * postsPerPage, (currentIndex + 1) * postsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1 >= totalPages ? 0 : prev + 1;
      return newIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1 < 0 ? totalPages - 1 : prev - 1;
      return newIndex;
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-white min-h-[600px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showTitle && (
            <div className="text-center mb-8">
              <div className="inline-block">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 relative">
                  مقالات و اخبار
                  <div className="absolute bottom-0 right-0 w-16 h-0.5 bg-orange-500"></div>
                </h2>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`loading-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !blogData?.success) {
    return null;
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-4 bg-white min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showTitle && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 relative">
                مقالات و اخبار
                <div className="absolute bottom-0 right-0 w-16 h-0.5 bg-orange-500"></div>
              </h2>
            </div>
            
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPosts.map((post: any) => (
            <article
              key={post._id}
              className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={post.featuredImage || '/images/products/placeholder.svg'}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Date Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-center shadow-md">
                  <div className="text-2xl font-bold text-gray-800 leading-none">
                    {new Date(post.publishedAt || post.createdAt).getDate().toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fa-IR', { month: 'short' })}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 text-right">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-reverse space-x-4">
                    <div className="flex items-center space-x-reverse space-x-1">
                      <span className="mr-1">۰ نظر</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4 justify-end">
                    {post.tags.slice(0, 3).map((tag: any, index: number) => (
                      <span
                        key={tag._id || tag.name || `tag-${index}`}
                        className="text-gray-500 text-sm"
                      >
                        {tag.name}
                        {index < Math.min(post.tags.length - 1, 2) && '، '}
                      </span>
                    ))}
                  </div>
                )}

                {/* Read More Button */}
                <div className="mt-4 text-right">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors duration-300"
                  >
                    <span className="ml-2">ادامه مطلب</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-orange-500 w-6'
                    : 'bg-gray-300 hover:bg-orange-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;