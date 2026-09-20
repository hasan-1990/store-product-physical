'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface InvoiceSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  taxId: string;
  logoUrl: string;
  showLogo: boolean;
  showTax: boolean;
  taxRate: number;
  invoicePrefix: string;
  invoiceNotes: string;
  footerText: string;
}

export default function InvoiceSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<InvoiceSettings>({
    companyName: 'فروشگاه آنلاین',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    taxId: '',
    logoUrl: '',
    showLogo: true,
    showTax: false,
    taxRate: 9,
    invoicePrefix: 'INV',
    invoiceNotes: 'از خرید شما متشکریم',
    footerText: 'این فاکتور به صورت الکترونیکی تولید شده است'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const getAuthHeaders = (withJson = false): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = withJson ? { 'Content-Type': 'application/json' } : {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/invoice-settings', {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.error || 'خطا در دریافت تنظیمات';
        if (response.status === 401 || response.status === 403) {
          toast.error('برای مشاهده تنظیمات ابتدا وارد حساب مدیریتی شوید');
          router.push('/admin/login');
          return;
        }
        toast.error(message);
        return;
      }

      if (data?.success && data.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
      } else {
        toast.error(data?.error || 'خطا در دریافت تنظیمات');
      }
    } catch (error) {
      console.error('❌ Error fetching invoice settings:', error);
      toast.error('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/invoice-settings', {
        method: 'PUT',
        headers: getAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('برای ذخیره تنظیمات ابتدا وارد حساب مدیریتی شوید');
          router.push('/admin/login');
          return;
        }

        const errorBody = await response.json().catch(() => undefined);
        throw new Error(errorBody?.error || 'خطا در ذخیره تنظیمات');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('تنظیمات با موفقیت ذخیره شد');
        await fetchSettings();
      } else {
        toast.error(data.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('❌ Error saving invoice settings:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد');
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSettings({ ...settings, logoUrl: data.url });
        toast.success('لوگو با موفقیت آپلود شد');
      } else {
        toast.error(data.error || 'خطا در آپلود لوگو');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('خطا در آپلود لوگو');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-purple-500/30 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-300 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 bg-gray-900/60 border border-purple-500/30 text-white rounded-xl placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2';
  const sectionIconClass =
    'w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">تنظیمات فاکتور</h1>
              <p className="text-gray-300 mt-1">مدیریت اطلاعات نمایش داده شده در فاکتورها</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="p-8 border-b border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className={sectionIconClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">اطلاعات شرکت</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>نام شرکت/فروشگاه *</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>شناسه مالیاتی</label>
                <input
                  type="text"
                  value={settings.taxId}
                  onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>آدرس</label>
                <textarea
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>تلفن</label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>ایمیل</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>وبسایت</label>
                <input
                  type="url"
                  value={settings.companyWebsite}
                  onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="p-8 border-b border-purple-500/20 bg-gray-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className={sectionIconClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">لوگو</h2>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1 space-y-4">
                <label className="flex items-center gap-3 p-4 bg-gray-900/40 rounded-xl border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                    className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-200">نمایش لوگو در فاکتور</span>
                </label>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-dashed border-purple-500/40 text-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
                    </div>
                  )}
                </div>
              </div>

              {settings.logoUrl && (
                <div className="relative w-32 h-32 border border-purple-500/30 rounded-xl overflow-hidden bg-gray-900/60">
                  <Image
                    src={settings.logoUrl}
                    alt="لوگو"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-8 border-b border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className={sectionIconClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">تنظیمات مالیات</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-gray-900/40 rounded-xl border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-all">
                <input
                  type="checkbox"
                  checked={settings.showTax}
                  onChange={(e) => setSettings({ ...settings, showTax: e.target.checked })}
                  className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-200">نمایش مالیات در فاکتور</span>
              </label>

              {settings.showTax && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                  <label className={labelClass}>نرخ مالیات (%) - فقط خواندنی</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    disabled
                    className="w-full md:w-1/3 px-4 py-3 border border-purple-500/20 rounded-xl bg-gray-900/80 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    برای تغییر نرخ مالیات به{' '}
                    <Link href="/admin/settings" className="text-purple-400 hover:text-purple-300 hover:underline font-medium">
                      تنظیمات عمومی
                    </Link>{' '}
                    بروید
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 border-b border-purple-500/20 bg-gray-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className={sectionIconClass}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">تنظیمات فاکتور</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className={labelClass}>پیشوند شماره فاکتور</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className={`${inputClass} md:w-1/2`}
                  placeholder="INV"
                />
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  مثال: INV-12345
                </p>
              </div>

              <div>
                <label className={labelClass}>یادداشت فاکتور</label>
                <textarea
                  value={settings.invoiceNotes}
                  onChange={(e) => setSettings({ ...settings, invoiceNotes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder="از خرید شما متشکریم"
                />
              </div>

              <div>
                <label className={labelClass}>متن پاورقی</label>
                <textarea
                  value={settings.footerText}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                  rows={2}
                  className={inputClass}
                  placeholder="این فاکتور به صورت الکترونیکی تولید شده است"
                />
              </div>
            </div>
          </div>

          <div className="p-8 bg-gray-900/30">
            <div className="flex justify-end gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ذخیره تنظیمات
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
