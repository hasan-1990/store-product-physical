'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  LanguageIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  GlobeAltIcon,
  HomeIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { DynamicContent } from '@/types';

interface DynamicContentManagerProps {
  onUpdate?: () => void;
}

interface CategoryGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className: string }>;
  color: string;
  contents: DynamicContent[];
}

export default function DynamicContentManager({ onUpdate }: DynamicContentManagerProps) {
  const { data: session, status } = useSession() as { data: (Session & { user?: { role?: string; email?: string } }) | null; status: string };
  const [contents, setContents] = useState<DynamicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<DynamicContent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'categories'>('categories');

  const categories = [
    { value: 'all', label: 'همه' },
    { value: 'seo', label: 'سئو و متاتگ‌ها', icon: GlobeAltIcon, color: 'blue', name: 'سئو و متاتگ‌ها' },
    { value: 'header', label: 'هدر و لوگو', icon: DocumentTextIcon, color: 'purple', name: 'هدر و لوگو' },
    { value: 'homepage', label: 'صفحه اصلی', icon: HomeIcon, color: 'green', name: 'صفحه اصلی' },
    { value: 'footer', label: 'فوتر و تماس', icon: DocumentTextIcon, color: 'gray', name: 'فوتر و تماس' },
    { value: 'product', label: 'محصولات', icon: ShoppingBagIcon, color: 'orange', name: 'محصولات' },
    { value: 'general', label: 'عمومی', icon: DocumentTextIcon, color: 'indigo', name: 'عمومی' }
  ];

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      // اضافه کردن timestamp برای جلوگیری از cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/dynamic-content?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
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

  const handleSave = async (data: Partial<DynamicContent>) => {
    // بررسی احراز هویت - چک کردن هم NextAuth و هم localStorage
    const hasNextAuthSession = status === 'authenticated' && session?.user?.role === 'admin';
    const hasLocalStorage = typeof window !== 'undefined' && localStorage.getItem('user');
    
    console.log('🔐 DynamicContent Auth Debug:', { 
      status, 
      role: session?.user?.role, 
      hasNextAuthSession,
      hasLocalStorage
    });

    if (!hasNextAuthSession && !hasLocalStorage) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      
      // آماده‌سازی headers - NextAuth به صورت خودکار session را ارسال می‌کند
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // فقط اگر token در localStorage وجود دارد، به header اضافه کن
      // در غیر این صورت NextAuth session را خودکار مدیریت می‌کند
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch('/api/admin/dynamic-content', {
        method,
        headers,
        body: JSON.stringify(data),
        credentials: 'include' // مهم: برای ارسال cookies session
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingItem ? 'محتوا به‌روزرسانی شد' : 'محتوا ایجاد شد');
        fetchContents();
        setEditingItem(null);
        setShowAddModal(false);
        onUpdate?.();
      } else {
        toast.error(result.error || 'خطا در ذخیره محتوا');
      }
    } catch (error) {
      console.error('خطا در ذخیره محتوا:', error);
      toast.error('خطا در ذخیره محتوا');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('آیا از حذف این محتوا اطمینان دارید؟')) return;

    // بررسی احراز هویت - چک کردن هم NextAuth و هم localStorage
    const hasNextAuthSession = status === 'authenticated' && session?.user?.role === 'admin';
    const hasLocalStorage = typeof window !== 'undefined' && localStorage.getItem('user');

    if (!hasNextAuthSession && !hasLocalStorage) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }

    try {
      // آماده‌سازی headers - NextAuth به صورت خودکار session را ارسال می‌کند
      const headers: HeadersInit = {};
      
      // فقط اگر token در localStorage وجود دارد، به header اضافه کن
      // در غیر این صورت NextAuth session را خودکار مدیریت می‌کند
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`/api/admin/dynamic-content?key=${key}`, {
        method: 'DELETE',
        headers,
        credentials: 'include' // مهم: برای ارسال cookies session
      });

      const result = await response.json();

      if (result.success) {
        toast.success('محتوا حذف شد');
        fetchContents();
        onUpdate?.();
      } else {
        toast.error(result.error || 'خطا در حذف محتوا');
      }
    } catch (error) {
      console.error('خطا در حذف محتوا:', error);
      toast.error('خطا در حذف محتوا');
    }
  };

  const filteredContents = contents.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = !searchTerm || 
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchCategory && matchSearch;
  });

  const getCategoryGroups = (): CategoryGroup[] => {
    const groups: Record<string, CategoryGroup> = {};
    
    categories.forEach(cat => {
      if (cat.value !== 'all' && cat.icon) {
        groups[cat.value] = {
          id: cat.value,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          contents: contents.filter(c => c.category === cat.value)
        };
      }
    });
    
    return Object.values(groups).filter(g => g.contents.length > 0);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    };
    return colors[color] || colors.gray;
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'html': return <CodeBracketIcon className="w-4 h-4" />;
      case 'textarea': return <DocumentTextIcon className="w-4 h-4" />;
      case 'json': return <LanguageIcon className="w-4 h-4" />;
      default: return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">مدیریت محتوای داینامیک</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          افزودن محتوا
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="جستجو در کلید، مقدار یا توضیحات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="grid gap-4">
        {filteredContents.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-gray-400">محتوایی یافت نشد</p>
          </div>
        ) : (
          filteredContents.map((item) => (
            <div
              key={item.key}
              className="bg-gray-800 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-pink-400">{getTypeIcon(item.type)}</span>
                    <h3 className="font-semibold text-lg text-white">{item.key}</h3>
                    <span className="text-xs bg-pink-600/20 border border-pink-600/50 text-pink-300 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    {!item.isActive && (
                      <span className="text-xs bg-red-600/20 border border-red-600/50 text-red-300 px-2 py-1 rounded">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                  )}
                  
                  <div className="mt-2 p-3 bg-gray-900 rounded border border-gray-700">
                    <p className="text-sm text-gray-300 line-clamp-3">{item.value}</p>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    آخرین بروزرسانی: {new Date(item.updatedAt || '').toLocaleDateString('fa-IR')}
                  </div>
                </div>

                <div className="flex gap-2 mr-4">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-pink-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.key)}
                    className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <ContentModal
          item={editingItem}
          categories={categories.filter(c => c.value !== 'all')}
          onSave={handleSave}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

// Modal Component
function ContentModal({ 
  item, 
  categories, 
  onSave, 
  onClose 
}: { 
  item: DynamicContent | null;
  categories: { value: string; label: string }[];
  onSave: (data: Partial<DynamicContent>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<DynamicContent>>(
    item || {
      key: '',
      value: '',
      category: 'general',
      description: '',
      type: 'text',
      isActive: true
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">
            {item ? 'ویرایش محتوا' : 'افزودن محتوای جدید'}
          </h3>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                کلید (Key) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                disabled={!!item}
                placeholder="site_title, footer_about, seo_description"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-900 disabled:text-gray-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                از snake_case استفاده کنید (مثال: site_title)
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">دسته‌بندی</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">نوع محتوا</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="text">متن کوتاه</option>
                <option value="textarea">متن بلند</option>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">توضیحات</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیح کوتاه درباره این محتوا"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                مقدار <span className="text-red-400">*</span>
              </label>
              {formData.type === 'textarea' || formData.type === 'html' || formData.type === 'json' ? (
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-mono text-sm"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-500 bg-gray-700 border-gray-600"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                فعال
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-700">
              <button
                type="submit"
                className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-medium"
              >
                ذخیره
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
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
