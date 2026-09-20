'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tag {
  _id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  postsCount?: number;
}

export default function BlogTagsList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!confirm('آیا از حذف این برچسب اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/blog/tags?id=${tagId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTags();
      } else {
        alert('خطا در حذف برچسب');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('خطا در حذف برچسب');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">مدیریت برچسب‌ها</h1>
        <Link
          href="/admin/blog/tags/new"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
        >
          + برچسب جدید
        </Link>
      </div>

      {/* Search */}
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در برچسب‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Tags List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">هیچ برچسبی یافت نشد</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm ? 'با این کلمات کلیدی برچسبی یافت نشد' : 'هنوز هیچ برچسبی ایجاد نشده است'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/blog/tags/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
            >
              + اولین برچسب را ایجاد کنید
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <div
              key={tag._id}
              className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="px-4 py-2 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: tag.color || '#6b46c1' }}
                >
                  # {tag.name}
                </div>
                
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/blog/tags/edit/${tag._id}`}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                    title="ویرایش"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => deleteTag(tag._id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                  <span>اسلاگ:</span>
                  <span className="text-gray-300">{tag.slug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>تاریخ ایجاد:</span>
                  <span className="text-gray-300">{new Date(tag.createdAt).toLocaleDateString('fa-IR')}</span>
                </div>
                {tag.postsCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>تعداد پست:</span>
                    <span className="text-gray-300">{tag.postsCount} پست</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}