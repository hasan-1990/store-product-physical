'use client';
import { useState } from 'react';
import { 
  GlobeAltIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  CloudArrowDownIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import SchemaGeneratorModal from './SchemaGeneratorModal';
import MetaGeneratorModal from './MetaGeneratorModal';

interface SEOToolsProps {
  onTabChange: (tab: string) => void;
}

export default function SEOTools({ onTabChange }: SEOToolsProps) {
  const [activeToolTab, setActiveToolTab] = useState('system');
  const [urlTest, setUrlTest] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaType, setSchemaType] = useState<'organization' | 'product' | 'article'>('organization');
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaType, setMetaType] = useState<'basic' | 'opengraph' | 'twitter'>('basic');
  const [clearingCache, setClearingCache] = useState(false);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [linkResults, setLinkResults] = useState<any>(null);

  const checkLinks = async () => {
    try {
      setCheckingLinks(true);
      const response = await fetch('/api/admin/seo/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check-all' }),
      });

      const result = await response.json();
      setLinkResults(result);
      
      if (result.success) {
        alert(`بررسی کامل شد: ${result.workingLinks} لینک سالم، ${result.brokenLinks} لینک شکسته`);
      } else {
        alert('خطا در بررسی لینک‌ها');
      }
    } catch (error) {
      alert('خطا در اتصال به سرور');
    } finally {
      setCheckingLinks(false);
    }
  };

  const clearCache = async (cacheType: string) => {
    try {
      setClearingCache(true);
      const response = await fetch('/api/admin/seo/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cacheType }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
      } else {
        alert('خطا در پاکسازی کش');
      }
    } catch (error) {
      alert('خطا در اتصال به سرور');
    } finally {
      setClearingCache(false);
    }
  };

  const testURL = async () => {
    if (!urlTest) return;
    
    setTesting(true);
    try {
      const response = await fetch('/api/admin/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlTest }),
      });

      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('خطا در آنالیز URL:', error);
      setTestResults({
        success: false,
        error: 'خطا در اتصال به سرور'
      });
    } finally {
      setTesting(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch('/sitemap.xml');
      if (response.ok) {
        window.open('/sitemap.xml', '_blank');
      }
    } catch (error) {
      console.error('خطا در تولید sitemap:', error);
    }
  };

  const downloadSEOReport = async () => {
    try {
      const response = await fetch('/api/admin/seo/reports?type=complete');
      const reportData = await response.json();

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطا در دانلود گزارش:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <WrenchScrewdriverIcon className="h-6 w-6 text-green-400 ml-2" />
              ابزارهای SEO
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              ابزارهای کاربردی برای بهینه‌سازی و آنالیز SEO
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex space-x-1 space-x-reverse bg-gray-700/50 rounded-lg p-1">
          {[
            { id: 'system', name: 'ابزارهای سیستم', icon: GlobeAltIcon },
            { id: 'analysis', name: 'آنالیز URL', icon: MagnifyingGlassIcon },
            { id: 'generator', name: 'تولیدکننده‌ها', icon: DocumentTextIcon },
            { id: 'reports', name: 'گزارش‌ها', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveToolTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeToolTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4 ml-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* System Tools */}
      {activeToolTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a 
            href="/sitemap.xml" 
            target="_blank"
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-colors group"
          >
            <GlobeAltIcon className="h-12 w-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2">Sitemap.xml</h3>
            <p className="text-sm text-gray-400">مشاهده و بررسی نقشه سایت</p>
            <div className="mt-4 text-green-400 text-sm">✓ فعال و به‌روز</div>
          </a>

          <a 
            href="/robots.txt" 
            target="_blank"
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors group"
          >
            <DocumentTextIcon className="h-12 w-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2">Robots.txt</h3>
            <p className="text-sm text-gray-400">مشاهده دستورالعمل‌های ربات‌ها</p>
            <div className="mt-4 text-blue-400 text-sm">✓ فعال و پیکربندی شده</div>
          </a>

          <button
            onClick={generateSitemap}
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors group text-right"
          >
            <ChartBarIcon className="h-12 w-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold mb-2">تولید مجدد Sitemap</h3>
            <p className="text-sm text-gray-400">به‌روزرسانی نقشه سایت</p>
            <div className="mt-4 text-purple-400 text-sm">→ کلیک کنید</div>
          </button>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <PhotoIcon className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="font-bold mb-2">بهینه‌سازی تصاویر</h3>
            <p className="text-sm text-gray-400">فشرده‌سازی خودکار تصاویر</p>
            <div className="mt-4 text-yellow-400 text-sm">✓ فعال (WebP)</div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <LinkIcon className="h-12 w-12 text-indigo-400 mb-4" />
            <h3 className="font-bold mb-2">بررسی لینک‌ها</h3>
            <p className="text-sm text-gray-400 mb-4">تشخیص لینک‌های شکسته</p>
            <button
              onClick={checkLinks}
              disabled={checkingLinks}
              className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {checkingLinks ? 'در حال بررسی...' : 'شروع بررسی'}
            </button>
            {linkResults && (
              <div className="mt-3 text-xs">
                <div className="text-green-400">✓ {linkResults.workingLinks} سالم</div>
                <div className="text-red-400">✗ {linkResults.brokenLinks} شکسته</div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <WrenchScrewdriverIcon className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="font-bold mb-2">پاکسازی کش</h3>
            <p className="text-sm text-gray-400 mb-4">پاک کردن کش SEO</p>
            <div className="space-y-2">
              <button
                onClick={() => clearCache('all')}
                disabled={clearingCache}
                className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {clearingCache ? 'در حال پاکسازی...' : 'پاک کردن همه'}
              </button>
              <button
                onClick={() => clearCache('seo-data')}
                disabled={clearingCache}
                className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                کش داده‌ها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Analysis */}
      {activeToolTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">آنالیز URL</h3>
            <p className="text-gray-400 text-sm mb-4">
              URL صفحه مورد نظر را وارد کنید تا آنالیز شود
            </p>
            
            <div className="flex gap-4">
              <input
                type="url"
                value={urlTest}
                onChange={(e) => setUrlTest(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={testURL}
                disabled={testing || !urlTest}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin ml-2"></div>
                    آنالیز...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5 ml-2" />
                    آنالیز کن
                  </>
                )}
              </button>
            </div>

            {testResults && (
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <h4 className="font-bold mb-3">نتایج آنالیز:</h4>
                {testResults.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">URL:</span>
                        <span className="mr-2">{testResults.url}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">وضعیت:</span>
                        <span className="mr-2 text-green-400">{testResults.status} {testResults.statusText}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">عنوان:</span>
                        <span className="mr-2">{testResults.title || 'ندارد'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">زمان بارگیری:</span>
                        <span className="mr-2">{testResults.loadTime}s</span>
                      </div>
                      <div>
                        <span className="text-gray-400">امتیاز SEO:</span>
                        <span className={`mr-2 font-bold ${testResults.seoScore >= 80 ? 'text-green-400' : testResults.seoScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {testResults.seoScore}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">تعداد کلمات:</span>
                        <span className="mr-2">{testResults.wordCount}</span>
                      </div>
                    </div>

                    {testResults.issues && testResults.issues.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-400 mb-2">مشکلات:</h5>
                        <ul className="text-sm space-y-1">
                          {testResults.issues.map((issue: string, index: number) => (
                            <li key={index} className="text-red-300">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testResults.recommendations && testResults.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-400 mb-2">پیشنهادات:</h5>
                        <ul className="text-sm space-y-1">
                          {testResults.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-blue-300">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-400">
                    خطا: {testResults.error || 'نامشخص'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generators */}
      {activeToolTab === 'generator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">تولیدکننده Schema</h3>
            <p className="text-gray-400 text-sm mb-4">
              تولید خودکار JSON-LD Schema
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {setSchemaType('organization'); setSchemaModalOpen(true);}}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Organization Schema
              </button>
              <button 
                onClick={() => {setSchemaType('product'); setSchemaModalOpen(true);}}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Product Schema
              </button>
              <button 
                onClick={() => {setSchemaType('article'); setSchemaModalOpen(true);}}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Article Schema
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">تولیدکننده Meta Tags</h3>
            <p className="text-gray-400 text-sm mb-4">
              ایجاد سریع متاتگ‌های پایه
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {setMetaType('basic'); setMetaModalOpen(true);}}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Basic Meta Tags
              </button>
              <button
                onClick={() => {setMetaType('opengraph'); setMetaModalOpen(true);}}
                className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Open Graph Tags
              </button>
              <button
                onClick={() => {setMetaType('twitter'); setMetaModalOpen(true);}}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Twitter Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeToolTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">گزارش‌های SEO</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/seo/reports?type=complete"
                target="_blank"
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-right block"
              >
                <CloudArrowDownIcon className="h-8 w-8 text-blue-400 mb-2" />
                <h4 className="font-medium">گزارش کامل SEO</h4>
                <p className="text-sm text-gray-400">مشاهده آنلاین</p>
              </a>

              <button
                onClick={downloadSEOReport}
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-right"
              >
                <ArrowDownTrayIcon className="h-8 w-8 text-green-400 mb-2" />
                <h4 className="font-medium">دانلود گزارش JSON</h4>
                <p className="text-sm text-gray-400">فایل JSON</p>
              </button>

              <a
                href="/admin/seo/reports?type=performance"
                target="_blank"
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-right block"
              >
                <ChartBarIcon className="h-8 w-8 text-purple-400 mb-2" />
                <h4 className="font-medium">گزارش عملکرد</h4>
                <p className="text-sm text-gray-400">Core Web Vitals</p>
              </a>

              <a
                href="/admin/seo/reports?type=content"
                target="_blank"
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-right block"
              >
                <DocumentTextIcon className="h-8 w-8 text-yellow-400 mb-2" />
                <h4 className="font-medium">گزارش محتوا</h4>
                <p className="text-sm text-gray-400">آنالیز محتوا</p>
              </a>

              <a
                href="/admin/seo/reports?type=technical"
                target="_blank"
                className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-right block"
              >
                <WrenchScrewdriverIcon className="h-8 w-8 text-indigo-400 mb-2" />
                <h4 className="font-medium">گزارش فنی</h4>
                <p className="text-sm text-gray-400">SEO فنی</p>
              </a>

              <div className="p-4 bg-gray-700/50 rounded-lg opacity-50">
                <MagnifyingGlassIcon className="h-8 w-8 text-red-400 mb-2" />
                <h4 className="font-medium">گزارش کلمات کلیدی</h4>
                <p className="text-sm text-gray-400">در دست توسعه</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">آخرین گزارش‌ها</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium">گزارش SEO کامل</p>
                  <p className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('fa-IR')} - {new Date().toLocaleTimeString('fa-IR')}
                  </p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  دانلود
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Schema Generator Modal */}
      <SchemaGeneratorModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        schemaType={schemaType}
      />
      
      {/* Meta Generator Modal */}
      <MetaGeneratorModal
        isOpen={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        metaType={metaType}
      />
    </div>
  );
}