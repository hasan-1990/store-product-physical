'use client';
import { useState, useEffect } from 'react';
import { 
  LinkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useURLSettings } from '@/contexts/URLSettingsContext';

// استفاده از interface از Context

interface Redirect {
  id: string;
  from: string;
  to: string;
  type: '301' | '302' | '307';
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  hitCount: number;
  description: string;
}

interface URLManagerProps {
  onTabChange: (tab: string) => void;
}

export default function URLManager({ onTabChange }: URLManagerProps) {
  const [activeTab, setActiveTab] = useState('settings');
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddRedirect, setShowAddRedirect] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [testUrl, setTestUrl] = useState('');

  // استفاده از Context برای URL settings
  const { settings: contextSettings, updateSettings, isLoading: settingsLoading } = useURLSettings();
  
  // Local state برای فرم editing
  const [urlSettings, setUrlSettings] = useState(contextSettings);

  // بروزرسانی local state وقتی context تغییر می‌کند
  useEffect(() => {
    setUrlSettings(contextSettings);
  }, [contextSettings]);
  const [testResult, setTestResult] = useState<any>(null);

  const [newRedirect, setNewRedirect] = useState({
    from: '',
    to: '',
    type: '301' as '301' | '302' | '307',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo/urls');
      const data = await response.json();
      
      if (data.urlSettings) {
        setUrlSettings(data.urlSettings);
      }
      if (data.redirects) {
        setRedirects(data.redirects);
      }
    } catch (error) {
      console.error('خطا در بارگیری داده‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUrlSettings = async () => {
    if (!urlSettings) return;

    try {
      setSaving(true);
      // استفاده از Context برای بروزرسانی
      await updateSettings(urlSettings);
      alert('تنظیمات ذخیره شد و در کل سایت اعمال خواهد شد');
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const addRedirect = async () => {
    if (!newRedirect.from || !newRedirect.to) {
      alert('لطفاً فیلدهای اجباری را پر کنید');
      return;
    }

    try {
      const response = await fetch('/api/admin/seo/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add-redirect',
          data: newRedirect
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRedirects([...redirects, result.redirect]);
        setNewRedirect({ from: '', to: '', type: '301', description: '' });
        setShowAddRedirect(false);
        alert('ریدایرکت اضافه شد');
      }
    } catch (error) {
      alert('خطا در اضافه کردن ریدایرکت');
    }
  };

  const updateRedirect = async (redirect: Redirect) => {
    try {
      const response = await fetch('/api/admin/seo/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-redirect',
          data: redirect
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRedirects(redirects.map(r => r.id === redirect.id ? result.redirect : r));
        setEditingRedirect(null);
        alert('ریدایرکت به‌روزرسانی شد');
      }
    } catch (error) {
      alert('خطا در به‌روزرسانی ریدایرکت');
    }
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm('آیا از حذف این ریدایرکت مطمئن هستید؟')) return;

    try {
      const response = await fetch('/api/admin/seo/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete-redirect',
          data: { id }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRedirects(redirects.filter(r => r.id !== id));
        alert('ریدایرکت حذف شد');
      }
    } catch (error) {
      alert('خطا در حذف ریدایرکت');
    }
  };

  const testRedirect = async () => {
    if (!testUrl) return;

    try {
      const response = await fetch('/api/admin/seo/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-redirect',
          data: { from: testUrl }
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ found: false, message: 'خطا در تست' });
    }
  };

  const generateSlugPreview = (text: string) => {
    if (!urlSettings || !text) return '';

    let slug = text;
    
    // حذف کلمات ایست
    if (urlSettings.removeStopWords) {
      const stopWords = ['و', 'یا', 'در', 'به', 'از', 'که', 'این', 'آن', 'با', 'برای'];
      stopWords.forEach(word => {
        slug = slug.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
      });
    }

    // حذف اعداد
    if (urlSettings.removeNumbers) {
      slug = slug.replace(/[0-9]/g, '');
    }

    // جایگزینی فاصله‌ها
    slug = slug.replace(/\s+/g, urlSettings.separatorType);
    
    // حذف کاراکترهای غیرمجاز
    slug = slug.replace(/[^\u0600-\u06FFa-zA-Z0-9\-_]/g, '');
    
    // محدود کردن طول
    if (slug.length > urlSettings.maxSlugLength) {
      slug = slug.substring(0, urlSettings.maxSlugLength);
    }

    return slug.toLowerCase();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <LinkIcon className="h-6 w-6 text-green-400 ml-2" />
              مدیریت URL و ریدایرکت‌ها
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              تنظیمات ساختار URL و مدیریت ریدایرکت‌ها
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex space-x-1 space-x-reverse bg-gray-700/50 rounded-lg p-1">
          {[
            { id: 'settings', name: 'تنظیمات URL', icon: LinkIcon },
            { id: 'redirects', name: 'ریدایرکت‌ها', icon: ArrowPathIcon },
            { id: 'test', name: 'تست ریدایرکت', icon: EyeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4 ml-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* URL Settings Tab */}
      {activeTab === 'settings' && urlSettings && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">ساختار URL</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع ساختار URL</label>
                <select
                  value={urlSettings.urlStructure}
                  onChange={(e) => setUrlSettings({...urlSettings, urlStructure: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="id-only">شناسه فقط (/products/123)</option>
                  <option value="product-only">محصول فقط (/products/product-slug)</option>
                  <option value="category-product">دسته‌بندی + محصول (/products/category/product-slug)</option>
                </select>
              </div>

              {/* همیشه نمایش بده چون همه ساختارها از این گزینه‌ها استفاده می‌کنند */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">پیشوند دسته‌بندی</label>
                    <input
                      type="text"
                      value={urlSettings.categoryPrefix}
                      onChange={(e) => setUrlSettings({...urlSettings, categoryPrefix: e.target.value})}
                      placeholder="مثل: category"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2">پیشوند محصول</label>
                  <input
                    type="text"
                    value={urlSettings.productPrefix}
                    onChange={(e) => setUrlSettings({...urlSettings, productPrefix: e.target.value})}
                    placeholder="مثل: product"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">زبان Slug</label>
                  <select
                    value={urlSettings.slugLanguage}
                    onChange={(e) => setUrlSettings({...urlSettings, slugLanguage: e.target.value as any})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="persian">فارسی</option>
                    <option value="english">انگلیسی</option>
                    <option value="mixed">ترکیبی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">نوع جداکننده</label>
                  <select
                    value={urlSettings.separatorType}
                    onChange={(e) => setUrlSettings({...urlSettings, separatorType: e.target.value as any})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="-">خط تیره (-)</option>
                    <option value="_">زیرخط (_)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">حداکثر طول Slug</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={urlSettings.maxSlugLength}
                  onChange={(e) => setUrlSettings({...urlSettings, maxSlugLength: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={urlSettings.removeStopWords}
                    onChange={(e) => setUrlSettings({...urlSettings, removeStopWords: e.target.checked})}
                    className="ml-2"
                  />
                  حذف کلمات ایست (و، یا، در، ...)
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={urlSettings.includeId}
                    onChange={(e) => setUrlSettings({...urlSettings, includeId: e.target.checked})}
                    className="ml-2"
                  />
                  اضافه کردن ID به انتهای URL
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={urlSettings.removeNumbers}
                    onChange={(e) => setUrlSettings({...urlSettings, removeNumbers: e.target.checked})}
                    className="ml-2"
                  />
                  حذف اعداد از Slug
                </label>
              </div>
            </div>

            <button
              onClick={saveUrlSettings}
              disabled={saving}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">پیش‌نمایش URL</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">متن نمونه</label>
                <input
                  type="text"
                  placeholder="مثال: گوشی هوشمند سامسونگ گلکسی A54"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  onChange={(e) => {
                    const preview = generateSlugPreview(e.target.value);
                    const previewElement = document.getElementById('url-preview');
                    if (previewElement) {
                      previewElement.textContent = preview ? `/product/${preview}` : '';
                    }
                  }}
                />
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">URL تولید شده:</p>
                <p id="url-preview" className="text-green-400 font-mono"></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redirects Tab */}
      {activeTab === 'redirects' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">ریدایرکت‌ها</h3>
              <button
                onClick={() => setShowAddRedirect(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <PlusIcon className="h-4 w-4 ml-2" />
                افزودن ریدایرکت
              </button>
            </div>

            {redirects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-right py-3">از</th>
                      <th className="text-right py-3">به</th>
                      <th className="text-right py-3">نوع</th>
                      <th className="text-right py-3">وضعیت</th>
                      <th className="text-right py-3">تعداد کلیک</th>
                      <th className="text-right py-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redirects.map((redirect) => (
                      <tr key={redirect.id} className="border-b border-gray-700/50">
                        <td className="py-3 text-blue-400">{redirect.from}</td>
                        <td className="py-3">{redirect.to}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            redirect.type === '301' ? 'bg-green-600' : redirect.type === '302' ? 'bg-yellow-600' : 'bg-blue-600'
                          }`}>
                            {redirect.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            redirect.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {redirect.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="py-3">{redirect.hitCount}</td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => setEditingRedirect(redirect)}
                              className="p-1 text-blue-400 hover:text-blue-300"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteRedirect(redirect.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">هیچ ریدایرکتی تعریف نشده است</p>
            )}
          </div>

          {/* Add Redirect Modal */}
          {showAddRedirect && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">افزودن ریدایرکت جدید</h3>
                  <button
                    onClick={() => setShowAddRedirect(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">از (URL قدیم)</label>
                    <input
                      type="text"
                      value={newRedirect.from}
                      onChange={(e) => setNewRedirect({...newRedirect, from: e.target.value})}
                      placeholder="/old-page"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">به (URL جدید)</label>
                    <input
                      type="text"
                      value={newRedirect.to}
                      onChange={(e) => setNewRedirect({...newRedirect, to: e.target.value})}
                      placeholder="/new-page"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">نوع ریدایرکت</label>
                    <select
                      value={newRedirect.type}
                      onChange={(e) => setNewRedirect({...newRedirect, type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="301">301 - دائمی</option>
                      <option value="302">302 - موقت</option>
                      <option value="307">307 - موقت (پست حفظ شود)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">توضیحات</label>
                    <textarea
                      value={newRedirect.description}
                      onChange={(e) => setNewRedirect({...newRedirect, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                  <button
                    onClick={() => setShowAddRedirect(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={addRedirect}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    افزودن
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Redirect Modal */}
          {editingRedirect && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">ویرایش ریدایرکت</h3>
                  <button
                    onClick={() => setEditingRedirect(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">از (URL قدیم)</label>
                    <input
                      type="text"
                      value={editingRedirect.from}
                      onChange={(e) => setEditingRedirect({...editingRedirect, from: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">به (URL جدید)</label>
                    <input
                      type="text"
                      value={editingRedirect.to}
                      onChange={(e) => setEditingRedirect({...editingRedirect, to: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">نوع ریدایرکت</label>
                    <select
                      value={editingRedirect.type}
                      onChange={(e) => setEditingRedirect({...editingRedirect, type: e.target.value as any})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="301">301 - دائمی</option>
                      <option value="302">302 - موقت</option>
                      <option value="307">307 - موقت (پست حفظ شود)</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingRedirect.isActive}
                        onChange={(e) => setEditingRedirect({...editingRedirect, isActive: e.target.checked})}
                        className="ml-2"
                      />
                      فعال
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">توضیحات</label>
                    <textarea
                      value={editingRedirect.description}
                      onChange={(e) => setEditingRedirect({...editingRedirect, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                  <button
                    onClick={() => setEditingRedirect(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={() => updateRedirect(editingRedirect)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    به‌روزرسانی
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">تست ریدایرکت</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="/old-url"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={testRedirect}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <EyeIcon className="h-5 w-5 ml-2" />
                تست
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border-l-4 ${
                testResult.found 
                  ? 'bg-green-900/20 border-green-500' 
                  : 'bg-red-900/20 border-red-500'
              }`}>
                {testResult.found ? (
                  <div>
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 ml-2" />
                      <span className="font-medium text-green-400">ریدایرکت یافت شد</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      <span className="text-blue-400">{testResult.redirect.from}</span>
                      {' → '}
                      <span className="text-green-400">{testResult.redirect.to}</span>
                      <span className="text-gray-400"> ({testResult.redirect.type})</span>
                    </p>
                    {testResult.redirect.description && (
                      <p className="text-sm text-gray-400 mt-1">{testResult.redirect.description}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 ml-2" />
                      <span className="font-medium text-red-400">ریدایرکت یافت نشد</span>
                    </div>
                    <p className="text-sm text-gray-300">{testResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}