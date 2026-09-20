'use client';

import React, { useState, useEffect } from 'react';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSave, 
  FiX, 
  FiEye, 
  FiEyeOff,
  FiSearch,
  FiRefreshCw,
  FiGlobe,
  FiImage,
  FiCode
} from 'react-icons/fi';

interface SEOPageData {
  _id: string;
  url: string;
  title: string;
  description: string;
  keywords: string;
  h1Title?: string;
  h2Title?: string;
  content?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
  customMeta?: Record<string, string>;
  isActive: boolean;
  isDiscovered?: boolean; // نشان‌دهنده صفحه کشف شده
  createdAt: string;
  updatedAt: string;
}

interface SEOPagesManagerProps {
  onTabChange?: (tab: string) => void;
}

const SEOPagesManager: React.FC<SEOPagesManagerProps> = ({ onTabChange }) => {
  const { modal, hideModal, showSuccess, showError, showConfirm } = useModal();
  const [pages, setPages] = useState<SEOPageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOPageData | null>(null);
  const [selectedSchemaType, setSelectedSchemaType] = useState('');
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    keywords: '',
    h1Title: '',
    h2Title: '',
    content: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
    robotsContent: 'index, follow',
    structuredData: '',
    isActive: true
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    console.log('🔄 شروع بارگذاری صفحات...');
    setLoading(true);
    try {
      // دریافت صفحات با صفحات کشف شده
      const response = await fetch('/api/admin/seo/pages/manage?include_discovered=true');
      const data = await response.json();
      
      console.log('📡 پاسخ دریافت شد:', data);
      
      if (data.success) {
        setPages(data.pages || []);
        console.log('✅ صفحات بارگذاری شد:', {
          total: data.pages?.length || 0,
          existing: data.existingCount,
          discovered: data.discoveredCount
        });
      } else {
        console.error('خطا در بارگذاری صفحات:', data.error);
        setPages([]);
      }
    } catch (error) {
      console.error('خطا در ارتباط با سرور:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  // تابع بررسی تکراری بودن محتوا
  const checkContentDuplication = (content: string, field: string = 'content') => {
    if (!content || content.length < 10) return { isDuplicate: false, message: '' };
    
    // چک کردن تکرار کلمات یکسان
    const words = content.split(/\s+/).filter(word => word.length > 2);
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    const uniqueWordCount = uniqueWords.size;
    
    const duplicatePercentage = ((wordCount - uniqueWordCount) / wordCount) * 100;
    
    // چک کردن تکرار جملات
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceCount = sentences.length;
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    const uniqueSentenceCount = uniqueSentences.size;
    
    const sentenceDuplicatePercentage = sentenceCount > 1 ? ((sentenceCount - uniqueSentenceCount) / sentenceCount) * 100 : 0;
    
    // چک کردن الگوهای تکراری
    const hasRepeatedPatterns = /(.{10,})\1{2,}/.test(content);
    
    if (hasRepeatedPatterns) {
      return {
        isDuplicate: true,
        message: '⚠️ محتوا دارای الگوهای تکراری زیادی است',
        type: 'error'
      };
    }
    
    if (duplicatePercentage > 50) {
      return {
        isDuplicate: true,
        message: `⚠️ ${duplicatePercentage.toFixed(0)}% کلمات تکراری هستند`,
        type: 'error'
      };
    }
    
    if (sentenceDuplicatePercentage > 30) {
      return {
        isDuplicate: true,
        message: `⚠️ ${sentenceDuplicatePercentage.toFixed(0)}% جملات تکراری هستند`,
        type: 'error'
      };
    }
    
    if (duplicatePercentage > 30) {
      return {
        isDuplicate: true,
        message: `💛 ${duplicatePercentage.toFixed(0)}% کلمات تکراری - سعی کنید متنوع‌تر بنویسید`,
        type: 'warning'
      };
    }
    
    return {
      isDuplicate: false,
      message: '✅ محتوا منحصر به فرد و مناسب است',
      type: 'success'
    };
  };

  // تابع بررسی کیفیت کلی محتوا
  const getContentQuality = (content: string) => {
    if (!content || content.length < 10) return { score: 0, message: '' };
    
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = content.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    let score = 0;
    let issues = [];
    let suggestions = [];
    
    // بررسی طول محتوا
    if (wordCount < 30) {
      issues.push('محتوا خیلی کوتاه است');
      suggestions.push('حداقل 30 کلمه بنویسید');
    } else if (wordCount < 60) {
      score += 20;
      suggestions.push('برای SEO بهتر، 60 کلمه یا بیشتر توصیه می‌شود');
    } else if (wordCount <= 100) {
      score += 40;
    } else if (wordCount <= 300) {
      score += 40;
    } else if (wordCount <= 500) {
      score += 35;
    } else {
      score += 30;
      suggestions.push('محتوا خیلی طولانی است - سعی کنید مختصر و مفید باشد');
    }
    
    // بررسی تنوع کلمات
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversityRatio = uniqueWords.size / words.length;
    if (diversityRatio > 0.7) {
      score += 30;
    } else if (diversityRatio > 0.5) {
      score += 20;
    } else {
      issues.push('تنوع کلمات کم است');
      suggestions.push('از کلمات متنوع‌تری استفاده کنید');
    }
    
    // بررسی ساختار جملات
    if (sentences.length > 2) {
      score += 20;
    } else {
      suggestions.push('جملات بیشتری اضافه کنید');
    }
    
    // بررسی نقطه‌گذاری
    const hasProperPunctuation = /[.!?]/.test(content);
    if (hasProperPunctuation) {
      score += 10;
    } else {
      suggestions.push('علائم نگارشی مناسب اضافه کنید');
    }
    
    return {
      score: Math.min(score, 100),
      wordCount,
      charCount,
      sentenceCount: sentences.length,
      issues,
      suggestions
    };
  };

  const resetForm = () => {
    setFormData({
      url: '',
      title: '',
      description: '',
      keywords: '',
      h1Title: '',
      h2Title: '',
      content: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
      robotsContent: 'index, follow',
      structuredData: '',
      isActive: true
    });
    setSelectedSchemaType('');
    setEditingPage(null);
    setShowForm(false);
  };

  const handleEdit = (page: SEOPageData) => {
    const structuredDataString = typeof page.structuredData === 'string' ? page.structuredData : JSON.stringify(page.structuredData || {}, null, 2);
    
    // تشخیص نوع schema از روی داده موجود
    let detectedSchemaType = '';
    if (page.structuredData) {
      try {
        const schemaData = typeof page.structuredData === 'string' ? JSON.parse(page.structuredData) : page.structuredData;
        if (schemaData['@type']) {
          detectedSchemaType = schemaData['@type'];
        }
      } catch (error) {
        console.log('خطا در پارس schema برای تشخیص نوع:', error);
      }
    }
    
    setFormData({
      url: page.url,
      title: page.title,
      description: page.description,
      keywords: page.keywords || '',
      h1Title: page.h1Title || '',
      h2Title: page.h2Title || '',
      content: (page as any).content || '',
      ogTitle: page.ogTitle || '',
      ogDescription: page.ogDescription || '',
      ogImage: page.ogImage || '',
      twitterTitle: page.twitterTitle || '',
      twitterDescription: page.twitterDescription || '',
      twitterImage: page.twitterImage || '',
      canonicalUrl: page.canonicalUrl || '',
      robotsContent: page.robotsContent || 'index, follow',
      structuredData: structuredDataString,
      isActive: page.isActive
    });
    setSelectedSchemaType(detectedSchemaType);
    setEditingPage(page);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀🚀🚀 HandleSubmit STARTED - Form submitted!');
    console.log('🚀 HandleSubmit called with formData:', formData);
    console.log('🚀 EditingPage:', editingPage);
    
    // Add more detailed logging
    console.log('🔍 Form validation check:');
    console.log('  - URL:', formData.url);
    console.log('  - Title:', formData.title);
    console.log('  - Description:', formData.description);
    console.log('  - H1 Title:', formData.h1Title);
    console.log('  - H2 Title:', formData.h2Title);
    console.log('  - Content:', formData.content);
    
    try {
      // Parse structuredData if it's a string
      let parsedStructuredData = null;
      if (formData.structuredData) {
        try {
          parsedStructuredData = JSON.parse(formData.structuredData);
        } catch (error) {
          console.error('❌ JSON Parse Error:', error);
          alert('فرمت JSON ساختار یافته (Schema) معتبر نیست');
          return;
        }
      }

      const submitData = {
        ...formData,
        structuredData: parsedStructuredData
      };

      const method = editingPage ? 'PUT' : 'POST';
      const url = editingPage ? 
        `/api/admin/seo/pages/manage?id=${editingPage._id}` : 
        `/api/admin/seo/pages/manage`;
      
      console.log('🚀 Request details:', { method, url, submitData });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('📡 Response received:', { status: response.status, ok: response.ok });

      // Check if response is ok and has content
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Response not JSON:', text);
        throw new Error(`Response is not JSON: ${text}`);
      }

      const data = await response.json();
      console.log('📋 Response data:', data);

      if (data.success) {
        console.log('💾 ذخیره موفق! شروع بارگذاری مجدد...');
        await loadPages();
        resetForm();
        showSuccess('موفقیت', data.message || 'عملیات با موفقیت انجام شد');
        console.log('✅ فرآیند ذخیره و بارگذاری کامل شد');
      } else {
        console.error('❌ خطا در API:', data);
        showError('خطا', data.error || 'خطای ناشناخته');
      }
    } catch (error) {
      console.error('❌ خطا در ذخیره صفحه:', error);
      showError('خطا در ذخیره', 'خطا در ذخیره صفحه: ' + (error instanceof Error ? error.message : 'خطای ناشناخته'));
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'تأیید حذف',
      'آیا مطمئن هستید که می‌خواهید این صفحه را حذف کنید؟',
      async () => {
        console.log(`🗑️ شروع حذف صفحه با ID: ${id}`);
        
        try {
          const response = await fetch(`/api/admin/seo/pages/manage?id=${id}`, {
            method: 'DELETE',
          });

          const data = await response.json();
          console.log('📡 پاسخ حذف دریافت شد:', data);

          if (data.success) {
            console.log('💾 حذف موفق! شروع بارگذاری مجدد...');
            await loadPages();
            showSuccess('حذف موفق', data.message);
            console.log('✅ فرآیند حذف و بارگذاری کامل شد');
          } else {
            showError('خطا در حذف', data.error);
          }
        } catch (error) {
          console.error('خطا در حذف صفحه:', error);
          showError('خطا در حذف', 'خطا در حذف صفحه');
        }
        hideModal();
      },
      'حذف کن',
      'انصراف'
    );
  };

  const toggleActive = async (page: SEOPageData) => {
    try {
      const response = await fetch('/api/admin/seo/pages/manage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: page._id,
          isActive: !page.isActive
        }),
      });

      const data = await response.json();

      if (data.success) {
        await loadPages();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('خطا در تغییر وضعیت:', error);
    }
  };

  const filteredPages = pages.filter(page =>
    page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت صفحات SEO</h2>
          <p className="text-gray-400">مدیریت تنظیمات SEO تمام صفحات سایت</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadPages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            بروزرسانی
          </button>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiPlus />
            صفحه جدید
          </button>
        </div>
      </div>

      {/* جستجو */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو در URL، عنوان یا توضیحات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">کل صفحات</p>
              <p className="text-2xl font-bold text-blue-400">{pages.length}</p>
            </div>
            <FiGlobe className="text-blue-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">صفحات فعال</p>
              <p className="text-2xl font-bold text-green-400">
                {pages.filter(p => p.isActive).length}
              </p>
            </div>
            <FiEye className="text-green-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">صفحات غیرفعال</p>
              <p className="text-2xl font-bold text-red-400">
                {pages.filter(p => !p.isActive).length}
              </p>
            </div>
            <FiEyeOff className="text-red-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* لیست صفحات */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-300 w-[180px]">URL</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-300 w-[200px]">عنوان</th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-300 w-[250px]">توضیحات</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-300 w-[60px]">وضعیت</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-300 w-[80px]">تاریخ</th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-300 w-[70px]">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPages.map((page) => (
                <tr key={page._id} className={`hover:bg-gray-700 ${page.isDiscovered ? 'bg-gray-800 border-l-4 border-l-yellow-500' : ''}`}>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-1">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium truncate max-w-[170px]"
                        title={page.url}
                      >
                        {page.url}
                      </a>
                      {page.isDiscovered && (
                        <span className="px-1 py-0.5 text-xs bg-yellow-600 text-yellow-100 rounded w-fit">
                          کشف شده
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-white text-sm font-medium truncate max-w-[190px]" title={page.title}>
                      {page.title}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-gray-300 text-sm truncate max-w-[240px]" title={page.description}>
                      {page.description}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => toggleActive(page)}
                      className={`p-1 rounded ${
                        page.isActive
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                    >
                      {page.isActive ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-400 text-xs">
                    {new Date(page.updatedAt).toLocaleDateString('fa-IR', {
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleEdit(page)}
                        className="p-1 text-blue-400 hover:text-blue-300"
                        title="ویرایش"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="p-1 text-red-400 hover:text-red-300"
                        title="حذف"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPages.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400">
            {searchTerm ? 'هیچ صفحه‌ای با این جستجو یافت نشد' : 'هنوز صفحه‌ای اضافه نشده است'}
          </div>
        )}
      </div>

      {/* فرم ایجاد/ویرایش */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingPage ? 'ویرایش صفحه' : 'ایجاد صفحه جدید'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اطلاعات اصلی */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL صفحه *
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="/page-url"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان صفحه *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  طول فعلی: {formData.title.length} کاراکتر (توصیه: 30-60 کاراکتر)
                </p>
              </div>

              {/* H1 Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان H1 صفحه
                </label>
                <input
                  type="text"
                  value={formData.h1Title}
                  onChange={(e) => setFormData({ ...formData, h1Title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.title || "عنوان اصلی صفحه برای H1"}
                />
                {formData.h1Title && (() => {
                  const duplicationCheck = checkContentDuplication(formData.h1Title, 'h1Title');
                  return (
                    <div className={`text-xs mt-1 px-2 py-1 rounded ${
                      duplicationCheck.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700' : 
                      duplicationCheck.type === 'warning' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 
                      'bg-green-900/30 text-green-400 border border-green-700'
                    }`}>
                      {duplicationCheck.message}
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-1">
                  💡 اگر خالی باشد، از عنوان صفحه استفاده می‌شود. باید منحصر به فرد باشد (30-60 کاراکتر)
                </p>
              </div>

              {/* H2 Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان H2 صفحه
                </label>
                <input
                  type="text"
                  value={formData.h2Title}
                  onChange={(e) => setFormData({ ...formData, h2Title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="عنوان فرعی صفحه برای H2"
                />
                {formData.h2Title && (() => {
                  const duplicationCheck = checkContentDuplication(formData.h2Title, 'h2Title');
                  return (
                    <div className={`text-xs mt-1 px-2 py-1 rounded ${
                      duplicationCheck.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700' : 
                      duplicationCheck.type === 'warning' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 
                      'bg-green-900/30 text-green-400 border border-green-700'
                    }`}>
                      {duplicationCheck.message}
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-1">
                  💡 عنوان فرعی مهم برای ساختار SEO و سلسله مراتب محتوا
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  توضیحات صفحه *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
                {formData.description && (() => {
                  const duplicationCheck = checkContentDuplication(formData.description, 'description');
                  return (
                    <div className={`text-xs mt-1 px-2 py-1 rounded ${
                      duplicationCheck.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700' : 
                      duplicationCheck.type === 'warning' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 
                      'bg-green-900/30 text-green-400 border border-green-700'
                    }`}>
                      {duplicationCheck.message}
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-1">
                  📏 طول فعلی: {formData.description.length} کاراکتر (توصیه: 120-160 کاراکتر) | 
                  💡 باید منحصر به فرد و توصیفی باشد
                </p>
              </div>

              {/* فیلد محتوای صفحه */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  محتوای صفحه
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="محتوای کامل صفحه را اینجا بنویسید..."
                />
                
                {/* بررسی کیفیت و تکرار محتوا */}
                {formData.content && (() => {
                  const duplicationCheck = checkContentDuplication(formData.content);
                  const qualityCheck = getContentQuality(formData.content);
                  
                  return (
                    <div className="mt-2 space-y-2">
                      {/* نمایش وضعیت تکرار */}
                      <div className={`text-xs px-2 py-1 rounded ${
                        duplicationCheck.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700' : 
                        duplicationCheck.type === 'warning' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 
                        'bg-green-900/30 text-green-400 border border-green-700'
                      }`}>
                        {duplicationCheck.message}
                      </div>
                      
                      {/* آمار محتوا */}
                      <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        📊 آمار: {qualityCheck.wordCount} کلمه | {qualityCheck.charCount} کاراکتر | {qualityCheck.sentenceCount} جمله
                        <span className={`ml-2 ${qualityCheck.score >= 70 ? 'text-green-400' : qualityCheck.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          | کیفیت: {qualityCheck.score}/100
                        </span>
                      </div>
                      
                      {/* مشکلات و پیشنهادات */}
                      {qualityCheck.issues && qualityCheck.issues.length > 0 && (
                        <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                          ⚠️ مشکلات: {qualityCheck.issues.join(', ')}
                        </div>
                      )}
                      
                      {qualityCheck.suggestions && qualityCheck.suggestions.length > 0 && (
                        <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                          💡 پیشنهادات: {qualityCheck.suggestions.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <p className="text-xs text-gray-400 mt-2">
                  💡 راهنما: محتوا باید منحصر به فرد، مفید و حداقل 30-60 کلمه باشد. از تکرار بیش از حد کلمات و جملات خودداری کنید.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  کلمات کلیدی
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="کلمه1, کلمه2, کلمه3"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* تنظیمات پیشرفته */}
              <details className="border border-gray-600 rounded-lg">
                <summary className="px-4 py-2 bg-gray-700 text-white cursor-pointer rounded-t-lg">
                  تنظیمات Open Graph و Twitter
                </summary>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        عنوان OG
                      </label>
                      <input
                        type="text"
                        value={formData.ogTitle}
                        onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                        placeholder={formData.title}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        تصویر OG
                      </label>
                      <input
                        type="url"
                        value={formData.ogImage}
                        onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      توضیحات OG
                    </label>
                    <textarea
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      placeholder={formData.description}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </details>

              <details className="border border-gray-600 rounded-lg">
                <summary className="px-4 py-2 bg-gray-700 text-white cursor-pointer rounded-t-lg">
                  تنظیمات تکمیلی
                </summary>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL کانونیکال
                      </label>
                      <input
                        type="url"
                        value={formData.canonicalUrl}
                        onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                        placeholder="https://example.com/canonical-url"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Robots Content
                      </label>
                      <select
                        value={formData.robotsContent}
                        onChange={(e) => setFormData({ ...formData, robotsContent: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="index, follow">Index, Follow</option>
                        <option value="index, nofollow">Index, NoFollow</option>
                        <option value="noindex, follow">NoIndex, Follow</option>
                        <option value="noindex, nofollow">NoIndex, NoFollow</option>
                      </select>
                    </div>
                  </div>
                </div>
              </details>

              {/* Schema Builder */}
              <details className="border border-gray-600 rounded-lg">
                <summary className="px-4 py-2 bg-blue-700 text-white cursor-pointer rounded-t-lg flex items-center gap-2">
                  <FiCode />
                  ساختارمند Schema (JSON-LD)
                </summary>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      نوع Schema
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                      value={selectedSchemaType}
                      onChange={(e) => {
                        const schemaType = e.target.value;
                        setSelectedSchemaType(schemaType);
                        let defaultSchema = {};
                        
                        if (schemaType === 'WebPage') {
                          defaultSchema = {
                            "@context": "https://schema.org",
                            "@type": "WebPage",
                            "name": formData.title,
                            "description": formData.description,
                            "url": formData.url
                          };
                        } else if (schemaType === 'Product') {
                          defaultSchema = {
                            "@context": "https://schema.org",
                            "@type": "Product",
                            "name": formData.title,
                            "description": formData.description,
                            "offers": {
                              "@type": "Offer",
                              "price": "0",
                              "priceCurrency": "IRR"
                            }
                          };
                        } else if (schemaType === 'Article') {
                          defaultSchema = {
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": formData.title,
                            "description": formData.description,
                            "author": {
                              "@type": "Organization",
                              "name": "فروشگاه آنلاین"
                            }
                          };
                        } else if (schemaType === 'Organization') {
                          defaultSchema = {
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "فروشگاه آنلاین",
                            "url": formData.url,
                            "description": formData.description
                          };
                        }
                        
                        setFormData({ 
                          ...formData, 
                          structuredData: JSON.stringify(defaultSchema, null, 2)
                        });
                      }}
                    >
                      <option value="">انتخاب نوع Schema</option>
                      <option value="WebPage">صفحه وب (WebPage)</option>
                      <option value="Product">محصول (Product)</option>
                      <option value="Article">مقاله (Article)</option>
                      <option value="Organization">سازمان (Organization)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      JSON-LD Schema
                    </label>
                    <textarea
                      value={formData.structuredData ? JSON.stringify(formData.structuredData, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData({ ...formData, structuredData: parsed });
                        } catch (error) {
                          // Keep the text for editing, but don't update structuredData until valid
                        }
                      }}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-green-400 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder='{"@context": "https://schema.org", "@type": "WebPage", ...}'
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Schema کمک می‌کند موتورهای جستجو محتوای شما را بهتر درک کنند
                    </p>
                  </div>
                </div>
              </details>

              {/* دکمه‌های عمل */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiSave />
                  {editingPage ? 'ذخیره تغییرات' : 'ایجاد صفحه'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </div>
  );
};

export default SEOPagesManager;