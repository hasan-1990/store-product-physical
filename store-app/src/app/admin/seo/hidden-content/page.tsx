'use client';
import React, { useState } from 'react';
import HiddenSEOContent, { 
  HiddenStructuredContent, 
  HiddenKeywords, 
  HiddenDescription 
} from '@/components/SEO/HiddenSEOContent';

export default function SEOHiddenContentDemo() {
  const [method, setMethod] = useState<'screenreader' | 'position' | 'opacity' | 'text-indent'>('screenreader');
  const [showPreview, setShowPreview] = useState(false);

  const sampleProduct = {
    name: 'گوشی موبایل سامسونگ Galaxy S24',
    price: 25000000,
    category: 'گوشی موبایل',
    brand: 'سامسونگ',
    description: 'گوشی هوشمند سری Galaxy S24 با صفحه‌نمایش 6.1 اینچ Dynamic AMOLED'
  };

  const methods = [
    { value: 'screenreader', label: 'Screen Reader Only (بهترین)' },
    { value: 'position', label: 'Position Absolute' },
    { value: 'opacity', label: 'Opacity Zero' },
    { value: 'text-indent', label: 'Text Indent' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 نمایش محتوای مخفی SEO
        </h1>
        <p className="text-gray-600 leading-relaxed">
          این صفحه نشان می‌دهد چطور محتوای متنی مخفی برای موتورهای جستجو اضافه کنیم 
          که فقط برای سئو استفاده می‌شود و کاربران آن را نمی‌بینند.
        </p>
      </div>

      {/* کنترل‌ها */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">⚙️ تنظیمات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              روش مخفی کردن:
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {methods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                نمایش محتوای مخفی (برای تست)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* محتوای قابل مشاهده */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📱 {sampleProduct.name}
        </h2>
        <div className="bg-white p-6 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">تصویر محصول</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">{sampleProduct.name}</h3>
              <p className="text-gray-600 mb-4">{sampleProduct.description}</p>
              <div className="space-y-2">
                <div><strong>قیمت:</strong> {sampleProduct.price.toLocaleString()} تومان</div>
                <div><strong>برند:</strong> {sampleProduct.brand}</div>
                <div><strong>دسته:</strong> {sampleProduct.category}</div>
              </div>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                افزودن به سبد خرید
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* محتوای مخفی SEO */}
      <div className={`mb-8 ${showPreview ? 'block' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🤖 محتوای مخفی SEO (فقط برای موتورهای جستجو)
        </h2>
        
        {showPreview && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              ⚠️ این محتوا در حالت عادی مخفی است و فقط برای نمایش به شما نشان داده می‌شود.
            </p>
          </div>
        )}

        <div className={showPreview ? 'bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300' : ''}>
          
          {/* محتوای ساختارمند مخفی */}
          <HiddenStructuredContent
            method={method}
            title={`خرید ${sampleProduct.name} - بهترین قیمت و کیفیت`}
            description={`${sampleProduct.name} با بهترین قیمت و ضمانت اصالت کالا. ارسال سریع و رایگان به سراسر کشور. قیمت ویژه ${sampleProduct.price} تومان.`}
            keywords={[
              sampleProduct.name,
              sampleProduct.brand,
              sampleProduct.category,
              'خرید آنلاین',
              'قیمت مناسب',
              'ارسال رایگان',
              'ضمانت اصالت',
              'پرداخت امن'
            ]}
            categories={[
              sampleProduct.category,
              'فروشگاه آنلاین',
              'کالای اصل',
              'پرفروش‌ترین محصولات'
            ]}
            features={[
              'ضمانت اصالت کالا',
              'ارسال سریع و رایگان',
              'پشتیبانی ۲۴ ساعته',
              'قیمت رقابتی',
              'کیفیت بالا',
              `برند ${sampleProduct.brand}`
            ]}
          />

          {/* کلمات کلیدی مخفی */}
          <HiddenKeywords 
            method={method}
            keywords={[
              `خرید ${sampleProduct.name}`,
              `قیمت ${sampleProduct.name}`,
              `${sampleProduct.name} اورجینال`,
              `فروش ${sampleProduct.name}`,
              `${sampleProduct.brand} ${sampleProduct.name}`,
              'خرید آنلاین',
              'ارسال رایگان',
              'بهترین قیمت'
            ]}
          />

          {/* توضیحات مخفی */}
          <HiddenDescription 
            method={method}
            description={`در فروشگاه آنلاین ما می‌توانید ${sampleProduct.name} را با بهترین قیمت ${sampleProduct.price} تومان خریداری کنید. این محصول از برند معتبر ${sampleProduct.brand} در دسته‌بندی ${sampleProduct.category} قرار دارد. ما ضمانت اصالت کالا، ارسال سریع و رایگان، پشتیبانی ۲۴ ساعته و بهترین قیمت بازار را به شما ارائه می‌دهیم. ${sampleProduct.description} برای خرید این محصول کافی است روی دکمه افزودن به سبد خرید کلیک کنید.`}
          />
        </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📖 راهنمای استفاده
        </h3>
        <div className="space-y-2 text-blue-800">
          <p><strong>Screen Reader Only:</strong> بهترین روش - محتوا فقط برای screen reader ها و bot ها قابل دسترس</p>
          <p><strong>Position Absolute:</strong> محتوا از صفحه خارج می‌شود</p>
          <p><strong>Opacity Zero:</strong> محتوا شفاف می‌شود</p>
          <p><strong>Text Indent:</strong> متن با indent منفی مخفی می‌شود</p>
        </div>
        
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">⚠️ نکات مهم:</h4>
          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
            <li>این روش برای بهبود SEO و ارائه اطلاعات بیشتر به موتورهای جستجو استفاده می‌شود</li>
            <li>محتوا باید مرتبط و مفید باشد، نه صرفاً کلمات کلیدی تکراری</li>
            <li>از این روش به میزان معقول استفاده کنید</li>
            <li>Google این تکنیک را تشخیص می‌دهد اما اگر محتوا مفید باشد مشکلی ندارد</li>
          </ul>
        </div>
      </div>

      {/* کد نمونه */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          💻 کد نمونه
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{`import HiddenSEOContent, { 
  HiddenStructuredContent, 
  HiddenKeywords, 
  HiddenDescription 
} from '@/components/SEO/HiddenSEOContent';

// استفاده در کامپوننت
<HiddenStructuredContent
  title="خرید محصول - بهترین قیمت"
  description="توضیحات کامل محصول..."
  keywords={['کلمه1', 'کلمه2', 'کلمه3']}
  categories={['دسته1', 'دسته2']}
  features={['ویژگی1', 'ویژگی2']}
/>

<HiddenKeywords 
  keywords={['خرید آنلاین', 'قیمت مناسب']}
/>

<HiddenDescription 
  description="توضیحات تکمیلی برای SEO..."
/>`}</pre>
        </div>
      </div>
    </div>
  );
}