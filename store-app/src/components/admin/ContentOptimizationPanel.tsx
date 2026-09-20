'use client';
import { useState } from 'react';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import DuplicateContentChecker from './DuplicateContentChecker';

interface ContentAnalysisData {
  analysis: {
    uniquenessScore: number;
    readabilityScore: number;
    wordCount: number;
    duplicateContent: boolean;
    duplicatePages: string[];
    issues: string[];
    suggestions: string[];
    contentLength: 'too_short' | 'optimal' | 'too_long';
    headingStructure: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
      hasProperHierarchy: boolean;
    };
    imageAnalysis: {
      totalImages: number;
      imagesWithoutAlt: number;
    };
    keywordDensity: Record<string, number>;
    keywordOveruse: string[];
    missingKeywords: string[];
  };
  qualityMetrics: {
    originalityScore: number;
    relevanceScore: number;
    engagementScore: number;
    technicalScore: number;
    overallScore: number;
  };
  recommendations: {
    critical: string[];
    important: string[];
    minor: string[];
  };
}

export default function ContentOptimizationPanel() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'duplicates'>('analyze');
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<ContentAnalysisData | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'url' | 'html'>('url');

  const analyzeContent = async () => {
    if (!url && !htmlContent) {
      alert('لطفاً URL یا محتوای HTML را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const keywords = targetKeywords.split(',').map(k => k.trim()).filter(k => k);
      
      let response;
      if (analysisMode === 'url') {
        response = await fetch(`/api/admin/seo/content-optimization?url=${encodeURIComponent(url)}`);
      } else {
        response = await fetch('/api/admin/seo/content-optimization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url || 'manual-content',
            html: htmlContent,
            targetKeywords: keywords
          })
        });
      }

      const result = await response.json();
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        alert(`خطا: ${result.error}`);
      }
    } catch (error) {
      console.error('خطا در تحلیل محتوا:', error);
      alert('خطا در تحلیل محتوا');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getContentLengthStatus = (length: string, wordCount: number) => {
    switch (length) {
      case 'too_short':
        return { color: 'text-red-500', text: `کوتاه (${wordCount} کلمه)`, suggestion: 'حداقل 30 کلمه نیاز است' };
      case 'too_long':
        return { color: 'text-orange-500', text: `طولانی (${wordCount} کلمه)`, suggestion: 'بهتر است کمتر از 2000 کلمه باشد' };
      default:
        return { color: 'text-green-500', text: `مناسب (${wordCount} کلمه)`, suggestion: 'طول محتوا مناسب است' };
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentTextIcon className="w-8 h-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">بهینه‌سازی محتوا</h2>
      </div>

      {/* تب‌های navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'analyze' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <ChartBarIcon className="w-5 h-5 ml-2" />
          تحلیل محتوا
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'duplicates' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <DocumentDuplicateIcon className="w-5 h-5 ml-2" />
          محتوای تکراری
        </button>
      </div>

      {/* محتوای تب‌ها */}
      {activeTab === 'analyze' ? (
        <div>
          {/* فرم تحلیل */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setAnalysisMode('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  analysisMode === 'url' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                تحلیل از URL
              </button>
              <button
                onClick={() => setAnalysisMode('html')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  analysisMode === 'html' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                تحلیل محتوای دستی
              </button>
            </div>

            {analysisMode === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL صفحه
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    محتوای HTML
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="محتوای HTML صفحه را اینجا قرار دهید..."
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    URL (اختیاری)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                کلمات کلیدی هدف (جدا شده با کاما)
              </label>
              <input
                type="text"
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="کلمه کلیدی 1, کلمه کلیدی 2, ..."
              />
            </div>

            <button
              onClick={analyzeContent}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'در حال تحلیل...' : 'تحلیل محتوا'}
            </button>
          </div>

          {/* نتایج تحلیل */}
          {analysisData ? (
            <div className="space-y-6">
              {/* امتیازات کلی */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 ml-2" />
                  امتیازات کیفیت محتوا
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.qualityMetrics.overallScore)}`}>
                      {Math.round(analysisData.qualityMetrics.overallScore)}
                    </div>
                    <div className="text-sm text-gray-400">امتیاز کلی</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.qualityMetrics.originalityScore)}`}>
                      {Math.round(analysisData.qualityMetrics.originalityScore)}
                    </div>
                    <div className="text-sm text-gray-400">اصالت</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.qualityMetrics.relevanceScore)}`}>
                      {Math.round(analysisData.qualityMetrics.relevanceScore)}
                    </div>
                    <div className="text-sm text-gray-400">مرتبط بودن</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.qualityMetrics.engagementScore)}`}>
                      {Math.round(analysisData.qualityMetrics.engagementScore)}
                    </div>
                    <div className="text-sm text-gray-400">جذابیت</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(analysisData.qualityMetrics.technicalScore)}`}>
                      {Math.round(analysisData.qualityMetrics.technicalScore)}
                    </div>
                    <div className="text-sm text-gray-400">تکنیکی</div>
                  </div>
                </div>
              </div>

              {/* اطلاعات محتوا */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-4">آمار محتوا</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">طول محتوا:</span>
                      <span className={getContentLengthStatus(analysisData.analysis.contentLength, analysisData.analysis.wordCount).color}>
                        {getContentLengthStatus(analysisData.analysis.contentLength, analysisData.analysis.wordCount).text}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">خوانایی:</span>
                      <span className={getScoreColor(analysisData.analysis.readabilityScore)}>
                        {Math.round(analysisData.analysis.readabilityScore)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">منحصر به فرد بودن:</span>
                      <span className={getScoreColor(analysisData.analysis.uniquenessScore)}>
                        {Math.round(analysisData.analysis.uniquenessScore)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ساختار Headings:</span>
                      <span className={analysisData.analysis.headingStructure.hasProperHierarchy ? 'text-green-500' : 'text-red-500'}>
                        {analysisData.analysis.headingStructure.hasProperHierarchy ? 'مناسب' : 'نامناسب'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-4">تحلیل تصاویر</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">تعداد تصاویر:</span>
                      <span className="text-white">{analysisData.analysis.imageAnalysis.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">بدون Alt Text:</span>
                      <span className={analysisData.analysis.imageAnalysis.imagesWithoutAlt > 0 ? 'text-red-500' : 'text-green-500'}>
                        {analysisData.analysis.imageAnalysis.imagesWithoutAlt}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">H1:</span>
                      <span className={analysisData.analysis.headingStructure.h1Count === 1 ? 'text-green-500' : 'text-red-500'}>
                        {analysisData.analysis.headingStructure.h1Count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">H2:</span>
                      <span className="text-white">{analysisData.analysis.headingStructure.h2Count}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* مشکلات و توصیه‌ها */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* مشکلات حیاتی */}
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 ml-2" />
                    مشکلات حیاتی
                  </h3>
                  <div className="space-y-2">
                    {analysisData.recommendations.critical.length > 0 ? (
                      analysisData.recommendations.critical.map((issue, index) => (
                        <div key={index} className="text-sm text-red-300 bg-red-900/30 p-2 rounded">
                          {issue}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-green-400 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 ml-1" />
                        مشکل حیاتی یافت نشد
                      </div>
                    )}
                  </div>
                </div>

                {/* مشکلات مهم */}
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center">
                    <EyeIcon className="w-5 h-5 ml-2" />
                    مشکلات مهم
                  </h3>
                  <div className="space-y-2">
                    {analysisData.recommendations.important.length > 0 ? (
                      analysisData.recommendations.important.map((issue, index) => (
                        <div key={index} className="text-sm text-yellow-300 bg-yellow-900/30 p-2 rounded">
                          {issue}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-green-400 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 ml-1" />
                        مشکل مهم یافت نشد
                      </div>
                    )}
                  </div>
                </div>

                {/* پیشنهادات */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center">
                    <LightBulbIcon className="w-5 h-5 ml-2" />
                    پیشنهادات بهبود
                  </h3>
                  <div className="space-y-2">
                    {analysisData.analysis.suggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="text-sm text-blue-300 bg-blue-900/30 p-2 rounded">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* تحلیل کلمات کلیدی */}
              {Object.keys(analysisData.analysis.keywordDensity).length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-4">تراکم کلمات کلیدی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysisData.analysis.keywordDensity).map(([keyword, density]) => (
                      <div key={keyword} className="bg-gray-600 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{keyword}</span>
                          <span className={`font-bold ${
                            density > 3 ? 'text-red-400' : 
                            density < 0.5 ? 'text-yellow-400' : 
                            'text-green-400'
                          }`}>
                            {density.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-500 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${
                              density > 3 ? 'bg-red-400' : 
                              density < 0.5 ? 'bg-yellow-400' : 
                              'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(100, density * 20)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* محتوای تکراری */}
              {analysisData.analysis.duplicateContent && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-red-400 mb-3">هشدار: محتوای تکراری</h3>
                  <p className="text-red-300 mb-3">
                    این محتوا در {analysisData.analysis.duplicatePages.length} صفحه دیگر تکرار شده است:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisData.analysis.duplicatePages.map((page, index) => (
                      <li key={index} className="text-red-200 text-sm">{page}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">تحلیل کیفیت محتوا</h3>
              <p className="text-gray-300 mb-4">
                از فرم بالا برای تحلیل محتوای صفحات استفاده کنید.
              </p>
              
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">ویژگی‌های تحلیل محتوا:</h4>
                <ul className="text-blue-300 text-sm space-y-1">
                  <li>• تحلیل طول و کیفیت محتوا</li>
                  <li>• بررسی تراکم کلمات کلیدی</li>
                  <li>• تحلیل خوانایی و ساختار</li>
                  <li>• بررسی ساختار Headings (H1, H2, H3)</li>
                  <li>• تحلیل تصاویر و Alt Text</li>
                  <li>• پیشنهادات بهبود محتوا</li>
                  <li>• امتیازگذی کیفیت محتوا</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <DuplicateContentChecker />
      )}
    </div>
  );
}