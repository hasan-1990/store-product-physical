'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiEdit3, FiEye } from 'react-icons/fi';
import { useToast, ToastContainer } from '@/components/ui/Toast';

interface AboutSettings {
  // بخش اصلی
  hero_title?: string;
  hero_subtitle?: string;
  hero_badge_text?: string;
  
  // بخش داستان ما
  story_title?: string;
  story_subtitle?: string;
  story_paragraph_1?: string;
  story_paragraph_2?: string;
  story_paragraph_3?: string;
  
  // بخش ماموریت
  mission_title?: string;
  mission_description?: string;
  
  // بخش ارزش‌های ما
  values_title?: string;
  values_subtitle?: string;
  
  // ارزش اول
  value_1_title?: string;
  value_1_description?: string;
  
  // ارزش دوم
  value_2_title?: string;
  value_2_description?: string;
  
  // ارزش سوم
  value_3_title?: string;
  value_3_description?: string;
  
  // بخش تماس با ما
  contact_title?: string;
  contact_subtitle?: string;
  
  // اطلاعات تماس (از تنظیمات عمومی)
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  
  // بخش شبکه‌های اجتماعی
  social_title?: string;
  social_subtitle?: string;
}

const AboutPageManager: React.FC = () => {
  const [settings, setSettings] = useState<AboutSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        // فیلتر کردن تنظیمات مربوط به صفحه درباره ما
        const aboutSettings: AboutSettings = {};
        Object.keys(data.data).forEach(key => {
          if (key.startsWith('about_') || 
              key.startsWith('hero_') || 
              key.startsWith('story_') || 
              key.startsWith('mission_') || 
              key.startsWith('values_') || 
              key.startsWith('value_') || 
              key.startsWith('contact_') || 
              key.startsWith('social_') ||
              key === 'contact_email' ||
              key === 'contact_phone' ||
              key === 'contact_address') {
            aboutSettings[key as keyof AboutSettings] = data.data[key];
          }
        });
        
        // مقادیر پیش‌فرض اگر تنظیمات وجود ندارد
        const defaultSettings: AboutSettings = {
          hero_title: 'درباره فروشگاه هاب',
          hero_subtitle: 'مقصد نهایی تجارت الکترونیک شما',
          hero_badge_text: 'به وب‌سایت ما خوش آمدید',
          
          story_title: 'داستان ما',
          story_subtitle: 'داستان موفقیت ما',
          story_paragraph_1: 'فروشگاه هاب با هدف ارائه بهترین تجربه خرید آنلاین برای مشتریان عزیز تأسیس شد. ما معتقدیم که خرید آنلاین باید ساده، ایمن و لذت‌بخش باشد.',
          story_paragraph_2: 'از روز اول، تمرکز ما بر کیفیت محصولات، سرویس مشتریان عالی و ایجاد تجربه‌ای فراموش‌نشدنی برای هر خریدار بوده است.',
          story_paragraph_3: 'امروز، ما افتخار داریم که به عنوان یکی از معتبرترین پلتفرم‌های تجارت الکترونیک، خدمات خود را به هزاران مشتری راضی ارائه می‌دهیم.',
          
          mission_title: 'ماموریت ما',
          mission_description: 'ما متعهد هستیم که بهترین محصولات را با بالاترین کیفیت و مناسب‌ترین قیمت‌ها به دست شما برسانیم و تجربه‌ای بی‌نظیر از خرید آنلاین را برای شما فراهم کنیم.',
          
          values_title: 'ارزش‌های ما',
          values_subtitle: 'اصولی که ما را در مسیر خدمت‌رسانی بهتر راهنمایی می‌کند',
          
          value_1_title: 'رضایت مشتری',
          value_1_description: 'رضایت و خوشحالی شما بالاترین اولویت ماست. ما تمام تلاش خود را می‌کنیم تا تجربه‌ی خرید شما عالی باشد.',
          
          value_2_title: 'کیفیت بی‌نظیر',
          value_2_description: 'همه محصولات با دقت انتخاب و کنترل کیفیت می‌شوند تا شما بهترین ها را دریافت کنید.',
          
          value_3_title: 'نوآوری مداوم',
          value_3_description: 'همیشه در حال بهبود و ارائه راه‌حل‌های جدید هستیم تا تجربه بهتری برای شما فراهم کنیم.',
          
          contact_title: 'با ما در تماس باشید',
          contact_subtitle: 'ما همیشه آماده پاسخگویی به سوالات شما هستیم',
          
          // اطلاعات تماس پیش‌فرض
          contact_email: 'info@shop.com',
          contact_phone: '021-12345678',
          contact_address: 'تهران، خیابان آزادی',
          
          social_title: 'ما را در شبکه‌های اجتماعی دنبال کنید',
          social_subtitle: 'آخرین اخبار، محصولات جدید و تخفیف‌های ویژه را در شبکه‌های اجتماعی ما دنبال کنید'
        };
        
        setSettings({ ...defaultSettings, ...aboutSettings });
      }
    } catch (error) {
      console.error('Error loading about page settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // آماده‌سازی تنظیمات برای ارسال
      const settingsToSave: Record<string, any> = {};
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          settingsToSave[key] = value;
        }
      });

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      const data = await response.json();

      if (data.success) {
        success('تنظیمات صفحه درباره ما با موفقیت ذخیره شد!', 'موفق', 4000);
        await loadSettings();
      } else {
        error('خطا در ذخیره تنظیمات: ' + data.error, 'خطا', 6000);
      }
    } catch (err) {
      console.error('Error saving about page settings:', err);
      error('خطا در ذخیره تنظیمات', 'خطا', 6000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AboutSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openPreview = () => {
    window.open('/about', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت صفحه درباره ما</h2>
          <p className="text-gray-400">ویرایش محتوای صفحه درباره ما</p>
        </div>
        
        <div className="flex gap-3">
          
          <button
            onClick={openPreview}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiEye />
            پیش‌نمایش صفحه
          </button>
          
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            بروزرسانی
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FiSave />
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
          <a
            href="/admin/content"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← بازگشت به محتوا
          </a>
        </div>
      </div>

      {/* بخش اصلی (Hero Section) */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-purple-400" />
          <h3 className="text-lg font-bold text-white">بخش اصلی صفحه (Header)</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">متن نشان (Badge)</label>
            <input
              type="text"
              value={settings.hero_badge_text || ''}
              onChange={(e) => updateSetting('hero_badge_text', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="به وب‌سایت ما خوش آمدید"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">عنوان اصلی</label>
            <input
              type="text"
              value={settings.hero_title || ''}
              onChange={(e) => updateSetting('hero_title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="درباره فروشگاه هاب"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
            <input
              type="text"
              value={settings.hero_subtitle || ''}
              onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="مقصد نهایی تجارت الکترونیک شما"
            />
          </div>
        </div>
      </div>

      {/* بخش داستان ما */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-indigo-400" />
          <h3 className="text-lg font-bold text-white">بخش داستان ما</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">عنوان اصلی</label>
              <input
                type="text"
                value={settings.story_title || ''}
                onChange={(e) => updateSetting('story_title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="داستان ما"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
              <input
                type="text"
                value={settings.story_subtitle || ''}
                onChange={(e) => updateSetting('story_subtitle', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="داستان موفقیت ما"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف اول</label>
            <textarea
              rows={3}
              value={settings.story_paragraph_1 || ''}
              onChange={(e) => updateSetting('story_paragraph_1', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="توضیح اول درباره داستان شما..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف دوم</label>
            <textarea
              rows={3}
              value={settings.story_paragraph_2 || ''}
              onChange={(e) => updateSetting('story_paragraph_2', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="توضیح دوم درباره داستان شما..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">پاراگراف سوم</label>
            <textarea
              rows={3}
              value={settings.story_paragraph_3 || ''}
              onChange={(e) => updateSetting('story_paragraph_3', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="توضیح سوم درباره داستان شما..."
            />
          </div>
        </div>
      </div>

      {/* بخش ماموریت */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-blue-400" />
          <h3 className="text-lg font-bold text-white">بخش ماموریت ما</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
            <input
              type="text"
              value={settings.mission_title || ''}
              onChange={(e) => updateSetting('mission_title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="ماموریت ما"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
            <textarea
              rows={4}
              value={settings.mission_description || ''}
              onChange={(e) => updateSetting('mission_description', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="توضیحات ماموریت شما..."
            />
          </div>
        </div>
      </div>

      {/* بخش ارزش‌های ما */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-green-400" />
          <h3 className="text-lg font-bold text-white">بخش ارزش‌های ما</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">عنوان اصلی</label>
              <input
                type="text"
                value={settings.values_title || ''}
                onChange={(e) => updateSetting('values_title', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="ارزش‌های ما"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
              <input
                type="text"
                value={settings.values_subtitle || ''}
                onChange={(e) => updateSetting('values_subtitle', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="اصولی که ما را راهنمایی می‌کند"
              />
            </div>
          </div>
          
          {/* ارزش اول */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">ارزش اول</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">عنوان</label>
                <input
                  type="text"
                  value={settings.value_1_title || ''}
                  onChange={(e) => updateSetting('value_1_title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="رضایت مشتری"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={settings.value_1_description || ''}
                  onChange={(e) => updateSetting('value_1_description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="توضیحات ارزش اول..."
                />
              </div>
            </div>
          </div>
          
          {/* ارزش دوم */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">ارزش دوم</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">عنوان</label>
                <input
                  type="text"
                  value={settings.value_2_title || ''}
                  onChange={(e) => updateSetting('value_2_title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="کیفیت بی‌نظیر"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={settings.value_2_description || ''}
                  onChange={(e) => updateSetting('value_2_description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="توضیحات ارزش دوم..."
                />
              </div>
            </div>
          </div>
          
          {/* ارزش سوم */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">ارزش سوم</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">عنوان</label>
                <input
                  type="text"
                  value={settings.value_3_title || ''}
                  onChange={(e) => updateSetting('value_3_title', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="نوآوری مداوم"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  value={settings.value_3_description || ''}
                  onChange={(e) => updateSetting('value_3_description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="توضیحات ارزش سوم..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بخش تماس با ما */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-orange-400" />
          <h3 className="text-lg font-bold text-white">بخش تماس با ما</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
            <input
              type="text"
              value={settings.contact_title || ''}
              onChange={(e) => updateSetting('contact_title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="با ما در تماس باشید"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
            <input
              type="text"
              value={settings.contact_subtitle || ''}
              onChange={(e) => updateSetting('contact_subtitle', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="ما همیشه آماده پاسخگویی به سوالات شما هستیم"
            />
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">اطلاعات تماس</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">📧 ایمیل تماس</label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="info@shop.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">📞 شماره تماس</label>
                <input
                  type="tel"
                  value={settings.contact_phone || ''}
                  onChange={(e) => updateSetting('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="021-12345678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">� آدرس</label>
                <textarea
                  rows={2}
                  value={settings.contact_address || ''}
                  onChange={(e) => updateSetting('contact_address', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="تهران، خیابان آزادی"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* بخش شبکه‌های اجتماعی */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiEdit3 className="text-pink-400" />
          <h3 className="text-lg font-bold text-white">بخش شبکه‌های اجتماعی</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">عنوان</label>
            <input
              type="text"
              value={settings.social_title || ''}
              onChange={(e) => updateSetting('social_title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="ما را در شبکه‌های اجتماعی دنبال کنید"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">زیرعنوان</label>
            <textarea
              rows={2}
              value={settings.social_subtitle || ''}
              onChange={(e) => updateSetting('social_subtitle', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="آخرین اخبار، محصولات جدید و تخفیف‌های ویژه را دنبال کنید"
            />
          </div>
        </div>
      </div>

      {/* دکمه ذخیره در پایان */}
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-lg font-medium"
        >
          <FiSave />
          {saving ? 'در حال ذخیره...' : 'ذخیره همه تغییرات'}
        </button>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AboutPageManager;