'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiRefreshCw, 
  FiSearch, 
  FiFilter, 
  FiExternalLink,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiPlay,
  FiDatabase
} from 'react-icons/fi';

interface PageAnalysis {
  id: string;
  path: string;
  url: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  status: string;
  lastModified: string;
  analysis: {
    score: number;
    issues: string[];
    suggestions: string[];
    scoreBreakdown: any;
    loadTime: number;
    wordCount: number;
    h1Count: number;
    h2Count: number;
    imageCount: number;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    hasStructuredData: boolean;
  };
  // Additional computed properties for display
  titleLength?: number;
  descriptionLength?: number;
}

interface AnalysisSummary {
  totalPages: number;
  analyzedPages: number;
  pagesWithIssues: number;
  averageScore: number;
  highScorePages: number;
  mediumScorePages: number;
  lowScorePages: number;
  totalIssues: number;
  pagesWithoutTitle: number;
  pagesWithoutDescription: number;
  pagesWithoutKeywords: number;
}

interface PagesAnalysisProps {
  onAnalysisUpdate?: (summary: AnalysisSummary) => void;
}

const PagesAnalysis: React.FC<PagesAnalysisProps> = ({ onAnalysisUpdate }) => {
  const [pages, setPages] = useState<PageAnalysis[]>([]);
  const [allAvailablePages, setAllAvailablePages] = useState<string[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'issues'>('all');
  const [sortBy, setSortBy] = useState<'url' | 'score' | 'issues' | 'loadTime'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadAvailablePages();
    analyzePages();
  }, []);

  useEffect(() => {
    if (summary && onAnalysisUpdate) {
      onAnalysisUpdate(summary);
    }
  }, [summary, onAnalysisUpdate]);

  // دریافت لیست تمام صفحات موجود
  const loadAvailablePages = async () => {
    try {
      // Since getAllSitePages is called automatically in the refresh action,
      // we'll just call refresh and extract the paths
      const response = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const pagePaths = data.map(page => page.path || page.url);
          setAllAvailablePages(pagePaths);
          console.log(`📄 ${pagePaths.length} صفحه در سایت یافت شد`);
        }
      }
    } catch (error) {
      console.error('خطا در دریافت لیست صفحات:', error);
    }
  };

  // تحلیل تمام صفحات
  const analyzePages = async () => {
    setLoading(true);
    try {
      console.log('🔄 شروع تحلیل جامع SEO...');
      const response = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh'
        })
      });
      const data = await response.json();
      
      console.log('📊 Response data:', data); // Debug log
      
      if (response.ok && Array.isArray(data)) {
        // The API returns array directly for refresh action
        const pagesWithLengths = data.map(page => ({
          ...page,
          titleLength: page.title?.length || 0,
          descriptionLength: page.description?.length || 0
        }));
        setPages(pagesWithLengths);
        console.log(`✅ ${pagesWithLengths.length} صفحه تحلیل شد`);
        
        // Calculate summary from the received data
        const calculatedSummary = calculateSummary(pagesWithLengths);
        setSummary(calculatedSummary);
      } else {
        console.error('خطا در تحلیل صفحات:', data.error || 'Invalid response format');
        setPages([]);
      }
    } catch (error) {
      console.error('خطا در ارتباط با سرور:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  // تحلیل صفحات انتخاب شده
  const analyzeSelectedPages = async () => {
    if (selectedPages.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-multiple',
          pages: selectedPages
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // بروزرسانی صفحات تحلیل شده
        setPages(prevPages => {
          const updatedPages = [...prevPages];
          data.pages.forEach((newPage: PageAnalysis) => {
            const index = updatedPages.findIndex(p => p.url === newPage.url);
            if (index !== -1) {
              updatedPages[index] = newPage;
            } else {
              updatedPages.push(newPage);
            }
          });
          return updatedPages;
        });
        
        // بروزرسانی آمار
        const newSummary = calculateSummary(pages);
        setSummary(newSummary);
        
        setSelectedPages([]);
        console.log(`✅ ${selectedPages.length} صفحه مجدداً تحلیل شد`);
      }
    } catch (error) {
      console.error('خطا در تحلیل صفحات انتخاب شده:', error);
    } finally {
      setLoading(false);
    }
  };

  // محاسبه آمار بر اساس صفحات موجود
  const calculateSummary = (pagesList: PageAnalysis[]): AnalysisSummary => {
    const successfulPages = pagesList.filter(p => p.status === 'active');
    const pagesWithIssues = successfulPages.filter(p => p.analysis.issues && p.analysis.issues.length > 0);
    const averageScore = successfulPages.reduce((sum, p) => sum + p.analysis.score, 0) / successfulPages.length;
    
    return {
      totalPages: pagesList.length,
      analyzedPages: successfulPages.length,
      pagesWithIssues: pagesWithIssues.length,
      averageScore: Math.round(averageScore || 0),
      highScorePages: successfulPages.filter(p => p.analysis.score >= 80).length,
      mediumScorePages: successfulPages.filter(p => p.analysis.score >= 60 && p.analysis.score < 80).length,
      lowScorePages: successfulPages.filter(p => p.analysis.score < 60).length,
      totalIssues: successfulPages.reduce((sum, p) => sum + (p.analysis.issues?.length || 0), 0),
      pagesWithoutTitle: successfulPages.filter(p => !p.title).length,
      pagesWithoutDescription: successfulPages.filter(p => !p.description).length,
      pagesWithoutKeywords: successfulPages.filter(p => !p.keywords).length
    };
  };

  // تحلیل صفحه تکی
  const analyzeSinglePage = async (url: string) => {
    try {
      const response = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-single',
          url
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPages(prevPages => 
          prevPages.map(page => 
            page.url === url ? data : page
          )
        );
        console.log(`✅ صفحه ${url} مجدداً تحلیل شد`);
      }
    } catch (error) {
      console.error('خطا در تحلیل صفحه:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <FiTrendingUp className="text-green-500" />;
    if (score >= 60) return <FiMinus className="text-yellow-500" />;
    return <FiTrendingDown className="text-red-500" />;
  };

  const filteredAndSortedPages = pages
    .filter(page => {
      if (searchTerm && !page.url.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      switch (filterStatus) {
        case 'success':
          return page.status === 'active';
        case 'error':
          return page.status === 'error';
        case 'issues':
          return page.status === 'active' && page.analysis.issues && page.analysis.issues.length > 0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'url':
          valueA = a.url;
          valueB = b.url;
          break;
        case 'score':
          valueA = a.analysis.score || 0;
          valueB = b.analysis.score || 0;
          break;
        case 'issues':
          valueA = a.analysis.issues?.length || 0;
          valueB = b.analysis.issues?.length || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* هدر با آمار */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FiDatabase className="text-blue-500" />
              تحلیل پویا صفحات SEO
            </h2>
            <p className="text-gray-400 text-sm">
              تحلیل زنده تمام صفحات سایت از دیتابیس
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadAvailablePages}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              title="بروزرسانی لیست صفحات"
            >
              <FiDatabase className={loading ? 'animate-spin' : ''} />
              لیست صفحات
            </button>
            
            <button
              onClick={analyzePages}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              {loading ? 'در حال تحلیل...' : 'تحلیل کامل'}
            </button>
            
            {selectedPages.length > 0 && (
              <button
                onClick={analyzeSelectedPages}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FiPlay />
                تحلیل انتخاب شده ({selectedPages.length})
              </button>
            )}
          </div>
        </div>

        {/* آمار کلی */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">کل صفحات</p>
                  <p className="text-xl font-bold text-blue-400">{summary.totalPages}</p>
                </div>
                <FiEye className="text-blue-500 text-xl" />
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">تحلیل شده</p>
                  <p className="text-xl font-bold text-green-400">{summary.analyzedPages}</p>
                </div>
                <FiCheckCircle className="text-green-500 text-xl" />
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">دارای مشکل</p>
                  <p className="text-xl font-bold text-yellow-400">{summary.pagesWithIssues}</p>
                </div>
                <FiAlertTriangle className="text-yellow-500 text-xl" />
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">میانگین امتیاز</p>
                  <p className={`text-xl font-bold ${getScoreColor(summary.averageScore)}`}>
                    {summary.averageScore}
                  </p>
                </div>
                {getScoreIcon(summary.averageScore)}
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">امتیاز بالا</p>
                  <p className="text-xl font-bold text-green-400">{summary.highScorePages}</p>
                </div>
                <FiTrendingUp className="text-green-500 text-xl" />
              </div>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">کل مسائل</p>
                  <p className="text-xl font-bold text-red-400">{summary.totalIssues}</p>
                </div>
                <FiXCircle className="text-red-500 text-xl" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ابزارهای جستجو و فیلتر */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="success">موفق</option>
            <option value="error">خطا</option>
            <option value="issues">دارای مشکل</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
          >
            <option value="score">امتیاز</option>
            <option value="url">URL</option>
            <option value="issues">تعداد مسائل</option>
            <option value="loadTime">زمان بارگیری</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            title={sortOrder === 'desc' ? 'نزولی' : 'صعودی'}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {/* اطلاعات صفحات موجود */}
        {allAvailablePages.length > 0 && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              📊 {allAvailablePages.length} صفحه در سایت شناسایی شد | 
              {pages.length} صفحه تحلیل شده | 
              {Math.max(0, allAvailablePages.length - pages.length)} صفحه باقی‌مانده
            </p>
          </div>
        )}
      </div>

      {/* لیست صفحات */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  صفحه
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  وضعیت
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  امتیاز
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  عنوان
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  توضیحات
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  مشکلات
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAndSortedPages.map((page, index) => (
                <tr key={page.url} className="hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {page.url}
                      </a>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {page.status === 'active' ? (
                      <FiCheckCircle className="text-green-500 mx-auto" />
                    ) : (
                      <FiXCircle className="text-red-500 mx-auto" />
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {page.status === 'active' && page.analysis.score !== undefined ? (
                      <div className="flex items-center justify-center gap-1">
                        {getScoreIcon(page.analysis.score)}
                        <span className={`font-bold ${getScoreColor(page.analysis.score)}`}>
                          {page.analysis.score}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {page.title ? (
                      <div className="max-w-xs truncate" title={page.title}>
                        <span className={page.titleLength && page.titleLength < 30 ? 'text-yellow-600' : page.titleLength && page.titleLength > 60 ? 'text-red-600' : 'text-green-600'}>
                          {page.title}
                        </span>
                        <div className="text-xs text-gray-500">
                          ({page.titleLength} کاراکتر)
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500">ندارد</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {page.description ? (
                      <div className="max-w-xs truncate" title={page.description}>
                        <span className={page.descriptionLength && page.descriptionLength < 120 ? 'text-yellow-600' : page.descriptionLength && page.descriptionLength > 160 ? 'text-red-600' : 'text-green-600'}>
                          {page.description.substring(0, 50)}...
                        </span>
                        <div className="text-xs text-gray-500">
                          ({page.descriptionLength} کاراکتر)
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500">ندارد</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {page.analysis.issues && page.analysis.issues.length > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <FiAlertTriangle className="text-red-500" />
                        <span className="text-red-600 font-bold">{page.analysis.issues.length}</span>
                      </div>
                    ) : page.status === 'active' ? (
                      <FiCheckCircle className="text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => analyzeSinglePage(page.url)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="تحلیل مجدد"
                    >
                      <FiRefreshCw />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedPages.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400">
            هیچ صفحه‌ای با این فیلتر یافت نشد
          </div>
        )}
      </div>
      
      {/* جزئیات مشکلات */}
      {filteredAndSortedPages.some(page => page.analysis.issues && page.analysis.issues.length > 0) && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <FiAlertTriangle className="text-red-500" />
            مشکلات شناسایی شده
          </h3>
          <div className="space-y-3">
            {filteredAndSortedPages
              .filter(page => page.analysis.issues && page.analysis.issues.length > 0)
              .map(page => (
                <div key={page.url} className="border-r-4 border-red-500 bg-red-900/30 p-3 rounded">
                  <div className="font-medium text-red-200 mb-2">
                    {page.url}
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {page.analysis.issues?.map((issue, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesAnalysis;