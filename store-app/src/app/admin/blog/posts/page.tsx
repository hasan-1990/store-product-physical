'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  category: { _id: string; name: string } | string;
  tags: { _id: string; name: string }[] | string[];
  status: 'draft' | 'published';
  author: string;
  publishDate: string;
  readTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPostsList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Prefer relative URL (avoids port / env mismatch in dev & works behind proxies)
      const response = await fetch(`/api/blog/posts?status=all`, { cache: 'no-store' });
      if (!response.ok) {
        console.error('Failed to fetch posts, status:', response.status);
        setPosts([]);
        return;
      }
      const data = await response.json();
      let extracted: any[] = [];
      if (Array.isArray(data)) {
        extracted = data;
      } else if (data?.data?.posts && Array.isArray(data.data.posts)) {
        extracted = data.data.posts;
      } else if (Array.isArray(data?.data)) {
        extracted = data.data;
      } else if (data?.success && data?.data && data.data.posts) {
        extracted = Array.isArray(data.data.posts) ? data.data.posts : [];
      }
      if (!extracted.length) {
        console.warn('Blog admin: no posts extracted. Raw payload:', data);
      }
      // Normalize minimal fields just in case
      extracted = extracted.map(p => ({
        ...p,
        status: p.status || (p.publishedAt ? 'published' : 'draft'),
        image: p.image || p.featuredImage || '',
        excerpt: p.excerpt || p.description || '',
      }));
      setPosts(extracted as BlogPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('آیا از حذف این پست اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/blog/posts?id=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        alert('خطا در حذف پست');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('خطا در حذف پست');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch(`/api/blog/posts?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setPosts((posts || []).map(post => 
          post._id === id ? { ...post, status: newStatus as 'draft' | 'published' } : post
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredPosts = (posts || []).filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white font-medium">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">📝 مدیریت پست‌های بلاگ</h1>
              <p className="text-blue-100 text-lg">مدیریت کامل محتوای بلاگ شما</p>
            </div>
            <Link
              href="/admin/blog/posts/new"
              className="px-8 py-4 bg-white/20 backdrop-blur-lg rounded-2xl hover:bg-white/30 transition-all duration-300 flex items-center gap-3 font-bold text-lg shadow-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              پست جدید
            </Link>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stats & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">منتشر شده</p>
                <p className="text-3xl font-bold">{(posts || []).filter(p => p.status === 'published').length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">پیش‌نویس</p>
                <p className="text-3xl font-bold">{(posts || []).filter(p => p.status === 'draft').length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">کل پست‌ها</p>
                <p className="text-3xl font-bold">{posts.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">نمایش</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 border border-gray-600/30'
                }`}
              >
                شبکه‌ای
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 border border-gray-600/30'
                }`}
              >
                لیستی
              </button>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="all">همه پست‌ها</option>
              <option value="published">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 shadow-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در پست‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg backdrop-blur-sm"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      {/* Posts Display */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-700/50 backdrop-blur-lg border border-gray-600/50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            📝
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">هیچ پستی یافت نشد</h3>
          <p className="text-gray-300 mb-6">برای شروع، اولین پست خود را ایجاد کنید</p>
          <Link
            href="/admin/blog/posts/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ایجاد پست جدید
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className={viewMode === 'grid' 
                ? 'bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'
                : 'bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-6'
              }
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">
                        📝
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-lg shadow ${
                        post.status === 'published' 
                          ? 'bg-green-600/85 text-white border border-green-400/50' 
                          : 'bg-orange-600/85 text-white border border-orange-400/50 animate-pulse'
                      }`}>
                        {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                      {post.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-900/70 border border-orange-400/40 text-orange-300 tracking-wide">
                          نیاز به انتشار
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.isArray(post.tags) && post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg text-xs">
                          {typeof tag === 'object' ? tag.name : tag}
                        </span>
                      ))}
                      {Array.isArray(post.tags) && post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-lg text-xs">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/blog/posts/edit/${post._id}`}
                          className="p-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="ویرایش"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        
                        <button
                          onClick={() => toggleStatus(post._id, post.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            post.status === 'published'
                              ? 'bg-orange-500/20 border border-orange-400/30 text-orange-300 hover:bg-orange-500/30'
                              : 'bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30'
                          }`}
                          title={post.status === 'published' ? 'تبدیل به پیش‌نویس' : 'انتشار'}
                        >
                          {post.status === 'published' ? '📝' : '✅'}
                        </button>
                        
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="مشاهده"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                        
                        <button
                          onClick={() => deletePost(post._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0 overflow-hidden">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        width={96}
                        height={96}
                        sizes="96px"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        📝
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-300 line-clamp-1">{post.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>
                    
                    <p className="text-gray-200 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(post.tags) && post.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg text-xs">
                            {typeof tag === 'object' ? tag.name : tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-200">
                          {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                        
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/blog/posts/edit/${post._id}`}
                            className="p-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="ویرایش"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          
                          <button
                            onClick={() => toggleStatus(post._id, post.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              post.status === 'published'
                                ? 'bg-orange-500/20 border border-orange-400/30 text-orange-300 hover:bg-orange-500/30'
                                : 'bg-green-500/20 border border-green-400/30 text-green-300 hover:bg-green-500/30'
                            }`}
                            title={post.status === 'published' ? 'تبدیل به پیش‌نویس' : 'انتشار'}
                          >
                            {post.status === 'published' ? '📝' : '✅'}
                          </button>
                          
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 bg-gray-500/20 border border-gray-400/30 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                            title="مشاهده"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Link>
                          
                          <button
                            onClick={() => deletePost(post._id)}
                            className="p-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}