'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  fileSize: number;
  fileFormat: string;
  downloadLimit: number;
  originalFileUrl: string;
  purchaseDate: string;
  licenses: {
    id: string;
    domain: string;
    licenseKey: string;
    isActive: boolean;
    expiresAt: string;
    createdAt: string;
    usageCount: number;
    lastUsed?: string;
  }[];
  hasActiveLicense: boolean;
}

export default function DigitalProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [domain, setDomain] = useState('');
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [downloadingProduct, setDownloadingProduct] = useState<DigitalProduct | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    fetchDigitalProducts();
  }, [session, status, router]);

  const fetchDigitalProducts = async () => {
    try {
      console.log('🔄 Fetching digital products...');
      const response = await fetch('/api/user/digital-products');
      const result = await response.json();
      
      console.log('📦 API Response:', result);
      
      if (result.success) {
        console.log('✅ Products loaded:', result.data.length);
        setDigitalProducts(result.data);
      } else {
        setMessage({type: 'error', text: result.error || 'خطا در دریافت محصولات'});
      }
    } catch (error) {
      console.error('خطا در دریافت محصولات دیجیتال:', error);
      setMessage({type: 'error', text: 'خطا در ارتباط با سرور'});
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    if (!downloadingProduct || !domain.trim()) {
      setMessage({type: 'error', text: 'محصول و دامنه مورد نیاز است'});
      return;
    }

    setIsGeneratingLicense(true);
    setMessage(null);

    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: downloadingProduct.id,
          domain: domain.trim(),
          userId: session?.user?.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({type: 'success', text: 'لایسنس با موفقیت تولید شد. دانلود شروع می‌شود...'});
        
        // پاک کردن فرم فوراً
        setDownloadingProduct(null);
        setDomain('');
        setShowDomainForm(false);
        
        // شروع دانلود پس از تولید لایسنس
        await startDownload(downloadingProduct, result.data.licenseKey);
        
        // به‌روزرسانی لیست محصولات
        await fetchDigitalProducts();
      } else {
        setMessage({type: 'error', text: result.error});
      }
    } catch (error) {
      setMessage({type: 'error', text: 'خطا در تولید لایسنس'});
    } finally {
      setIsGeneratingLicense(false);
    }
  };

  const startDownload = async (product: DigitalProduct, licenseKey?: string) => {
    try {
      // استفاده از لایسنس جدید یا موجود
      const activeLicense = licenseKey || 
        product.licenses.find(l => l.isActive && 
          (!l.expiresAt || new Date(l.expiresAt) > new Date())
        )?.licenseKey;
      
      if (!activeLicense) {
        setMessage({type: 'error', text: 'خطا در دریافت کلید لایسنس'});
        return;
      }

      const downloadUrl = `/api/download/licensed?licenseKey=${activeLicense}&productId=${product.id}`;
      
      // ایجاد لینک موقت برای دانلود با IDM
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = ''; // فورس کردن دانلود
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // به‌روزرسانی آمار
      setTimeout(() => {
        fetchDigitalProducts();
      }, 1000);
      
      setMessage({type: 'success', text: 'دانلود شروع شد'});
    } catch (error) {
      setMessage({type: 'error', text: 'خطا در دانلود فایل'});
    }
  };

  const handleDownload = async (product: DigitalProduct) => {
    console.log('📥 handleDownload called for:', product.name);
    console.log('📋 Product licenses:', product.licenses);
    console.log('✅ Has active license:', product.hasActiveLicense);
    
    // بررسی اینکه آیا کاربر قبلاً لایسنس دارد
    const activeLicense = product.licenses.find(l => l.isActive && 
      (!l.expiresAt || new Date(l.expiresAt) > new Date())
    );
    
    console.log('🔑 Active license found:', activeLicense);
    
    if (activeLicense) {
      // اگر لایسنس موجود است، مستقیماً دانلود کن
      console.log('✅ دانلود مستقیم با لایسنس موجود');
      await startDownload(product, activeLicense.licenseKey);
    } else {
      // اگر لایسنس ندارد، فرم دامنه نمایش بده
      console.log('📝 نمایش فرم دامنه');
      setDownloadingProduct(product);
      setShowDomainForm(true);
      setDomain('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-white">📱 محصولات دیجیتال من</h1>
          </div>
          <p className="text-purple-200">مدیریت محصولات دیجیتال و لایسنس‌های خریداری شده</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-500/20 border border-green-400 text-green-300' : 
            'bg-red-500/20 border border-red-400 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* محصولات دیجیتال */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              محصولات خریداری شده
            </h2>

            {digitalProducts.length === 0 ? (
              <div className="text-center py-8 text-purple-200">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>هیچ محصول دیجیتالی خریداری نکرده‌اید</p>
                <Link href="/products?type=digital" className="text-purple-300 hover:text-purple-100 underline">
                  مشاهده محصولات دیجیتال
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {digitalProducts.map((product) => {
                  return (
                    <div key={product.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start gap-4">
                        <img 
                          src={product.imageUrl || '/images/products/placeholder.svg'} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-2">{product.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-purple-200">
                            <span>فرمت: {product.fileFormat}</span>
                            <span>حجم: {(product.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-2">
                              {product.hasActiveLicense && (
                                <div className="flex items-center gap-1 text-green-300">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-xs">دامنه: {product.licenses[0]?.domain}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleDownload(product)}
                                className={`px-4 py-2 bg-gradient-to-r ${
                                  product.hasActiveLicense 
                                    ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                                    : 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                } text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-2`}
                              >
                                {product.hasActiveLicense ? '📥 دانلود فایل' : '🔐 دریافت لایسنس و دانلود'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* فرم دریافت لایسنس */}
          <div className="space-y-6">
            {/* فرم تولید لایسنس */}
            {showDomainForm && downloadingProduct && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ایجاد لایسنس دامنه‌ای
                </h3>
                
                <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <p className="text-blue-200 text-sm">
                    <strong>محصول انتخابی:</strong> {downloadingProduct.name}
                  </p>
                  <p className="text-blue-300 text-xs mt-1">
                    این فایل فقط روی دامنه‌ای که مشخص می‌کنید کار خواهد کرد
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      دامنه وب‌سایت شما <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="example.com یا www.example.com"
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      dir="ltr"
                    />
                    <p className="text-xs text-purple-300 mt-1">
                      ⚠️ دقت کنید: فایل دانلودی فقط روی همین دامنه کار خواهد کرد
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerateLicense}
                      disabled={isGeneratingLicense || !domain.trim()}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingLicense ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          در حال ایجاد لایسنس...
                        </div>
                      ) : (
                        '✅ ایجاد لایسنس و دانلود فایل'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDomainForm(false);
                        setDownloadingProduct(null);
                        setDomain('');
                      }}
                      className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* لایسنس‌های موجود */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m0 4V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                لایسنس‌های من ({digitalProducts.reduce((total, product) => total + product.licenses.length, 0)})
              </h3>

              {digitalProducts.every(product => product.licenses.length === 0) ? (
                <div className="text-center py-6 text-purple-200">
                  <svg className="w-12 h-12 mx-auto mb-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m0 4V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  <p>هیچ لایسنسی تولید نکرده‌اید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {digitalProducts.map(product => 
                    product.licenses.map((license, index) => (
                      <div key={`${product.id}-${index}`} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">{product.name}</h4>
                            <div className="space-y-1 text-sm text-purple-200">
                              <div>دامنه: <span className="font-mono text-blue-300">{license.domain}</span></div>
                              <div>تعداد استفاده: <span className="text-yellow-300">{license.usageCount}</span></div>
                              <div>تاریخ ایجاد: <span className="text-green-300">{new Date(license.createdAt).toLocaleDateString('fa-IR')}</span></div>
                              {license.expiresAt && (
                                <div>تاریخ انقضا: <span className="text-orange-300">{new Date(license.expiresAt).toLocaleDateString('fa-IR')}</span></div>
                              )}
                              {license.lastUsed && (
                                <div>آخرین استفاده: <span className="text-gray-300">{new Date(license.lastUsed).toLocaleDateString('fa-IR')}</span></div>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date()) 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date()) 
                              ? '✅ فعال' 
                              : '❌ غیرفعال'}
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-gray-800/50 rounded border border-gray-700">
                          <div className="text-xs text-gray-400 mb-1">کلید لایسنس:</div>
                          <div className="font-mono text-sm text-white break-all">{license.licenseKey}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* راهنما */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">💡 راهنمای استفاده</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-200 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">مراحل دریافت فایل:</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>روی "دریافت لایسنس و دانلود" کلیک کنید</li>
                <li>دامنه وب‌سایت خود را دقیق وارد کنید</li>
                <li>روی "ایجاد لایسنس و دانلود فایل" کلیک کنید</li>
                <li>لایسنس دامنه‌ای تولید و فایل دانلود خواهد شد</li>
                <li>فایل را روی همان دامنه مشخص شده نصب کنید</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">نکات مهم:</h4>
              <ul className="space-y-1">
                <li>• هر بار باید دامنه جدید وارد کنید</li>
                <li>• فایل دانلودی فقط روی دامنه مشخص شده کار می‌کند</li>
                <li>• برای دامنه‌های مختلف، لایسنس جداگانه نیاز است</li>
                <li>• دقت کنید www و بدون www متفاوت هستند</li>
                <li>• لایسنس برای مدت 1 سال معتبر است</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}