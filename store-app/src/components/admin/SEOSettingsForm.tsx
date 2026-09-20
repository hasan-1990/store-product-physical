'use client';
import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';

interface GlobalSEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  siteName: string;
  language: string;
  direction: string;
  allowCrawling: boolean;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  seoKeywords?: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
    telegram: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  aboutPage?: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroBadgeText?: string;
    storyTitle?: string;
    storySubtitle?: string;
    storyParagraph1?: string;
    storyParagraph2?: string;
    storyParagraph3?: string;
    missionTitle?: string;
    missionDescription?: string;
    valuesTitle?: string;
    valuesSubtitle?: string;
    value1Title?: string;
    value1Description?: string;
    value2Title?: string;
    value2Description?: string;
    value3Title?: string;
    value3Description?: string;
    contactTitle?: string;
    contactSubtitle?: string;
    socialTitle?: string;
    socialSubtitle?: string;
  };
}

interface SEOSettingsFormProps {
  onTabChange: (tab: string) => void;
}

export default function SEOSettingsForm({ onTabChange }: SEOSettingsFormProps) {
  const [settings, setSettings] = useState<GlobalSEOSettings>({
    siteTitle: '',
    siteDescription: '',
    siteUrl: '',
    siteName: '',
    language: 'fa',
    direction: 'rtl',
    allowCrawling: true,
    googleSiteVerification: '',
    googleAnalyticsId: '',
    googleTagManagerId: '',
    seoKeywords: '',
    socialMedia: {
      twitter: '',
      facebook: '',
      instagram: '',
      telegram: ''
    },
    contact: {
      email: '',
      phone: '',
      address: ''
    },
    aboutPage: {
      heroTitle: '',
      heroSubtitle: '',
      heroBadgeText: '',
      storyTitle: '',
      storySubtitle: '',
      storyParagraph1: '',
      storyParagraph2: '',
      storyParagraph3: '',
      missionTitle: '',
      missionDescription: '',
      valuesTitle: '',
      valuesSubtitle: '',
      value1Title: '',
      value1Description: '',
      value2Title: '',
      value2Description: '',
      value3Title: '',
      value3Description: '',
      contactTitle: '',
      contactSubtitle: '',
      socialTitle: '',
      socialSubtitle: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general'); // general, about
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/seo');
      const data = await response.json();
      
      if (data.global) {
        setSettings(data.global);
      }
    } catch (error) {
      console.error('خطا در بارگیری تنظیمات:', error);
      setMessage({ type: 'error', text: 'خطا در بارگیری تنظیمات' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      console.log('Saving settings:', settings);
      
      const requestBody = {
        global: {
          ...settings,
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fakeAdminToken = typeof window !== 'undefined' ? localStorage.getItem('fakeAdminToken') : null;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token || fakeAdminToken) {
        headers.Authorization = `Bearer ${token || fakeAdminToken}`;
      }
      
      const response = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' });
        // بازگشت به داشبورد برای نمایش تغییرات
        setTimeout(() => {
          onTabChange('dashboard');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'خطا در ذخیره تنظیمات' });
      }
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
      setMessage({ 
        type: 'error', 
        text: `خطا در ذخیره تنظیمات: ${error instanceof Error ? error.message : 'خطای ناشناخته'}` 
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (field: string, value: any) => {
    setSettings(prev => {
      if (field.startsWith('aboutPage.')) {
        const aboutField = field.replace('aboutPage.', '');
        return {
          ...prev,
          aboutPage: {
            ...prev.aboutPage,
            [aboutField]: value
          }
        };
      } else if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof GlobalSEOSettings] as any),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">در حال بارگیری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* پیام وضعیت */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-900/50 border-green-500 text-green-300' 
            : 'bg-red-900/50 border-red-500 text-red-300'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 ml-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 ml-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* تب‌های بخش‌ها */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveSection('general')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeSection === 'general'
                ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            تنظیمات عمومی
          </button>
          <button
            onClick={() => setActiveSection('about')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeSection === 'about'
                ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            محتوای صفحه درباره ما
          </button>
        </div>
      </div>

      {/* بخش تنظیمات عمومی */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          {/* تنظیمات کلی سایت */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-blue-400 ml-2" />
              تنظیمات کلی سایت
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              عنوان سایت *
            </label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => updateSettings('siteTitle', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="فروشگاه آنلاین"
              maxLength={60}
            />
            <p className="text-xs text-gray-400 mt-1">حداکثر 60 کاراکتر</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              نام سایت
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => updateSettings('siteName', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="My Store"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              توضیحات سایت *
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => updateSettings('siteDescription', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              rows={3}
              placeholder="بهترین محصولات با کیفیت عالی و قیمت مناسب"
              maxLength={160}
            />
            <p className="text-xs text-gray-400 mt-1">حداکثر 160 کاراکتر - {settings.siteDescription.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              آدرس سایت *
            </label>
            <input
              type="url"
              value={settings.siteUrl}
              onChange={(e) => updateSettings('siteUrl', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="https://mystore.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              زبان سایت
            </label>
            <select
              value={settings.language}
              onChange={(e) => updateSettings('language', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="fa">فارسی</option>
              <option value="en">انگلیسی</option>
              <option value="ar">عربی</option>
            </select>
          </div>
        </div>
      </div>

      {/* تنظیمات Google */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <CogIcon className="h-6 w-6 text-green-400 ml-2" />
          تنظیمات Google
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Site Verification
            </label>
            <input
              type="text"
              value={settings.googleSiteVerification}
              onChange={(e) => updateSettings('googleSiteVerification', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="google1234567890abcdef.html"
            />
            <p className="text-xs text-gray-400 mt-1">کد تأیید Google Search Console</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Analytics ID
            </label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => updateSettings('googleAnalyticsId', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="G-XXXXXXXXXX یا UA-XXXXXXXX-X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Tag Manager ID
            </label>
            <input
              type="text"
              value={settings.googleTagManagerId}
              onChange={(e) => updateSettings('googleTagManagerId', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="GTM-XXXXXXX"
            />
          </div>
        </div>
      </div>

      {/* فیلد کلمات کلیدی */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6">کلمات کلیدی SEO</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            کلمات کلیدی (با ویرگول جدا کنید)
          </label>
          <textarea
            value={settings.seoKeywords || ''}
            onChange={(e) => updateSettings('seoKeywords', e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            rows={2}
            placeholder="فروشگاه آنلاین, خرید آنلاین, محصولات با کیفیت"
          />
          <p className="text-xs text-gray-400 mt-1">این کلمات در متا تگ keywords استفاده می‌شود</p>
        </div>
      </div>

      {/* تنظیمات شبکه‌های اجتماعی */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6">شبکه‌های اجتماعی</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              توییتر
            </label>
            <input
              type="text"
              value={settings.socialMedia.twitter}
              onChange={(e) => updateSettings('socialMedia.twitter', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="@mystore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              فیسبوک
            </label>
            <input
              type="text"
              value={settings.socialMedia.facebook}
              onChange={(e) => updateSettings('socialMedia.facebook', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="mystore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              اینستاگرام
            </label>
            <input
              type="text"
              value={settings.socialMedia.instagram}
              onChange={(e) => updateSettings('socialMedia.instagram', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="@mystore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              تلگرام
            </label>
            <input
              type="text"
              value={settings.socialMedia.telegram}
              onChange={(e) => updateSettings('socialMedia.telegram', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="@mystore"
            />
          </div>
        </div>
      </div>

      {/* تنظیمات تماس */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6">اطلاعات تماس</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ایمیل
            </label>
            <input
              type="email"
              value={settings.contact.email}
              onChange={(e) => updateSettings('contact.email', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="info@mystore.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              تلفن
            </label>
            <input
              type="tel"
              value={settings.contact.phone}
              onChange={(e) => updateSettings('contact.phone', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="021-12345678"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              آدرس
            </label>
            <textarea
              value={settings.contact.address}
              onChange={(e) => updateSettings('contact.address', e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              rows={2}
              placeholder="تهران، خیابان..."
            />
          </div>
        </div>
      </div>

      {/* تنظیمات ایندکس‌سازی */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6">تنظیمات ایندکس‌سازی</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">اجازه ایندکس‌سازی به موتورهای جستجو</h3>
            <p className="text-gray-400 text-sm">اگر غیرفعال باشد، سایت در نتایج جستجو نمایش داده نمی‌شود</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowCrawling}
              onChange={(e) => updateSettings('allowCrawling', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* دکمه ذخیره برای تنظیمات عمومی */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
              در حال ذخیره...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 ml-2" />
              ذخیره تنظیمات
            </>
          )}
        </button>
      </div>
        </div>
      )}

      {/* بخش محتوای صفحه درباره ما */}
      {activeSection === 'about' && (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">بخش Hero (سرصفحه)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">عنوان اصلی</label>
                <input
                  type="text"
                  value={settings.aboutPage?.heroTitle || ''}
                  onChange={(e) => updateSettings('aboutPage.heroTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="درباره ما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
                <input
                  type="text"
                  value={settings.aboutPage?.heroSubtitle || ''}
                  onChange={(e) => updateSettings('aboutPage.heroSubtitle', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="مقصد نهایی تجارت الکترونیک شما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">متن نشان (Badge)</label>
                <input
                  type="text"
                  value={settings.aboutPage?.heroBadgeText || ''}
                  onChange={(e) => updateSettings('aboutPage.heroBadgeText', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="به وب‌سایت ما خوش آمدید"
                />
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">بخش داستان ما</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                <input
                  type="text"
                  value={settings.aboutPage?.storyTitle || ''}
                  onChange={(e) => updateSettings('aboutPage.storyTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="داستان ما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
                <input
                  type="text"
                  value={settings.aboutPage?.storySubtitle || ''}
                  onChange={(e) => updateSettings('aboutPage.storySubtitle', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="داستان موفقیت ما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف 1</label>
                <textarea
                  value={settings.aboutPage?.storyParagraph1 || ''}
                  onChange={(e) => updateSettings('aboutPage.storyParagraph1', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف 2</label>
                <textarea
                  value={settings.aboutPage?.storyParagraph2 || ''}
                  onChange={(e) => updateSettings('aboutPage.storyParagraph2', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف 3</label>
                <textarea
                  value={settings.aboutPage?.storyParagraph3 || ''}
                  onChange={(e) => updateSettings('aboutPage.storyParagraph3', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">ماموریت ما</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                <input
                  type="text"
                  value={settings.aboutPage?.missionTitle || ''}
                  onChange={(e) => updateSettings('aboutPage.missionTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="ماموریت ما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
                <textarea
                  value={settings.aboutPage?.missionDescription || ''}
                  onChange={(e) => updateSettings('aboutPage.missionDescription', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">ارزش‌های ما</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.valuesTitle || ''}
                    onChange={(e) => updateSettings('aboutPage.valuesTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="ارزش‌های ما"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.valuesSubtitle || ''}
                    onChange={(e) => updateSettings('aboutPage.valuesSubtitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="اصولی که ما را راهنمایی می‌کند"
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">ارزش 1</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                    <input
                      type="text"
                      value={settings.aboutPage?.value1Title || ''}
                      onChange={(e) => updateSettings('aboutPage.value1Title', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="رضایت مشتری"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
                    <textarea
                      value={settings.aboutPage?.value1Description || ''}
                      onChange={(e) => updateSettings('aboutPage.value1Description', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-3">ارزش 2</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                    <input
                      type="text"
                      value={settings.aboutPage?.value2Title || ''}
                      onChange={(e) => updateSettings('aboutPage.value2Title', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="کیفیت بی‌نظیر"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
                    <textarea
                      value={settings.aboutPage?.value2Description || ''}
                      onChange={(e) => updateSettings('aboutPage.value2Description', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-3">ارزش 3</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
                    <input
                      type="text"
                      value={settings.aboutPage?.value3Title || ''}
                      onChange={(e) => updateSettings('aboutPage.value3Title', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="نوآوری مداوم"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
                    <textarea
                      value={settings.aboutPage?.value3Description || ''}
                      onChange={(e) => updateSettings('aboutPage.value3Description', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Social Sections */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6">بخش تماس و شبکه‌های اجتماعی</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">عنوان بخش تماس</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.contactTitle || ''}
                    onChange={(e) => updateSettings('aboutPage.contactTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="با ما در تماس باشید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان بخش تماس</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.contactSubtitle || ''}
                    onChange={(e) => updateSettings('aboutPage.contactSubtitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="آماده پاسخگویی هستیم"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">عنوان شبکه‌های اجتماعی</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.socialTitle || ''}
                    onChange={(e) => updateSettings('aboutPage.socialTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="ما را دنبال کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان شبکه‌های اجتماعی</label>
                  <input
                    type="text"
                    value={settings.aboutPage?.socialSubtitle || ''}
                    onChange={(e) => updateSettings('aboutPage.socialSubtitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="آخرین اخبار را دنبال کنید"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* دکمه ذخیره برای صفحه درباره ما */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 ml-2" />
                  ذخیره تنظیمات
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}