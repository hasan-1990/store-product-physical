'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface ContentItem {
  key: string;
  value: string;
  category: string;
  description?: string;
  type?: string;
  isActive?: boolean;
  updatedAt?: string;
}

interface SiteSettingsEditorProps {
  onUpdate?: () => void;
}

export default function SiteSettingsEditor({ onUpdate }: SiteSettingsEditorProps) {
  const { data: session, status } = useSession() as { data: (Session & { user?: { role?: string; email?: string } }) | null; status: string };
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'seo', name: 'سئو و متاتگ‌ها', icon: GlobeAltIcon, color: 'blue' },
    { id: 'header', name: 'هدر و لوگو', icon: DocumentTextIcon, color: 'purple' },
    { id: 'homepage', name: 'صفحه اصلی', icon: HomeIcon, color: 'green' },
    { id: 'footer', name: 'فوتر و تماس', icon: DocumentTextIcon, color: 'gray' },
    { id: 'product', name: 'محصولات', icon: ShoppingBagIcon, color: 'orange' }
  ];

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/admin/dynamic-content');
      const result = await response.json();
      
      if (result.success) {
        setContents(result.data || []);
      }
    } catch (error) {
      console.error('خطا در دریافت محتوا:', error);
      toast.error('خطا در دریافت محتوا');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: ContentItem) => {
    setEditingKey(item.key);
    setEditValue(item.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const saveEdit = async (key: string) => {
    if (!editValue.trim()) {
      toast.error('مقدار نمی‌تواند خالی باشد');
      return;
    }

    console.log('🔐 Auth Debug:', { 
      status, 
      role: session?.user?.role
    });

    setSaving(true);
    try {
      const response = await fetch('/api/admin/dynamic-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value: editValue })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          toast.error('لطفاً ابتدا وارد شوید');
        } else {
          toast.error(result.error || 'خطا در ذخیره');
        }
        return;
      }

      toast.success('تغییرات ذخیره شد');
      fetchContents();
      setEditingKey(null);
      setEditValue('');
      onUpdate?.();
    } catch (error) {
      console.error('خطا در ذخیره:', error);
      toast.error('خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - فقط در محیط development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
          <pre className="text-xs text-yellow-700">
            Status: {status}
            {'\n'}Role: {session?.user?.role || 'N/A'}
            {'\n'}Email: {session?.user?.email || 'N/A'}
          </pre>
        </div>
      )}
      
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">تنظیمات محتوای سایت</h2>
        <p className="text-purple-100">
          تمام متن‌های سایت را از اینجا مدیریت کنید. تغییرات به صورت آنی اعمال می‌شوند.
        </p>
      </div>

      {categories.map((category) => {
        const categoryContents = contents.filter(c => c.category === category.id);
        
        if (categoryContents.length === 0) return null;

        return (
          <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className={`p-4 border-b-2 ${getColorClass(category.color)} flex items-center gap-3`}>
              <category.icon className="w-6 h-6" />
              <h3 className="text-lg font-bold">{category.name}</h3>
              <span className="mr-auto text-sm">{categoryContents.length} مورد</span>
            </div>

            <div className="divide-y">
              {categoryContents.map((item) => {
                const isEditing = editingKey === item.key;

                return (
                  <div key={item.key} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {item.key}
                          </code>
                          {item.type && (
                            <span className="text-xs text-gray-500">({item.type})</span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                        )}

                        {isEditing ? (
                          <div className="space-y-2">
                            {item.type === 'textarea' ? (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                autoFocus
                              />
                            ) : (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(item.key);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                              />
                            )}
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(item.key)}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                              >
                                <CheckIcon className="w-4 h-4" />
                                ذخیره
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                              >
                                <XMarkIcon className="w-4 h-4" />
                                انصراف
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="flex-1 p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-gray-800 whitespace-pre-wrap">{item.value}</p>
                            </div>
                          </div>
                        )}

                        {!isEditing && item.updatedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            آخرین ویرایش: {new Date(item.updatedAt).toLocaleDateString('fa-IR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {contents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">محتوایی یافت نشد</p>
          <p className="text-sm text-gray-400 mt-2">
            ابتدا اسکریپت seed را اجرا کنید
          </p>
        </div>
      )}
    </div>
  );
}
