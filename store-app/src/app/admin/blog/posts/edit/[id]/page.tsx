'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageGallery from '@/components/ImageGallery';
import TiptapRichEditor from '@/components/TiptapRichEditor';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string; // legacy field name used in editor
  image?: string;        // creation form uses `image`
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  author: string;
  publishDate: string;
  readTime: number;
  featured?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export default function EditBlogPost() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<BlogPost>({
    _id: '',
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    category: '',
    tags: [],
    status: 'draft',
    author: 'مدیر سایت',
    publishDate: new Date().toISOString(),
    readTime: 5
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchCategories();
      fetchTags();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      // Use relative URL to avoid port/env issues
      const response = await fetch(`/api/blog/posts?id=${postId}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        // Normalize incoming post: ensure category is an id string, image field alignment, etc.
        const normalized: any = { ...data };
        if (data.category && typeof data.category === 'object' && data.category._id) {
          normalized.category = data.category._id;
        } else if (data.categoryId) {
          normalized.category = data.categoryId;
        }
        // unify image fields
        if (!normalized.featuredImage && normalized.image) {
          normalized.featuredImage = normalized.image;
        }
        if (typeof normalized.featured === 'undefined') {
          normalized.featured = !!normalized.isFeatured || false;
        }
        setPost(normalized);
        setSelectedTags(Array.isArray(data.tags) ? data.tags.map((tag: any) => typeof tag === 'object' ? tag._id : tag) : []);
      } else {
        console.error('Failed to fetch post, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/blog/categories`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/blog/tags`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        console.error('Failed to fetch tags, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const sanitizeSlug = (raw: string) => raw
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  useEffect(() => {
    if (autoSlug) {
      setPost(prev => ({ ...prev, slug: sanitizeSlug(prev.title) }));
    }
  }, [post.title, autoSlug]);

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    if (!post.title.trim() || !post.content.trim()) {
      alert('لطفاً عنوان و محتوای پست را وارد کنید');
      return;
    }

    setSaving(true);

    try {
      const { _id, ...rest } = post; // exclude immutable _id from update payload body
      const postData: any = {
        ...rest,
        slug: sanitizeSlug(post.slug || post.title),
        readTime: calculateReadTime(post.content),
        tags: selectedTags,
        status: isDraft ? 'draft' : 'published',
        publishDate: isDraft ? post.publishDate : new Date().toISOString()
      };

      // Ensure category is just the id string
      if (postData.category && typeof postData.category === 'object' && postData.category._id) {
        postData.category = postData.category._id;
      }

      // map editor field to API field name consistency
      if (postData.featuredImage && !postData.image) {
        postData.image = postData.featuredImage;
      }

      const response = await fetch(`/api/blog/posts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: postId, ...postData }),
      });

      if (response.ok) {
        toast.success(isDraft ? 'پست با موفقیت ذخیره شد' : 'پست با موفقیت منتشر شد');
        router.push('/admin/blog/posts');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'خطای ناشناخته' }));
        toast.error(`خطا در ذخیره پست: ${errorData.error || 'خطای ناشناخته'}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('خطا در ذخیره پست');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">ویرایش پست بلاگ</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setPreview(!preview)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            {preview ? 'ویرایش' : 'پیش‌نمایش'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            {preview ? (
              <div className="prose prose-invert max-w-none">
                <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
                <div className="text-gray-300 mb-6">{post.excerpt}</div>
                <div 
                  className="text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
                />
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                <div className="grid gap-6">
                  {/* Title */}
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    عنوان پست *
                  </label>
                  <input
                    type="text"
                    value={post.title}
                    onChange={(e) => setPost({...post, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="عنوان پست را وارد کنید..."
                    required
                  />
                  {/* Slug */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        نامک (Slug) *
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoSlug}
                          onChange={(e) => setAutoSlug(e.target.checked)}
                          className="rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-400"
                        />
                        تولید خودکار
                      </label>
                    </div>
                    <input
                      type="text"
                      value={post.slug}
                      onChange={(e) => {
                        setPost({ ...post, slug: sanitizeSlug(e.target.value) });
                        if (autoSlug) setAutoSlug(false);
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors ltr"
                      placeholder="seo-friendly-slug"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-400">آدرس: /blog/{post.slug || 'slug'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    خلاصه پست
                  </label>
                  <textarea
                    value={post.excerpt}
                    onChange={(e) => setPost({...post, excerpt: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                    placeholder="خلاصه‌ای کوتاه از پست..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">محتوای پست *</label>
                  <TiptapRichEditor
                    value={post.content}
                    onChange={(value: string) => setPost({ ...post, content: value })}
                    placeholder="محتوای کامل پست را وارد کنید..."
                  />
                  <p className="mt-2 text-xs text-gray-500">زمان تقریبی مطالعه: {calculateReadTime(post.content)} دقیقه</p>
                </div>

                <div>
                  <ImageGallery
                    selectedImage={post.featuredImage}
                    onImageSelect={(imageUrl: string) => setPost({...post, featuredImage: imageUrl})}
                    source="blog"
                    title="انتخاب تصویر شاخص برای ویرایش"
                    imageType="banner"
                    autoResize={true}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:transform-none"
                  >
                    {saving ? 'در حال ذخیره...' : 'انتشار پست'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium disabled:opacity-50"
                  >
                    ذخیره پیش‌نویس
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category Selection */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-medium text-white mb-4">دسته‌بندی</h3>
            <select
              value={post.category}
              onChange={(e) => setPost({...post, category: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Selection */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-medium text-white mb-4">برچسب‌ها</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag._id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag._id)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Author Info */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-medium text-white mb-4">اطلاعات نویسنده</h3>
            <input
              type="text"
              value={post.author}
              onChange={(e) => setPost({...post, author: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
              placeholder="نام نویسنده..."
            />
          </div>

          {/* Status */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-medium text-white mb-4">وضعیت انتشار</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={post.status === 'draft'}
                  onChange={(e) => setPost({...post, status: e.target.value as 'draft' | 'published'})}
                  className="ml-2 text-purple-500 focus:ring-purple-400"
                />
                <span className="text-gray-300">پیش‌نویس</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={post.status === 'published'}
                  onChange={(e) => setPost({...post, status: e.target.value as 'draft' | 'published'})}
                  className="ml-2 text-purple-500 focus:ring-purple-400"
                />
                <span className="text-gray-300">منتشر شده</span>
              </label>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-medium text-white mb-4">تنظیمات ویژه</h3>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={!!post.featured}
                onChange={(e) => setPost({ ...post, featured: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-400"
              />
              نمایش این مقاله به عنوان «ویژه»
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}