'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DigitalProduct {
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  downloadUrl: string;
  fileSize: number;
  fileFormat: string;
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

export default function DownloadsPage() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [downloadingProduct, setDownloadingProduct] = useState<DigitalProduct | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Authentication check - JWT only (like /profile/page.tsx)
  useEffect(() => {
    console.log('🚀 [DOWNLOADS PAGE] Component mounted');
    console.log('🚀 [DOWNLOADS PAGE] Checking localStorage...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('📦 [DOWNLOADS PAGE] localStorage state:', {
      hasToken: !!token,
      hasUser: !!user,
      tokenLength: token ? token.length : 0
    });
    
    if (!token) {
      console.log('❌ [DOWNLOADS PAGE] No token found - redirecting to /login');
      router.push('/login');
      return;
    }

    try {
      console.log('🔓 [DOWNLOADS PAGE] Decoding token...');
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      console.log('✅ [DOWNLOADS PAGE] Token decoded:', decoded);
      
      const userIdFromToken = decoded.userId;
      console.log('👤 [DOWNLOADS PAGE] User ID from token:', userIdFromToken);
      
      setUserId(userIdFromToken);

      if (userIdFromToken) {
        console.log('📥 [DOWNLOADS PAGE] Calling fetchDownloads...');
        fetchDownloads(userIdFromToken);
      } else {
        console.log('⚠️ [DOWNLOADS PAGE] No userId in token!');
      }
    } catch (error) {
      console.error('❌ [DOWNLOADS PAGE] Error decoding token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchDownloads = async (userIdParam: string) => {
    try {
      console.log('� [FETCH] Starting fetchDownloads for userId:', userIdParam);
      setLoading(true);
      
      console.log('🌐 [FETCH] Calling /api/orders/create...');
      const response = await fetch(`/api/orders/create?userId=${userIdParam}`);
      console.log('📡 [FETCH] Orders API response status:', response.status);
      
      const data = await response.json();
      console.log('📦 [FETCH] Orders API response data:', data);

      if (data.success && data.orders) {
        console.log('✅ [FETCH] Total orders found:', data.orders.length);
        
        // دریافت لایسنس‌های کاربر با ارسال userId
        console.log('🔍 Fetching licenses with userId:', userIdParam);
        const licensesResponse = await fetch(`/api/licenses?userId=${userIdParam}`);
        console.log('📡 Licenses API status:', licensesResponse.status);
        
        if (!licensesResponse.ok) {
          const errorText = await licensesResponse.text();
          console.error('❌ Licenses API error:', errorText);
        }
        
        const licensesData = await licensesResponse.json();
        console.log('📡 Licenses API response:', licensesData);
        const userLicenses = licensesData.success ? licensesData.licenses : [];
        console.log('🔑 User licenses:', userLicenses);
        console.log('🔑 User licenses count:', userLicenses.length);
        
        // لاگ productId هر لایسنس
        userLicenses.forEach((license: any, index: number) => {
          console.log(`  License ${index + 1}:`, {
            productId: license.productId,
            productIdString: license.productId?.toString(),
            domain: license.domain,
            licenseKey: license.licenseKey
          });
        });
        
        // فیلتر کردن فقط محصولات دیجیتال از سفارشات تکمیل شده
        const digitalProducts: DigitalProduct[] = [];
        
        data.orders.forEach((order: any) => {
          console.log('📦 Order:', order.orderNumber, 'Status:', order.status);
          
          if (order.status === 'completed') {
            order.items.forEach((item: any) => {
              console.log('  📦 Item:', item.name, 'Type:', item.productType, 'DownloadUrl:', item.downloadUrl);
              console.log('  📦 Item productId:', item.productId, 'Type:', typeof item.productId);
              
              if (item.productType === 'DIGITAL' || item.productType === 'digital') {
                // پیدا کردن لایسنس‌های این محصول
                const productLicenses = userLicenses.filter((license: any) => {
                  // مقایسه به صورت string چونممکن است یکی ObjectId باشد
                  const licenseProductId = license.productId?._id?.toString() || license.productId?.toString() || license.productId;
                  const itemProductId = item.productId?.toString() || item.productId;
                  return licenseProductId === itemProductId;
                });
                
                console.log('  🔍 Product:', item.productId, 'Found licenses:', productLicenses.length);
                
                const hasActiveLicense = productLicenses.some((license: any) => 
                  license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date())
                );
                
                const product: DigitalProduct = {
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  productId: item.productId,
                  productName: item.name,
                  downloadUrl: item.downloadUrl || '/downloads/placeholder.zip',
                  fileSize: item.fileSize || 0,
                  fileFormat: item.fileFormat || 'zip',
                  purchaseDate: order.createdAt,
                  licenses: productLicenses.map((license: any) => ({
                    id: license._id,
                    domain: license.domain,
                    licenseKey: license.licenseKey,
                    isActive: license.isActive,
                    expiresAt: license.expiresAt,
                    createdAt: license.createdAt,
                    usageCount: license.usageCount || 0,
                    lastUsed: license.lastUsed
                  })),
                  hasActiveLicense
                };
                console.log('  ✅ Adding digital product:', product.productName, 'Has license:', hasActiveLicense);
                digitalProducts.push(product);
              }
            });
          }
        });

        console.log('📥 Total digital products found:', digitalProducts.length, digitalProducts);
        setDownloads(digitalProducts);
      } else {
        console.log('❌ No orders found or API error');
      }
    } catch (error) {
      console.error('خطا در دریافت دانلودها:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleGenerateLicense = async () => {
    if (!downloadingProduct || !domain.trim()) {
      setMessage({type: 'error', text: 'محصول و دامنه مورد نیاز است'});
      return;
    }

    if (!userId) {
      setMessage({type: 'error', text: 'لطفاً وارد حساب کاربری خود شوید'});
      return;
    }

    setIsGeneratingLicense(true);
    setMessage(null);

    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: downloadingProduct.productId,
          domain: domain.trim(),
          userId: userId
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({type: 'success', text: 'لایسنس با موفقیت تولید شد. دانلود شروع می‌شود...'});
        
        // پاک کردن فرم
        setDownloadingProduct(null);
        setDomain('');
        setShowDomainForm(false);
        
        // شروع دانلود پس از تولید لایسنس
        setTimeout(async () => {
          await startDownload(downloadingProduct, result.data.licenseKey);
          
          // به‌روزرسانی لیست دانلودها برای نمایش لایسنس جدید
          if (userId) {
            await fetchDownloads(userId);
          }
        }, 1000);
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

      const downloadUrl = `/api/download/licensed?licenseKey=${activeLicense}&productId=${product.productId}`;
      
      // ایجاد لینک موقت برای دانلود با IDM
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = ''; // فورس کردن دانلود
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage({type: 'success', text: 'دانلود شروع شد'});
    } catch (error) {
      setMessage({type: 'error', text: 'خطا در دانلود فایل'});
    }
  };

  const handleDownload = async (download: DigitalProduct) => {
    console.log('🔽 handleDownload called for:', download.productName);
    console.log('📋 Licenses:', download.licenses);
    console.log('✅ Has active license:', download.hasActiveLicense);
    
    // بررسی اینکه آیا کاربر قبلاً لایسنس دارد
    const activeLicense = download.licenses?.find(l => l.isActive && 
      (!l.expiresAt || new Date(l.expiresAt) > new Date())
    );
    
    console.log('🔑 Active license found:', activeLicense);
    
    if (activeLicense) {
      // اگر لایسنس موجود است، مستقیماً دانلود کن
      console.log('✅ Downloading directly with existing license');
      await startDownload(download, activeLicense.licenseKey);
    } else {
      // اگر لایسنس ندارد، فرم دامنه نمایش بده
      console.log('📝 Showing domain form');
      setDownloadingProduct(download);
      setShowDomainForm(true);
      setDomain('');
    }
  };

  // ✅ نمایش loading
  console.log('🎨 [RENDER] Rendering component - loading:', loading, 'userId:', userId);
  
  if (loading) {
    console.log('⏳ [RENDER] Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-12 h-12 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">در حال بارگذاری دانلودها...</p>
        </div>
      </div>
    );
  }
  
  console.log('✅ [RENDER] Showing main content - downloads count:', downloads.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/profile"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">دانلودهای من</h1>
              <p className="text-gray-300 mt-1">محصولات دیجیتال خریداری شده و قابل دانلود</p>
            </div>
          </div>
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

        {/* فرم لایسنس */}
        {showDomainForm && downloadingProduct && (
          <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ایجاد لایسنس دامنه‌ای
            </h3>
            
            <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <p className="text-blue-200 text-sm">
                <strong>محصول انتخابی:</strong> {downloadingProduct.productName}
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

        {/* Downloads List */}
        {downloads.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-6xl">📥</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              دانلودی در دسترس نیست
            </h3>
            <p className="text-gray-300 mb-6">
              محصولات دیجیتال خریداری شده و قابل دانلود اینجا نمایش داده می‌شوند
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/profile/orders"
                className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg font-medium transition-all"
              >
                📋 مشاهده سفارشات
              </Link>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
              >
                🛍️ خرید محصولات دیجیتال
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {downloads.map((download, index) => (
              <div
                key={`${download.orderId}-${index}`}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
              >
                {/* Product Icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">📥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {download.productName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                        {download.fileFormat.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(download.fileSize)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">شماره سفارش</p>
                      <p className="text-white font-mono text-xs">{download.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">تاریخ خرید</p>
                      <p className="text-white text-xs">
                        {new Date(download.purchaseDate).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                {download.hasActiveLicense && download.licenses && download.licenses.length > 0 && (
                  <div className="mb-3 p-2 bg-green-500/10 rounded-lg border border-green-400/30">
                    <p className="text-green-300 text-xs">
                      ✅ دامنه ثبت شده: <span className="font-mono">{download.licenses[0].domain}</span>
                    </p>
                  </div>
                )}
                <button
                  onClick={() => handleDownload(download)}
                  className={`w-full py-3 bg-gradient-to-r ${
                    download.hasActiveLicense 
                      ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                      : 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  } text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
                >
                  {download.hasActiveLicense ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>📥 دانلود فایل</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>🔐 دریافت لایسنس و دانلود</span>
                    </>
                  )}
                </button>

                {/* Help Text */}
                <p className="text-xs text-gray-400 text-center mt-3">
                  ⚠️ فایل با لایسنس دامنه‌ای ارائه می‌شود
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            <span>راهنما</span>
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>برای دانلود هر فایل باید دامنه وب‌سایت خود را مشخص کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>فایل دانلودی فقط روی دامنه مشخص شده کار خواهد کرد</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span>برای دامنه‌های مختلف می‌توانید لایسنس جداگانه دریافت کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-1">⚠</span>
              <span>دقت کنید که www و بدون www متفاوت در نظر گرفته می‌شوند</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
