'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import SessionDebugger from './SessionDebugger';

interface BlogPostClientProps {
  post: any;
  relatedPosts: any[];
  slug: string;
}

export default function BlogPostClient({ post, relatedPosts, slug }: BlogPostClientProps) {
  const { data: session, status } = useSession();
  const [commentForm, setCommentForm] = useState({
    name: '',
    email: '',
    content: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Debug: Log session state
  useEffect(() => {
    console.log('🔍 Blog Session Debug:', { 
      status, 
      session, 
      user: session?.user,
      hasSession: !!session,
      userName: session?.user?.name,
      userEmail: session?.user?.email
    });
  }, [session, status]);

  // Check both NextAuth session AND localStorage JWT token
  useEffect(() => {
    console.log('🔄 Checking authentication (both NextAuth and JWT)...');
    
    // Method 1: Check NextAuth session (for admins)
    if (session?.user) {
      console.log('✅ NextAuth session found (Admin):', session.user);
      setIsAuthenticated(true);
      setCurrentUser(session.user);
      setCommentForm(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }));
      return;
    }

    // Method 2: Check localStorage JWT token (for regular users)
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('✅ JWT token found (User):', user);
        
        // Verify token is not expired
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            setCommentForm(prev => ({
              ...prev,
              name: user.name || '',
              email: user.email || ''
            }));
            console.log('✅ User authenticated via JWT, filling form with:', {
              name: user.name,
              email: user.email
            });
          } else {
            console.log('❌ JWT token expired');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (e) {
          console.error('❌ Error parsing JWT token:', e);
        }
      } else {
        console.log('❌ No authentication found (neither NextAuth nor JWT)');
      }
    } catch (error) {
      console.error('❌ Error checking localStorage:', error);
    }
  }, [session, status]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use authenticated user data if available, otherwise use form data
      const submissionData = {
        postId: post._id,
        name: currentUser?.name || commentForm.name,
        email: currentUser?.email || commentForm.email,
        content: commentForm.content,
      };

      console.log('📤 Submitting comment:', submissionData);

      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        alert('نظر شما ثبت شد و پس از تایید نمایش داده خواهد شد');
        // Reset only content field, keep name and email if authenticated
        setCommentForm(prev => ({ 
          ...prev, 
          content: '',
          // Reset name and email only if user is not authenticated
          ...(isAuthenticated ? {} : { name: '', email: '' })
        }));
      } else {
        alert(result.error || 'خطا در ثبت نظر');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('خطا در ثبت نظر');
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Session Debugger - نمایش وضعیت لاگین */}
      <SessionDebugger />
      
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-purple-100">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center text-sm font-medium">
            <Link href="/" className="text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              خانه
            </Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/blog" className="text-purple-600 hover:text-purple-700 transition-colors">بلاگ</Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-700 line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">
            <div className="mb-6 flex items-center gap-4">
              {post.category && (
                <Link
                  href={`/blog?category=${post.category._id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {post.category.name}
                </Link>
              )}
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 mb-6 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-2xl text-gray-700 mb-8 leading-relaxed font-medium border-r-4 border-purple-500 pr-6 py-2 bg-gradient-to-r from-purple-50 to-transparent">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm mb-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-purple-100 shadow-md">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700">{post.author?.name || 'تیم فروشگاه هاب'}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-purple-100 shadow-md">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-gray-700">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
              
              {post.readTime && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-full border border-purple-100 shadow-md">
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-gray-700">{post.readTime} دقیقه مطالعه</span>
                </div>
              )}
            </div>

            {post.featuredImage && (
              <div className="relative h-80 md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-purple-500/20 border-4 border-white">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className="prose prose-xl max-w-none mb-16">
            <div 
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100 text-gray-800 leading-relaxed"
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.9'
              }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-12 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  برچسب‌های مرتبط
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {post.tags.map((tag: any) => (
                  <span
                    key={tag._id || tag.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold rounded-full hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 cursor-pointer hover:scale-110 shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}



          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  مقالات پیشنهادی
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost: any) => (
                  <Link
                    key={relatedPost._id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-purple-100 hover:border-purple-300 hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={relatedPost.featuredImage || '/images/products/placeholder.svg'}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-purple-900/40 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-xl font-bold text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300 line-clamp-2 mb-3">
                        {relatedPost.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(relatedPost.publishedAt || relatedPost.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-purple-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                نظرات و دیدگاه‌ها
              </h3>
            </div>
            
            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-12">
              {/* Loading state */}
              {status === 'loading' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-purple-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-purple-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show logged in user info */}
              {isAuthenticated && currentUser && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">شما به عنوان <span className="text-purple-600">{currentUser.name}</span> لاگین هستید</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show name/email fields only if user is not logged in */}
              {!isAuthenticated && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="comment-name" className="block text-sm font-bold text-gray-700 mb-3">
                      نام شما *
                    </label>
                    <input
                      id="comment-name"
                      name="comment-name"
                      type="text"
                      required
                      value={commentForm.name}
                      onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                      className="w-full px-5 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 bg-white/90 backdrop-blur placeholder-gray-400 font-medium"
                      placeholder="نام خود را وارد کنید"
                    />
                  </div>
                  <div>
                    <label htmlFor="comment-email" className="block text-sm font-bold text-gray-700 mb-3">
                      ایمیل شما *
                    </label>
                    <input
                      id="comment-email"
                      name="comment-email"
                      type="email"
                      required
                      value={commentForm.email}
                      onChange={(e) => setCommentForm({...commentForm, email: e.target.value})}
                      className="w-full px-5 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 bg-white/90 backdrop-blur placeholder-gray-400 font-medium"
                      placeholder="ایمیل خود را وارد کنید"
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="comment-content" className="block text-sm font-bold text-gray-700 mb-3">
                  نظر شما *
                </label>
                <textarea
                  id="comment-content"
                  name="comment-content"
                  required
                  rows={5}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 bg-white/90 backdrop-blur placeholder-gray-400 font-medium resize-none"
                  placeholder="نظر خود را بنویسید..."
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl shadow-purple-500/50 hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                ارسال نظر
              </button>
            </form>

            {/* Comments List - Placeholder */}
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/20">
                  <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-600 mb-2">هنوز نظری ثبت نشده است</p>
                <p className="text-gray-500">اولین نفری باشید که نظر می‌دهید!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}