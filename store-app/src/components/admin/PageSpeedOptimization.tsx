'use client';
import { useState, useEffect } from 'react';
import { 
  BoltIcon,
  PhotoIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  CloudArrowUpIcon,
  AdjustmentsHorizontalIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import PageSpeedTester from './PageSpeedTester';

interface ImageOptimizationData {
  totalImages: number;
  optimizedImages: number;
  unoptimizedImages: number;
  totalSize: number;
  optimizedSize: number;
  savingsPotential: number;
  lazyLoadEnabled: number;
  missingAlt: number;
  formats: {
    jpeg: number;
    png: number;
    webp: number;
    avif: number;
  };
  largestImages?: Array<{
    path: string;
    size: string;
    dimensions: string;
  }>;
}

interface PageSpeedMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  score: number;
}

interface OptimizationSuggestion {
  type: 'critical' | 'important' | 'minor';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export default function PageSpeedOptimization() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [imageData, setImageData] = useState<ImageOptimizationData | null>(null);
  const [speedMetrics, setSpeedMetrics] = useState<PageSpeedMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');

  useEffect(() => {
    loadImageAnalysis();
    loadSpeedMetrics();
  }, []);

  const loadImageAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/seo/page-speed/images');
      if (response.ok) {
        const data = await response.json();
        setImageData(data);
      }
    } catch (error) {
      console.error('خطا در بارگیری تحلیل تصاویر:', error);
      // داده‌های نمونه برای نمایش
      setImageData({
        totalImages: 45,
        optimizedImages: 28,
        unoptimizedImages: 17,
        totalSize: 2.5, // MB
        optimizedSize: 1.2, // MB
        savingsPotential: 52, // درصد
        lazyLoadEnabled: 32,
        missingAlt: 8,
        formats: {
          jpeg: 25,
          png: 15,
          webp: 4,
          avif: 1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSpeedMetrics = async () => {
    try {
      const response = await fetch('/api/admin/seo/page-speed/metrics');
      if (response.ok) {
        const data = await response.json();
        setSpeedMetrics(data);
      }
    } catch (error) {
      console.error('خطا در بارگیری متریک‌های سرعت:', error);
      // داده‌های نمونه
      setSpeedMetrics({
        lcp: 2.1,
        fid: 85,
        cls: 0.12,
        fcp: 1.8,
        ttfb: 0.6,
        score: 78
      });
    }
  };

  const analyzePageSpeed = async () => {
    if (!selectedUrl.trim()) {
      alert('لطفاً URL صفحه را وارد کنید');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/admin/seo/page-speed/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setSpeedMetrics(data.metrics);
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('خطا در تحلیل سرعت صفحه:', error);
      // پیشنهادات نمونه
      setSuggestions([
        {
          type: 'critical',
          title: 'بهینه‌سازی تصاویر',
          description: '17 تصویر نیاز به بهینه‌سازی دارند',
          impact: '1.3 ثانیه کاهش زمان بارگیری',
          action: 'تبدیل به فرمت WebP و فعال‌سازی Lazy Loading'
        },
        {
          type: 'important',
          title: 'فعال‌سازی فشرده‌سازی Gzip',
          description: 'فایل‌های CSS و JavaScript فشرده نشده‌اند',
          impact: '40% کاهش اندازه فایل‌ها',
          action: 'فعال‌سازی compression در سرور'
        },
        {
          type: 'minor',
          title: 'کش مرورگر',
          description: 'مدت زمان کش برای منابع استاتیک کم است',
          impact: 'بهبود تجربه کاربری در بازدیدهای مجدد',
          action: 'افزایش Cache-Control headers'
        }
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeImages = async () => {
    setOptimizing(true);
    try {
      const response = await fetch('/api/admin/seo/page-speed/optimize-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`تصاویر بهینه‌سازی شد: ${result.optimizedCount} تصویر پردازش شد`);
        loadImageAnalysis();
      }
    } catch (error) {
      console.error('خطا در بهینه‌سازی تصاویر:', error);
      alert('در حال حاضر این ویژگی در دست توسعه است');
    } finally {
      setOptimizing(false);
    }
  };

  const enableLazyLoading = async () => {
    try {
      const response = await fetch('/api/admin/seo/page-speed/lazy-loading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Lazy Loading برای تمام تصاویر فعال شد');
        loadImageAnalysis();
      }
    } catch (error) {
      console.error('خطا در فعال‌سازی Lazy Loading:', error);
      alert('در حال حاضر این ویژگی در دست توسعه است');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        return value <= 2.5 ? 'text-green-400' : value <= 4 ? 'text-yellow-400' : 'text-red-400';
      case 'fid':
        return value <= 100 ? 'text-green-400' : value <= 300 ? 'text-yellow-400' : 'text-red-400';
      case 'cls':
        return value <= 0.1 ? 'text-green-400' : value <= 0.25 ? 'text-yellow-400' : 'text-red-400';
      case 'fcp':
        return value <= 1.8 ? 'text-green-400' : value <= 3 ? 'text-yellow-400' : 'text-red-400';
      case 'ttfb':
        return value <= 0.8 ? 'text-green-400' : value <= 1.8 ? 'text-yellow-400' : 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      case 'important':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      default:
        return <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">در حال بارگیری تحلیل سرعت...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <BoltIcon className="w-7 h-7 ml-3" />
              بهینه‌سازی سرعت صفحه
            </h2>
            <p className="text-blue-100">بهینه‌سازی تصاویر، Lazy Loading و Core Web Vitals</p>
          </div>
          {speedMetrics && (
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(speedMetrics.score)}`}>
                {speedMetrics.score}/100
              </div>
              <div className="text-sm text-blue-200">امتیاز PageSpeed</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', name: 'نمای کلی', icon: ChartBarIcon },
            { id: 'images', name: 'بهینه‌سازی تصاویر', icon: PhotoIcon },
            { id: 'metrics', name: 'Core Web Vitals', icon: ClockIcon },
            { id: 'analysis', name: 'تحلیل صفحه', icon: EyeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 ml-2" />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <PhotoIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold text-white">
                      {imageData?.totalImages || 0}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">کل تصاویر</div>
                  <div className="text-xs text-green-400 mt-1">
                    {imageData?.optimizedImages || 0} بهینه‌شده
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CloudArrowUpIcon className="w-8 h-8 text-yellow-400" />
                    <span className="text-2xl font-bold text-white">
                      {imageData?.savingsPotential || 0}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">صرفه‌جویی</div>
                  <div className="text-xs text-yellow-400 mt-1">
                    {((imageData?.totalSize || 0) - (imageData?.optimizedSize || 0)).toFixed(1)} MB کاهش
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <EyeIcon className="w-8 h-8 text-purple-400" />
                    <span className="text-2xl font-bold text-white">
                      {imageData?.lazyLoadEnabled || 0}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">Lazy Loading</div>
                  <div className="text-xs text-purple-400 mt-1">فعال شده</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BoltIcon className="w-8 h-8 text-green-400" />
                    <span className={`text-2xl font-bold ${getScoreColor(speedMetrics?.score || 0)}`}>
                      {speedMetrics?.score || 0}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">امتیاز سرعت</div>
                  <div className="text-xs text-green-400 mt-1">PageSpeed Insights</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">اقدامات سریع</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={optimizeImages}
                    disabled={optimizing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {optimizing ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <PhotoIcon className="w-5 h-5 ml-2" />
                    )}
                    {optimizing ? 'در حال بهینه‌سازی...' : 'بهینه‌سازی تصاویر'}
                  </button>

                  <button
                    onClick={enableLazyLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <EyeIcon className="w-5 h-5 ml-2" />
                    فعال‌سازی Lazy Loading
                  </button>

                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ChartBarIcon className="w-5 h-5 ml-2" />
                    تحلیل کامل صفحه
                  </button>
                </div>
              </div>

              {/* تست سیستم */}
              <PageSpeedTester />

              {/* Top Issues */}
              {suggestions.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">مهم‌ترین مسائل</h3>
                  <div className="space-y-3">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          suggestion.type === 'critical' ? 'bg-red-900/20 border-red-700' :
                          suggestion.type === 'important' ? 'bg-yellow-900/20 border-yellow-700' :
                          'bg-blue-900/20 border-blue-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {getSuggestionIcon(suggestion.type)}
                            <div className="mr-3">
                              <h4 className="font-medium text-white">{suggestion.title}</h4>
                              <p className="text-sm text-gray-300 mt-1">{suggestion.description}</p>
                              <p className="text-xs text-gray-400 mt-1">تأثیر: {suggestion.impact}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Image Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">آمار تصاویر</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">کل تصاویر:</span>
                      <span className="text-white font-medium">{imageData?.totalImages || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">بهینه‌شده:</span>
                      <span className="text-green-400 font-medium">{imageData?.optimizedImages || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">نیازمند بهینه‌سازی:</span>
                      <span className="text-red-400 font-medium">{imageData?.unoptimizedImages || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">فاقد Alt Text:</span>
                      <span className="text-yellow-400 font-medium">{imageData?.missingAlt || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">فرمت‌های تصویر</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">JPEG:</span>
                      <span className="text-white font-medium">{imageData?.formats.jpeg || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PNG:</span>
                      <span className="text-white font-medium">{imageData?.formats.png || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">WebP:</span>
                      <span className="text-green-400 font-medium">{imageData?.formats.webp || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">AVIF:</span>
                      <span className="text-blue-400 font-medium">{imageData?.formats.avif || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimization Tools */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">ابزارهای بهینه‌سازی</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-600 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">تبدیل فرمت تصاویر</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      تبدیل تصاویر JPEG/PNG به فرمت‌های مدرن WebP و AVIF
                    </p>
                    <button
                      onClick={optimizeImages}
                      disabled={optimizing}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      {optimizing ? 'در حال پردازش...' : 'شروع تبدیل'}
                    </button>
                  </div>

                  <div className="bg-gray-600 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">فعال‌سازی Lazy Loading</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      بارگیری تصاویر فقط هنگام نیاز برای بهبود سرعت
                    </p>
                    <button
                      onClick={enableLazyLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      فعال‌سازی
                    </button>
                  </div>
                </div>
              </div>

              {/* Size Analysis */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">تحلیل اندازه فایل‌ها</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">حجم کل تصاویر:</span>
                    <span className="text-white font-medium">{imageData?.totalSize?.toFixed(1) || 0} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">حجم بعد از بهینه‌سازی:</span>
                    <span className="text-green-400 font-medium">{imageData?.optimizedSize?.toFixed(1) || 0} MB</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${imageData?.savingsPotential || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-green-400">
                      {imageData?.savingsPotential || 0}% صرفه‌جویی
                    </span>
                  </div>
                  
                  {/* بزرگترین تصاویر */}
                  {imageData?.largestImages && imageData.largestImages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-3">بزرگترین تصاویر:</h4>
                      <div className="space-y-2">
                        {imageData.largestImages.map((image: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-gray-600 p-2 rounded">
                            <span className="text-blue-300 truncate">{image.path}</span>
                            <div className="text-right">
                              <div className="text-white">{image.size}</div>
                              <div className="text-gray-400 text-xs">{image.dimensions}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && speedMetrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">Largest Contentful Paint</h3>
                  <div className={`text-3xl font-bold ${getMetricColor('lcp', speedMetrics.lcp)}`}>
                    {speedMetrics.lcp}s
                  </div>
                  <div className="text-sm text-gray-400 mt-2">حد مطلوب: ≤ 2.5s</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">First Input Delay</h3>
                  <div className={`text-3xl font-bold ${getMetricColor('fid', speedMetrics.fid)}`}>
                    {speedMetrics.fid}ms
                  </div>
                  <div className="text-sm text-gray-400 mt-2">حد مطلوب: ≤ 100ms</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">Cumulative Layout Shift</h3>
                  <div className={`text-3xl font-bold ${getMetricColor('cls', speedMetrics.cls)}`}>
                    {speedMetrics.cls}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">حد مطلوب: ≤ 0.1</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">First Contentful Paint</h3>
                  <div className={`text-3xl font-bold ${getMetricColor('fcp', speedMetrics.fcp)}`}>
                    {speedMetrics.fcp}s
                  </div>
                  <div className="text-sm text-gray-400 mt-2">حد مطلوب: ≤ 1.8s</div>
                </div>

                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">Time to First Byte</h3>
                  <div className={`text-3xl font-bold ${getMetricColor('ttfb', speedMetrics.ttfb)}`}>
                    {speedMetrics.ttfb}s
                  </div>
                  <div className="text-sm text-gray-400 mt-2">حد مطلوب: ≤ 0.8s</div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-white mb-4">امتیاز کلی</h3>
                  <div className={`text-3xl font-bold ${getScoreColor(speedMetrics.score)}`}>
                    {speedMetrics.score}/100
                  </div>
                  <div className="text-sm text-purple-200 mt-2">PageSpeed Insights</div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* URL Input */}
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">تحلیل سرعت صفحه</h3>
                <div className="flex space-x-4 space-x-reverse">
                  <input
                    type="url"
                    value={selectedUrl}
                    onChange={(e) => setSelectedUrl(e.target.value)}
                    placeholder="https://example.com/page"
                    className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={analyzePageSpeed}
                    disabled={analyzing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
                  >
                    {analyzing ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <ChartBarIcon className="w-5 h-5 ml-2" />
                    )}
                    {analyzing ? 'در حال تحلیل...' : 'تحلیل کن'}
                  </button>
                </div>
              </div>

              {/* Analysis Results */}
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">نتایج تحلیل</h3>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-lg border ${
                        suggestion.type === 'critical' ? 'bg-red-900/20 border-red-700' :
                        suggestion.type === 'important' ? 'bg-yellow-900/20 border-yellow-700' :
                        'bg-blue-900/20 border-blue-700'
                      }`}
                    >
                      <div className="flex items-start">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="mr-3 flex-1">
                          <h4 className="font-medium text-white mb-2">{suggestion.title}</h4>
                          <p className="text-gray-300 mb-2">{suggestion.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">تأثیر: </span>
                              <span className="text-white">{suggestion.impact}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">اقدام لازم: </span>
                              <span className="text-white">{suggestion.action}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Instructions */}
              {suggestions.length === 0 && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
                  <h4 className="text-blue-400 font-medium mb-2">راهنمای استفاده:</h4>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• URL صفحه‌ای که می‌خواهید تحلیل کنید را وارد کنید</li>
                    <li>• تحلیل شامل Core Web Vitals و پیشنهادات بهینه‌سازی است</li>
                    <li>• نتایج بر اساس Google PageSpeed Insights ارائه می‌شود</li>
                    <li>• پیشنهادات بر اساس اولویت دسته‌بندی می‌شوند</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}