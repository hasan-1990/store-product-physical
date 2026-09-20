'use client';

export default function AutoLicenseSystem() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">✅ سیستم خودکار لایسنس‌گذاری فعال است</h1>
            <p className="text-green-100 text-lg">
              تزریق خودکار کدهای لایسنس دامنه‌ای در محصولات دیجیتال
            </p>
          </div>
        </div>
      </div>

      {/* نحوه عملکرد خودکار */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">🎯 نحوه عملکرد خودکار</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-blue-800">کاربر دامنه وارد می‌کند</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-blue-800">لایسنس تولید می‌شود</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-blue-800">کد تزریق خودکار</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <span className="text-blue-800">دانلود فایل نهایی</span>
          </div>
        </div>
      </div>

      {/* وضعیت سیستم */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">📊 وضعیت سیستم لایسنس</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">فعال</div>
                <div className="text-sm text-green-700">سیستم خودکار</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">دامنه‌ای</div>
                <div className="text-sm text-blue-700">نوع لایسنس</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">&lt;2s</div>
                <div className="text-sm text-purple-700">سرعت تزریق</div>
              </div>
            </div>
          </div>
        </div>

        {/* جزئیات فنی */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-bold text-gray-900 mb-3">🔧 جزئیات فنی سیستم:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>تزریق خودکار:</strong> کد PHP بررسی دامنه به صورت خودکار در فایل‌های ZIP تزریق می‌شود</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>کش فایل‌ها:</strong> فایل‌های لایسنس‌دار کش می‌شوند برای دانلودهای بعدی (8.6x سریع‌تر)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>محدودیت دامنه:</strong> هر محصول فقط روی یک دامنه ثبت می‌شود</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>جلوگیری از فعالسازی:</strong> افزونه/قالب روی دامنه‌های غیرمجاز غیرفعال می‌شود</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>پشتیبانی کامل:</strong> WordPress Themes & Plugins با ساختار استاندارد</span>
            </li>
          </ul>
        </div>
      </div>

      {/* راهنمای تفصیلی */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📚 راهنمای استفاده برای کاربران</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-3">✅ مراحل دریافت لایسنس:</h3>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>خرید محصول دیجیتال از فروشگاه</li>
              <li>ورود به بخش "دانلودها" در پروفایل</li>
              <li>وارد کردن دامنه وب‌سایت</li>
              <li>کلیک روی دکمه "دریافت لایسنس و دانلود"</li>
              <li>دانلود خودکار فایل با لایسنس دامنه‌ای</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-3">� ویژگی‌های امنیتی:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• هر محصول فقط روی یک دامنه قابل استفاده است</li>
              <li>• بررسی خودکار دامنه هنگام فعالسازی</li>
              <li>• غیرفعال شدن خودکار در دامنه‌های غیرمجاز</li>
              <li>• نمایش پیام خطای واضح برای کاربر</li>
              <li>• عدم نیاز به ورود کلید لایسنس دستی</li>
              <li>• کش کردن فایل‌ها برای سرعت بیشتر</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-900 mb-2">✨ مزایای سیستم خودکار:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✓ کاربر نیازی به دریافت لایسنس جداگانه ندارد</li>
            <li>✓ کد لایسنس به صورت خودکار در فایل تزریق می‌شود</li>
            <li>✓ فایل دانلودی فقط روی دامنه ثبت شده کار می‌کند</li>
            <li>✓ هیچ نیازی به تنظیمات پیچیده در WordPress نیست</li>
            <li>✓ امنیت بالا و جلوگیری از سوء استفاده</li>
          </ul>
        </div>
      </div>

      {/* آمار سیستم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-sm text-gray-600">امنیت محصولات</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">8.6x</div>
              <div className="text-sm text-gray-600">سرعت دانلود</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">آسان</div>
              <div className="text-sm text-gray-600">تجربه کاربری</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}