'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

function SEOReportContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'complete';
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [type]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/seo/reports?type=${type}`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('خطا در بارگیری گزارش:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">در حال تولید گزارش...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">خطا در بارگیری گزارش</h2>
            <p className="text-gray-400">لطفاً دوباره تلاش کنید</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">گزارش SEO</h1>
            <p className="text-gray-400 mt-1">
              تولید شده در: {report.generatedAtPersian}
            </p>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5 ml-2" />
            دانلود گزارش
          </button>
        </div>

        {/* Complete Report */}
        {report.type === 'complete' && (
          <div className="space-y-8">
            
            {/* Summary */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-purple-400 ml-2" />
                خلاصه کلی
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{report.summary.totalPages}</div>
                  <div className="text-sm text-gray-400">کل صفحات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{report.summary.optimizedPages}</div>
                  <div className="text-sm text-gray-400">بهینه شده</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{report.summary.pendingOptimization}</div>
                  <div className="text-sm text-gray-400">نیاز به بهبود</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{report.summary.seoScore}/100</div>
                  <div className="text-sm text-gray-400">امتیاز SEO</div>
                </div>
              </div>
            </div>

            {/* Global Settings */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">تنظیمات کلی</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.globalSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-300">{getSettingLabel(key)}</span>
                    <span className={`font-medium ${value === 'تنظیم شده' ? 'text-green-400' : 'text-red-400'}`}>
                      {value as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {report.issues.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-red-500/20">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400 ml-2" />
                  مشکلات یافت شده
                </h2>
                <div className="space-y-2">
                  {report.issues.map((issue: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-red-500/10 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 ml-3 flex-shrink-0" />
                      <span className="text-red-200">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/20">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-blue-400 ml-2" />
                  پیشنهادات
                </h2>
                <div className="space-y-2">
                  {report.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-blue-500/10 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400 ml-3 flex-shrink-0" />
                      <span className="text-blue-200">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pages Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">جزئیات صفحات</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-right py-2">URL</th>
                      <th className="text-right py-2">عنوان</th>
                      <th className="text-right py-2">وضعیت</th>
                      <th className="text-right py-2">مشکلات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pages.map((page: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-2 text-blue-400">{page.url}</td>
                        <td className="py-2">{page.title}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(page.status)}`}>
                            {page.status}
                          </span>
                        </td>
                        <td className="py-2 text-red-400 text-xs">
                          {page.issues.length > 0 ? page.issues.join(', ') : 'ندارد'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Performance Report */}
        {report.type === 'performance' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Core Web Vitals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(report.coreWebVitals).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-center p-4 bg-gray-700/50 rounded-lg">
                    <div className="text-lg font-bold">{key.toUpperCase()}</div>
                    <div className={`text-2xl font-bold ${value.status === 'good' ? 'text-green-400' : 'text-red-400'}`}>
                      {value.value}
                    </div>
                    <div className="text-sm text-gray-400">حد آستانه: {value.threshold}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function getSettingLabel(key: string): string {
  const labels: Record<string, string> = {
    siteTitle: 'عنوان سایت',
    siteDescription: 'توضیحات سایت',
    googleAnalyticsId: 'Google Analytics',
    googleSearchConsoleId: 'Google Search Console',
    facebookPixelId: 'Facebook Pixel'
  };
  return labels[key] || key;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'بهینه':
      return 'bg-green-500/20 text-green-400';
    case 'خوب':
      return 'bg-blue-500/20 text-blue-400';
    case 'نیاز به بهبود':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-red-500/20 text-red-400';
  }
}

export default function SEOReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">در حال بارگیری...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SEOReportContent />
    </Suspense>
  );
}