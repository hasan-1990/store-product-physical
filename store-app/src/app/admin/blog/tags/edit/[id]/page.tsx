'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Tag {
  _id: string;
  name: string;
  slug: string;
  color: string;
}

export default function EditBlogTag() {
  const params = useParams();
  const router = useRouter();
  const tagId = params.id as string;

  const [tag, setTag] = useState<Tag>({
    _id: '',
    name: '',
    slug: '',
    color: '#6b46c1'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tagId) {
      fetchTag();
    }
  }, [tagId]);

  const fetchTag = async () => {
    try {
      const response = await fetch(`/api/blog/tags?id=${tagId}`);
      if (response.ok) {
        const data = await response.json();
        setTag(data);
      }
    } catch (error) {
      console.error('Error fetching tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tag.name.trim()) {
      alert('لطفاً نام برچسب را وارد کنید');
      return;
    }

    setSaving(true);

    try {
      const tagData = {
        ...tag,
        slug: generateSlug(tag.name)
      };

      const response = await fetch('/api/blog/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tagId, ...tagData }),
      });

      if (response.ok) {
        router.push('/admin/blog/tags');
      } else {
        const error = await response.text();
        alert(`خطا در ذخیره برچسب: ${error}`);
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('خطا در ذخیره برچسب');
    } finally {
      setSaving(false);
    }
  };

  const colorOptions = [
    '#6b46c1', '#7c3aed', '#db2777', '#dc2626', 
    '#ea580c', '#d97706', '#65a30d', '#16a34a',
    '#059669', '#0891b2', '#0284c7', '#2563eb',
    '#4f46e5', '#7c2d12', '#a21caf', '#be123c'
  ];

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
        <h1 className="text-3xl font-bold text-white">ویرایش برچسب</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          بازگشت
        </button>
      </div>

      <div className="max-w-2xl">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                نام برچسب *
              </label>
              <input
                type="text"
                value={tag.name}
                onChange={(e) => setTag({...tag, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="نام برچسب را وارد کنید..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                رنگ برچسب
              </label>
              <div className="grid grid-cols-8 gap-3 mb-4">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTag({...tag, color})}
                    className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                      tag.color === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tag.color}
                  onChange={(e) => setTag({...tag, color: e.target.value})}
                  className="w-12 h-10 rounded-lg bg-transparent border border-purple-500/30 cursor-pointer"
                />
                <span className="text-gray-300">یا رنگ دلخواه انتخاب کنید</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                پیش‌نمایش
              </label>
              <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
                <div
                  className="px-4 py-2 rounded-full text-white font-medium text-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  # {tag.name || 'نام برچسب'}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:transform-none"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}