'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SEOManager from '@/components/SEOManager';
import { BlogPageSchema, BlogListSchema, BlogCategorySchema } from '@/components/SEO/BlogSchema';
import { BreadcrumbSchema } from '@/components/SEO/ProductSchema';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const postsPerPage = 9;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const response = await fetch('/api/blog/categories?active=true');
      if (!response.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها');
      return response.json();
    },
  });

  // Fetch posts
  const { data: postsData, isLoading, error } = useQuery({
    queryKey: ['blog-posts', { 
      category: selectedCategory, 
      search: searchQuery, 
      page: currentPage,
      limit: postsPerPage,
      status: 'published'
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: postsPerPage.toString(),
        page: currentPage.toString(),
        status: 'published'
      });
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) throw new Error('خطا در دریافت پست‌ها');
      return response.json();
    },
  });

  const categories = categoriesData?.data || [];
  const posts = Array.isArray(postsData?.data?.posts) ? postsData.data.posts : [];
  const totalPages = Math.ceil((postsData?.data?.pagination?.totalPosts || 0) / postsPerPage);

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-red-200 max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/20 animate-pulse">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">خطا در بارگذاری!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">متاسفانه در بارگذاری مقالات خطایی رخ داده است. لطفاً مجدداً تلاش کنید.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تلاش مجدد
            </span>
          </button>
        </div>
      </div>
    );
  }

  // دسته‌بندی انتخاب شده
  const selectedCategoryName = categories.find((cat: any) => cat._id === selectedCategory)?.name;

  return (
    <SEOManager 
      url="/blog" 
      fallbackTitle="مجله آنلاین - مقالات و اخبار"
      fallbackDescription="مطالعه جدیدترین مقالات، راهنماها و اخبار در مجله آنلاین ما"
    >
      {/* JSON-LD Schema برای گوگل - امتیاز مثبت SEO */}
      <BlogPageSchema 
        totalPosts={postsData?.data?.pagination?.totalPosts || 0}
        category={selectedCategoryName}
      />
      <BlogListSchema 
        posts={posts.map((post: any) => ({
          title: post.title,
          description: post.excerpt || post.description,
          slug: post.slug,
          author: post.author?.name || 'نویسنده',
          publishDate: post.publishedAt || post.createdAt,
          image: post.image
        }))}
        category={selectedCategoryName}
      />
      {selectedCategoryName && (
        <BlogCategorySchema 
          categoryName={selectedCategoryName}
          postCount={postsData?.data?.pagination?.totalPosts || 0}
        />
      )}
      <BreadcrumbSchema 
        items={[
          { name: 'خانه', url: '/' },
          { name: 'مجله', url: '/blog' },
          ...(selectedCategoryName ? [{ name: selectedCategoryName, url: `/blog?category=${selectedCategory}` }] : [])
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50" dir="rtl">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)',
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/50 mb-4 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 drop-shadow-2xl">
              مجله و بلاگ
            </h1>
            
            <p className="text-2xl md:text-3xl font-bold text-purple-300">
              آخرین مطالب و اخبار روز
            </p>
            
            <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
              با ما همراه باشید تا از جدیدترین مطالب، راهنماها و نکات کاربردی دنیای تکنولوژی و فناوری مطلع شوید
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{postsData?.data?.pagination?.totalPosts || 0}</div>
                <div className="text-sm text-purple-300">مقاله منتشر شده</div>
              </div>
              <div className="w-px bg-purple-500/30"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{categories.length}</div>
                <div className="text-sm text-purple-300">دسته‌بندی</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 fill-slate-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-12 border border-purple-200/50">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 w-full lg:max-w-md">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در مقالات..."
                  className="w-full px-6 py-4 pr-14 text-lg border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 placeholder-gray-400 bg-white/90 backdrop-blur"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-purple-500 hover:text-purple-600 hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-semibold">نمایش:</span>
              <div className="flex bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-1.5 shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                دسته‌بندی‌ها
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/50'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border-2 border-purple-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  همه مقالات
                </span>
              </button>
              {categories.map((category: any) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryFilter(category._id)}
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === category._id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/50'
                      : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border-2 border-purple-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {category.name}
                    <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                      {category.postCount || 0}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-24">
            <div className="inline-flex flex-col items-center gap-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200"></div>
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-purple-500 border-r-pink-500 absolute top-0 left-0"></div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">در حال بارگذاری...</p>
                <p className="text-gray-500">لطفاً صبر کنید</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && (
          <>
            {posts.length > 0 ? (
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-8'
              }`}>
                {posts.map((post: any) => (
                  <article
                    key={post._id}
                    className={`group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-purple-200/50 hover:border-purple-400 hover:-translate-y-2 ${
                      viewMode === 'list' ? 'flex gap-6 p-6' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-48 flex-shrink-0 rounded-2xl' : 'aspect-video'
                    }`}>
                      <Image
                        src={post.image || '/images/blog/default-blog.jpg'}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700"
                        priority={false}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/blog/default-blog.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-purple-900/50 to-transparent opacity-80"></div>
                      
                      {/* Category Badge */}
                      {post.category && (
                        <div className="absolute top-4 right-4">
                          <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-2xl shadow-purple-500/50 backdrop-blur-sm">
                            {post.category.name}
                          </span>
                        </div>
                      )}

                      {/* Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Content */}
                    <div className={`${viewMode === 'list' ? 'flex-1' : 'p-7'}`}>
                      {/* Date and Read Time */}
                      <div className="flex items-center gap-5 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{new Date(post.publishedAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-pink-50 px-3 py-1.5 rounded-full">
                          <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{post.readTime || 3} دقیقه</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300 line-clamp-2 leading-tight">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed text-base">
                        {post.excerpt || 'خلاصه‌ای از این مقاله در دسترس نیست.'}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {post.tags.slice(0, 3).map((tag: any, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-semibold rounded-full hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 cursor-pointer"
                            >
                              #{tag.name || tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Read More Button */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl shadow-purple-500/50 hover:scale-105 group/btn"
                      >
                        ادامه مطالعه
                        <svg className="w-5 h-5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/20 animate-bounce">
                  <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">مقاله‌ای یافت نشد!</h3>
                <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">متاسفانه با فیلترهای انتخابی شما هیچ مقاله‌ای پیدا نشد. لطفاً جستجوی دیگری امتحان کنید.</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    مشاهده همه مقالات
                  </span>
                </button>
              </div>
            )}

            {/* Pagination */}
            {posts.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-16">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-3xl shadow-2xl border border-purple-200/50">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-3 text-purple-600 bg-white border-2 border-purple-200 rounded-2xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold hover:scale-105 disabled:hover:scale-100"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      قبلی
                    </span>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[48px] h-12 rounded-2xl font-bold transition-all duration-300 hover:scale-110 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                            : 'text-gray-600 bg-white border-2 border-purple-100 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-3 text-purple-600 bg-white border-2 border-purple-200 rounded-2xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold hover:scale-105 disabled:hover:scale-100"
                  >
                    <span className="flex items-center gap-2">
                      بعدی
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </SEOManager>
  );
}