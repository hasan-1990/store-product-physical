'use client';

import { useState, useEffect } from 'react';

export default function TrustBadgePage() {
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState('');
  const [position, setPosition] = useState<'left' | 'right'>('right');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // بارگذاری تنظیمات
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/trust-badge');
      const result = await response.json();
      
      if (result.success && result.data) {
        setEnabled(result.data.enabled || false);
        setCode(result.data.code || '');
        setPosition(result.data.position || 'right');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/trust-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, code, position })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ تنظیمات با موفقیت ذخیره شد');
      } else {
        alert('❌ خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">نماد اعتماد الکترونیکی</h1>
        <p className="text-gray-300">مدیریت نمایش نماد اعتماد در فوتر سایت</p>
      </div>

      {/* Main Content */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
        <div className="space-y-6">
          {/* فعال/غیرفعال */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">وضعیت نمایش</h3>
              <p className="text-sm text-gray-400">فعال یا غیرفعال کردن نمایش نماد در فوتر</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* کد نماد */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              کد نماد اعتماد
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
              placeholder='<a referrerpolicy="origin" target="_blank" href="https://trustseal.enamad.ir/...">
  <img referrerpolicy="origin" src="https://trustseal.enamad.ir/..." alt="" />
</a>'
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-2">
              کد HTML نماد اعتماد الکترونیکی خود را از سایت enamad.ir دریافت کنید و اینجا قرار دهید
            </p>
          </div>

          {/* جایگاه نمایش */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              محل قرارگیری در فوتر
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPosition('right')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  position === 'right'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                  <span className="font-semibold">سمت راست</span>
                  <span className="text-xs text-gray-400">نمایش در قسمت راست فوتر</span>
                </div>
              </button>

              <button
                onClick={() => setPosition('left')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  position === 'left'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-purple-500/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                  </svg>
                  <span className="font-semibold">سمت چپ</span>
                  <span className="text-xs text-gray-400">نمایش در قسمت چپ فوتر</span>
                </div>
              </button>
            </div>
          </div>

          {/* پیش‌نمایش */}
          {code && (
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-300 mb-3">پیش‌نمایش:</h3>
              <div 
                className={`flex ${position === 'right' ? 'justify-end' : 'justify-start'}`}
                dangerouslySetInnerHTML={{ __html: code }}
              />
            </div>
          )}

          {/* دکمه ذخیره */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  ذخیره تنظیمات
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-500/10 backdrop-blur-lg rounded-2xl border border-blue-500/20 p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
          <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          راهنمای دریافت نماد اعتماد
        </h3>
        <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
          <li>به سایت <a href="https://enamad.ir" target="_blank" className="text-blue-400 hover:underline">enamad.ir</a> مراجعه کنید</li>
          <li>در پنل کاربری خود، کد نماد را دریافت کنید</li>
          <li>کد HTML را در فیلد بالا وارد کنید</li>
          <li>محل نمایش را انتخاب کنید (راست یا چپ فوتر)</li>
          <li>تنظیمات را ذخیره کنید</li>
        </ol>
      </div>
    </div>
  );
}
