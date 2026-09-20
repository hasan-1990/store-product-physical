'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUrlTab } from '@/hooks/useUrlTab';

interface SettingsData {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  address: string;
  currency: string;
  language: string;
  timezone: string;
  taxRate: number;
  shippingCost: number;
  freeShippingThreshold: number;
  enableNotifications: boolean;
  enableEmailMarketing: boolean;
  enableSMS: boolean;
  maintenanceMode: boolean;
  maintenanceEndTime: string; // ISO date string
  maintenanceDays: number;
  maintenanceHours: number;
  maintenanceMinutes: number;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceContact: string;
  registrationEnabled: boolean;
  guestCheckout: boolean;
  autoApproveReviews: boolean;
  stockManagement: boolean;
  backorderAllowed: boolean;
  lowStockThreshold: number;
}

const SettingsPageContent = () => {
  const [settings, setSettings] = useState<SettingsData>({
    siteName: 'فروشگاه آنلاین',
    siteDescription: 'بهترین محصولات با کیفیت عالی',
    siteUrl: 'https://mystore.com',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
    currency: 'IRR',
    language: 'fa',
    timezone: 'Asia/Tehran',
    taxRate: 9,
    shippingCost: 50000,
    freeShippingThreshold: 500000,
    enableNotifications: true,
    enableEmailMarketing: true,
    enableSMS: false,
    maintenanceMode: false,
    maintenanceEndTime: '',
    maintenanceDays: 0,
    maintenanceHours: 2,
    maintenanceMinutes: 0,
    maintenanceTitle: 'سایت در حال بروزرسانی',
    maintenanceMessage: 'ما در حال بهبود سایت برای ارائه تجربه بهتر به شما هستیم',
    maintenanceContact: 'در صورت نیاز فوری می‌توانید با ما تماس بگیرید',
    registrationEnabled: true,
    guestCheckout: true,
    autoApproveReviews: false,
    stockManagement: true,
    backorderAllowed: false,
    lowStockThreshold: 10,
  });

  const [activeTab, setActiveTab] = useUrlTab('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // بارگذاری تنظیمات از API
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      
      if (result.success && result.data) {
        // ترکیب تنظیمات پیش‌فرض با داده‌های دیتابیس
        setSettings(prev => ({
          ...prev,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('تنظیمات با موفقیت ذخیره شد!');
        
        // اگر maintenance mode تغییر کرده، صفحه رو reload کن تا تغییرات اعمال بشه
        if ('maintenanceMode' in settings) {
          await fetch('/api/maintenance/status');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        alert('خطا در ذخیره تنظیمات: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // محاسبه زمان پایان تعمیر
  const calculateMaintenanceEndTime = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 
      (settings.maintenanceDays * 24 * 60 * 60 * 1000) +
      (settings.maintenanceHours * 60 * 60 * 1000) +
      (settings.maintenanceMinutes * 60 * 1000)
    );
    return endTime.toISOString();
  };

  // فعال کردن حالت تعمیر
  const enableMaintenanceMode = () => {
    const endTime = calculateMaintenanceEndTime();
    handleInputChange('maintenanceEndTime', endTime);
    handleInputChange('maintenanceMode', true);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">نام سایت</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => handleInputChange('siteName', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">آدرس سایت</label>
          <input
            type="url"
            value={settings.siteUrl}
            onChange={(e) => handleInputChange('siteUrl', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات سایت</label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => handleInputChange('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">آدرس</label>
        <textarea
          value={settings.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
        />
      </div>
    </div>
  );

  const renderEcommerceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">واحد پول</label>
          <select
            value={settings.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          >
            <option value="IRR">ریال ایران (IRR)</option>
            <option value="USD">دلار آمریکا (USD)</option>
            <option value="EUR">یورو (EUR)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">زبان</label>
          <select
            value={settings.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          >
            <option value="fa">فارسی</option>
            <option value="en">انگلیسی</option>
            <option value="ar">عربی</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">منطقه زمانی</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          >
            <option value="Asia/Tehran">تهران</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">نیویورک</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">نرخ مالیات (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={settings.taxRate}
            onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">هزینه ارسال (تومان)</label>
          <input
            type="number"
            min="0"
            value={settings.shippingCost}
            onChange={(e) => handleInputChange('shippingCost', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">حد آستانه ارسال رایگان (تومان)</label>
          <input
            type="number"
            min="0"
            value={settings.freeShippingThreshold}
            onChange={(e) => handleInputChange('freeShippingThreshold', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* حالت تعمیر */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">🔧 حالت تعمیر و نگهداری</h3>
        
        <div className="p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-white font-medium">فعال‌سازی حالت تعمیر</span>
              <p className="text-orange-300 text-sm">سایت برای کاربران عادی در دسترس نخواهد بود</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => {
                  if (e.target.checked) {
                    enableMaintenanceMode();
                  } else {
                    handleInputChange('maintenanceMode', false);
                    handleInputChange('maintenanceEndTime', '');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* تنظیم زمان تعمیر */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">روز</label>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.maintenanceDays}
                onChange={(e) => handleInputChange('maintenanceDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">ساعت</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.maintenanceHours}
                onChange={(e) => handleInputChange('maintenanceHours', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">دقیقه</label>
              <input
                type="number"
                min="0"
                max="59"
                value={settings.maintenanceMinutes}
                onChange={(e) => handleInputChange('maintenanceMinutes', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* نمایش زمان پایان تعمیر */}
          {settings.maintenanceMode && settings.maintenanceEndTime && (
            <div className="p-3 bg-orange-500/20 border border-orange-500/40 rounded-lg">
              <p className="text-orange-200 text-sm">
                📅 تعمیر تا تاریخ: {new Date(settings.maintenanceEndTime).toLocaleString('fa-IR')}
              </p>
            </div>
          )}

          {/* تنظیمات پیام‌های صفحه تعمیر */}
          <div className="space-y-4 mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <h4 className="text-md font-medium text-orange-300">📝 تنظیمات پیام‌های صفحه تعمیر</h4>
            
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">عنوان صفحه تعمیر</label>
              <input
                type="text"
                value={settings.maintenanceTitle}
                onChange={(e) => handleInputChange('maintenanceTitle', e.target.value)}
                placeholder="عنوان نمایش داده شده در صفحه تعمیر"
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">پیام اصلی</label>
              <textarea
                value={settings.maintenanceMessage}
                onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                placeholder="پیام اصلی نمایش داده شده به کاربران"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">پیام تماس</label>
              <textarea
                value={settings.maintenanceContact}
                onChange={(e) => handleInputChange('maintenanceContact', e.target.value)}
                placeholder="پیام تماس و اطلاعات ضروری"
                rows={2}
                className="w-full px-3 py-2 bg-gray-800/50 border border-orange-500/30 rounded-lg text-white focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">تنظیمات کاربران</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <span className="text-white">امکان ثبت‌نام جدید</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => handleInputChange('registrationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <span className="text-white">خرید بدون ثبت‌نام</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.guestCheckout}
                onChange={(e) => handleInputChange('guestCheckout', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventorySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">مدیریت انبار</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <span className="text-white">مدیریت موجودی</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.stockManagement}
                onChange={(e) => handleInputChange('stockManagement', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <span className="text-white">امکان پیش‌فروش</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.backorderAllowed}
                onChange={(e) => handleInputChange('backorderAllowed', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">حد آستانه موجودی کم</label>
          <input
            type="number"
            min="1"
            value={settings.lowStockThreshold}
            onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
            className="w-full md:w-1/3 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
          />
          <p className="text-gray-400 text-sm mt-1">هنگامی که موجودی زیر این عدد برسد، هشدار نمایش داده می‌شود</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">تنظیمات نظرات</h3>
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
          <div>
            <span className="text-white">تایید خودکار نظرات</span>
            <p className="text-gray-400 text-sm">نظرات جدید بدون بررسی منتشر شوند</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApproveReviews}
              onChange={(e) => handleInputChange('autoApproveReviews', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">اعلان‌ها</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <span className="text-white">اعلان‌های داخل سایت</span>
              <p className="text-gray-400 text-sm">نمایش اعلان‌ها در پنل کاربری</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <span className="text-white">ایمیل مارکتینگ</span>
              <p className="text-gray-400 text-sm">ارسال خبرنامه و پیشنهادات ویژه</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableEmailMarketing}
                onChange={(e) => handleInputChange('enableEmailMarketing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
            <div>
              <span className="text-white">پیامک</span>
              <p className="text-gray-400 text-sm">ارسال پیامک برای سفارشات و اطلاعیه‌ها</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSMS}
                onChange={(e) => handleInputChange('enableSMS', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">تنظیمات سیستم</h3>
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border-2 border-orange-500/30">
          <div>
            <span className="text-white">حالت تعمیر و نگهداری</span>
            <p className="text-orange-400 text-sm">سایت برای کاربران عادی در دسترس نخواهد بود</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', name: 'عمومی', icon: '⚙️' },
    { id: 'ecommerce', name: 'فروشگاه', icon: '🛒' },
    { id: 'inventory', name: 'انبار', icon: '📦' },
    { id: 'notifications', name: 'اعلان‌ها', icon: '🔔' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">تنظیمات</h1>
          <p className="text-gray-300 mt-1">مدیریت تنظیمات کلی فروشگاه</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>در حال ذخیره...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>ذخیره تنظیمات</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 space-x-reverse px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'ecommerce' && renderEcommerceSettings()}
          {activeTab === 'inventory' && renderInventorySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
};

export default SettingsPage;
