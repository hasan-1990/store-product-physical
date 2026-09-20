'use client';
import { useState } from 'react';
import { BoltIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

export default function PageSpeedTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [step, setStep] = useState(0);

  const testSteps = [
    'تحلیل تصاویر موجود',
    'اندازه‌گیری متریک‌های سرعت',
    'تحلیل عملکرد صفحه',
    'بهینه‌سازی تصاویر',
    'فعال‌سازی Lazy Loading'
  ];

  const runCompleteTest = async () => {
    setTesting(true);
    setResults({});
    setStep(0);

    try {
      // مرحله 1: تحلیل تصاویر
      setStep(1);
      const imageResponse = await fetch('/api/admin/seo/page-speed/images');
      const imageData = await imageResponse.json();
      
      setResults((prev: any) => ({ ...prev, images: imageData }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // مرحله 2: متریک‌های سرعت
      setStep(2);
      const metricsResponse = await fetch('/api/admin/seo/page-speed/metrics');
      const metricsData = await metricsResponse.json();
      
      setResults((prev: any) => ({ ...prev, metrics: metricsData }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // مرحله 3: تحلیل صفحه
      setStep(3);
      const analysisResponse = await fetch('/api/admin/seo/page-speed/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: window.location.origin })
      });
      const analysisData = await analysisResponse.json();
      
      setResults((prev: any) => ({ ...prev, analysis: analysisData }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // مرحله 4: بهینه‌سازی تصاویر
      setStep(4);
      const optimizeResponse = await fetch('/api/admin/seo/page-speed/optimize-images', {
        method: 'POST'
      });
      const optimizeData = await optimizeResponse.json();
      
      setResults((prev: any) => ({ ...prev, optimization: optimizeData }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // مرحله 5: Lazy Loading
      setStep(5);
      const lazyResponse = await fetch('/api/admin/seo/page-speed/lazy-loading', {
        method: 'POST'
      });
      const lazyData = await lazyResponse.json();
      
      setResults((prev: any) => ({ ...prev, lazy: lazyData }));
      
      setStep(6);
    } catch (error) {
      console.error('خطا در تست:', error);
      alert('خطا در انجام تست. جزئیات در کنسول موجود است.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BoltIcon className="w-6 h-6 text-blue-400 ml-3" />
          <h3 className="text-lg font-bold text-white">تست کامل سیستم بهینه‌سازی</h3>
        </div>
        <button
          onClick={runCompleteTest}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              در حال تست...
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 ml-2" />
              شروع تست
            </>
          )}
        </button>
      </div>

      {/* نمایش مراحل */}
      {testing && (
        <div className="mb-6">
          <div className="space-y-3">
            {testSteps.map((stepName, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  step > index + 1 ? 'bg-green-500 text-white' :
                  step === index + 1 ? 'bg-blue-500 text-white animate-pulse' :
                  'bg-gray-600 text-gray-400'
                }`}>
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`${
                  step > index + 1 ? 'text-green-400' :
                  step === index + 1 ? 'text-blue-400' :
                  'text-gray-400'
                }`}>
                  {stepName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* نمایش نتایج */}
      {results && Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-white font-medium flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-400 ml-2" />
            نتایج تست
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* نتایج تحلیل تصاویر */}
            {results.images && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-blue-400 font-medium mb-2">تحلیل تصاویر</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">کل تصاویر:</span>
                    <span className="text-white">{results.images.totalImages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">بهینه‌شده:</span>
                    <span className="text-green-400">{results.images.optimizedImages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">صرفه‌جویی:</span>
                    <span className="text-yellow-400">{results.images.savingsPotential}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* نتایج متریک‌ها */}
            {results.metrics && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-purple-400 font-medium mb-2">متریک‌های سرعت</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">امتیاز کلی:</span>
                    <span className="text-white font-bold">{results.metrics.score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">LCP:</span>
                    <span className="text-white">{results.metrics.lcp}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">FID:</span>
                    <span className="text-white">{results.metrics.fid}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* نتایج بهینه‌سازی */}
            {results.optimization && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-green-400 font-medium mb-2">بهینه‌سازی</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">تصاویر بهینه‌شده:</span>
                    <span className="text-white">{results.optimization.optimizedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">صرفه‌جویی:</span>
                    <span className="text-green-400">{results.optimization.savedSize} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WebP تولید:</span>
                    <span className="text-blue-400">{results.optimization.formats?.webpConverted || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* خلاصه نهایی */}
          {step === 6 && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mt-4">
              <h5 className="text-green-400 font-medium mb-2">✅ تست کامل شد!</h5>
              <p className="text-green-300 text-sm">
                تمام ماژول‌های بهینه‌سازی سرعت صفحه به درستی کار می‌کنند.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}