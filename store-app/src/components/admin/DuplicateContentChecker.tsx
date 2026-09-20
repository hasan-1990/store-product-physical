'use client';
import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface DuplicateContentResult {
  url: string;
  title: string;
  contentHash: string;
  duplicates: {
    url: string;
    title: string;
    similarity: number;
  }[];
  status: 'unique' | 'duplicate' | 'similar';
}

export default function DuplicateContentChecker() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<DuplicateContentResult[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [scannedPages, setScannedPages] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const scanForDuplicates = async () => {
    setScanning(true);
    setResults([]);
    setScannedPages(0);
    setDuplicateCount(0);

    try {
      // دریافت لیست تمام صفحات
      const pagesResponse = await fetch('/api/admin/seo/pages/manage');
      const pagesData = await pagesResponse.json();
      
      if (!pagesData.success) {
        throw new Error('خطا در دریافت لیست صفحات');
      }

      const pages = pagesData.pages || [];
      setTotalPages(pages.length);

      const contentMap = new Map<string, DuplicateContentResult[]>();
      const scanResults: DuplicateContentResult[] = [];

      // اسکن هر صفحه
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        setScannedPages(i + 1);

        try {
          // تحلیل محتوای صفحه
          const analysisResponse = await fetch('/api/admin/seo/content-optimization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: page.url,
              html: `<html><head><title>${page.title}</title><meta name="description" content="${page.description}"></head><body><h1>${page.title}</h1><p>${page.description}</p></body></html>`,
              targetKeywords: []
            })
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const contentHash = analysisData.data?.analysis?.contentHash;

            if (contentHash) {
              const result: DuplicateContentResult = {
                url: page.url,
                title: page.title,
                contentHash,
                duplicates: [],
                status: 'unique'
              };

              // بررسی تکراری بودن
              if (contentMap.has(contentHash)) {
                const existingPages = contentMap.get(contentHash)!;
                
                // به‌روزرسانی صفحات موجود
                existingPages.forEach(existing => {
                  existing.duplicates.push({
                    url: page.url,
                    title: page.title,
                    similarity: 100
                  });
                  existing.status = 'duplicate';
                });

                // اضافه کردن صفحه جدید
                result.duplicates = existingPages.map(existing => ({
                  url: existing.url,
                  title: existing.title,
                  similarity: 100
                }));
                result.status = 'duplicate';

                existingPages.push(result);
              } else {
                contentMap.set(contentHash, [result]);
              }

              scanResults.push(result);
            }
          }
        } catch (error) {
          console.error(`خطا در تحلیل صفحه ${page.url}:`, error);
        }

        // تاخیر کوتاه برای جلوگیری از فشار زیاد به سرور
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // محاسبه آمار نهایی
      const duplicateResults = scanResults.filter(r => r.status === 'duplicate');
      setDuplicateCount(duplicateResults.length);
      setResults(scanResults);

    } catch (error) {
      console.error('خطا در اسکن محتوای تکراری:', error);
      alert('خطا در اسکن محتوای تکراری');
    } finally {
      setScanning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unique': return 'text-green-500';
      case 'duplicate': return 'text-red-500';
      case 'similar': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unique': return CheckCircleIcon;
      case 'duplicate': return ExclamationTriangleIcon;
      case 'similar': return EyeIcon;
      default: return DocumentDuplicateIcon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'unique': return 'منحصر به فرد';
      case 'duplicate': return 'تکراری';
      case 'similar': return 'مشابه';
      default: return 'نامشخص';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentDuplicateIcon className="w-8 h-8 text-red-400" />
        <h2 className="text-2xl font-bold text-white">تشخیص محتوای تکراری</h2>
      </div>

      {/* کنترل‌ها */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">اسکن محتوای تکراری</h3>
            <p className="text-gray-400 text-sm">
              تمام صفحات سایت برای یافتن محتوای تکراری بررسی می‌شوند
            </p>
          </div>
          <button
            onClick={scanForDuplicates}
            disabled={scanning}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {scanning ? 'در حال اسکن...' : 'شروع اسکن'}
          </button>
        </div>

        {/* نوار پیشرفت */}
        {scanning && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>در حال اسکن صفحات...</span>
              <span>{scannedPages}/{totalPages}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalPages > 0 ? (scannedPages / totalPages) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* آمار کلی */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-400 ml-3" />
              <div>
                <p className="text-sm text-gray-400">صفحات منحصر به فرد</p>
                <p className="text-2xl font-bold text-white">
                  {results.filter(r => r.status === 'unique').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 ml-3" />
              <div>
                <p className="text-sm text-gray-400">صفحات تکراری</p>
                <p className="text-2xl font-bold text-white">{duplicateCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="w-8 h-8 text-blue-400 ml-3" />
              <div>
                <p className="text-sm text-gray-400">کل صفحات</p>
                <p className="text-2xl font-bold text-white">{results.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نتایج */}
      {results.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">نتایج اسکن</h3>
          
          {/* فیلتر */}
          <div className="flex space-x-2 mb-4">
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
              تکراری ({duplicateCount})
            </button>
            <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm">
              منحصر به فرد ({results.filter(r => r.status === 'unique').length})
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results
              .filter(result => result.status === 'duplicate')
              .map((result, index) => {
                const StatusIcon = getStatusIcon(result.status);
                return (
                  <div key={index} className="bg-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(result.status)}`} />
                          <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                            {getStatusText(result.status)}
                          </span>
                        </div>
                        
                        <h4 className="text-white font-medium mb-1">{result.title}</h4>
                        <p className="text-gray-400 text-sm mb-2">{result.url}</p>
                        
                        {result.duplicates.length > 0 && (
                          <div className="mt-3">
                            <p className="text-yellow-400 text-sm font-medium mb-2">
                              صفحات تکراری ({result.duplicates.length}):
                            </p>
                            <div className="space-y-1">
                              {result.duplicates.map((duplicate, dupIndex) => (
                                <div key={dupIndex} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                  <div>
                                    <p className="text-white text-sm">{duplicate.title}</p>
                                    <p className="text-gray-400 text-xs">{duplicate.url}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-red-400 text-sm font-medium">
                                      {duplicate.similarity}%
                                    </span>
                                    <button className="text-gray-400 hover:text-white">
                                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {results.filter(r => r.status === 'duplicate').length === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">عالی!</h3>
              <p className="text-gray-400">محتوای تکراری یافت نشد</p>
            </div>
          )}
        </div>
      )}

      {/* راهنما */}
      <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">راهنمای حل مشکل محتوای تکراری:</h4>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• محتوای منحصر به فرد و ارزشمند ایجاد کنید</li>
          <li>• از canonical URLs برای صفحات مشابه استفاده کنید</li>
          <li>• صفحات تکراری را حذف یا تغییر مسیر دهید</li>
          <li>• از noindex برای صفحات غیرضروری استفاده کنید</li>
          <li>• محتوا را بازنویسی کنید تا منحصر به فرد شود</li>
        </ul>
      </div>
    </div>
  );
}