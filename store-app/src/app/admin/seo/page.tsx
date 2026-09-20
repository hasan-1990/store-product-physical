'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ChartBarIcon, 
  CogIcon, 
  DocumentTextIcon,
  GlobeAltIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  CodeBracketIcon,
  BoltIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import SEOSettingsForm from '@/components/admin/SEOSettingsForm';
import SEOPagesManager from '@/components/admin/SEOPagesManager';
import SEOAnalysis from '@/components/admin/SEOAnalysis';
import SEOTools from '@/components/admin/SEOTools';
import URLManager from '@/components/admin/URLManager';
import PagesAnalysis from '@/components/admin/PagesAnalysis';
import AdvancedSchemaManagerSimple from '@/components/admin/AdvancedSchemaManagerSimple';
import ContentOptimizationPanel from '@/components/admin/ContentOptimizationPanel';
import PageSpeedOptimization from '@/components/admin/PageSpeedOptimization';
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics';
import SEOBackupManager from '@/components/admin/SEOBackupManager';
import DynamicContentManager from '@/components/admin/DynamicContentManager';

interface SEOSettings {
  global: {
    siteTitle: string;
    siteDescription: string;
    siteUrl: string;
    siteName: string;
    language: string;
    direction: string;
    allowCrawling: boolean;
    googleSiteVerification: string;
    googleAnalyticsId: string;
    googleTagManagerId: string;
    socialMedia: {
      twitter: string;
      facebook: string;
      instagram: string;
      telegram: string;
    };
    contact: {
      email: string;
      phone: string;
      address: string;
    };
  };
  pages: any[];
}

interface SEOAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
  totalPages: number;
  indexedPages: number;
  errors: number;
}

export default function SEODashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // تابع callback برای به‌روزرسانی آمار تحلیل صفحات
  const handleAnalysisUpdate = useCallback((summary: any) => {
    setAnalysis(prev => prev ? {
      ...prev,
      totalPages: summary.totalPages,
      indexedPages: summary.analyzedPages,
      errors: summary.pagesWithIssues
    } : null);
  }, []);

  const analyzeSEO = useCallback((data: SEOSettings): SEOAnalysis => {
    let score = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    const global = data?.global || {};
    const pages = data?.pages || [];

    if (global.siteTitle) score += 10;
    else issues.push('عنوان سایت تعریف نشده');

    if (global.siteDescription) score += 10;
    else issues.push('توضیحات سایت تعریف نشده');

    if (global.googleAnalyticsId) score += 15;
    else recommendations.push('Google Analytics را فعال کنید');

    if (global.googleSiteVerification) score += 15;
    else recommendations.push('Google Search Console را تأیید کنید');

    if (global.allowCrawling) score += 10;
    else issues.push('ایندکس‌سازی سایت غیرفعال است');

    const pagesWithMeta = pages.filter(page => page.title && page.description).length;
    score += Math.min(40, (pagesWithMeta / Math.max(pages.length, 1)) * 40);

    if (pages.length - pagesWithMeta > 0) {
      issues.push(`${pages.length - pagesWithMeta} صفحه فاقد متادیتای کامل`);
    }

    return {
      score: Math.round(score),
      issues,
      recommendations,
      totalPages: pages.length,
      indexedPages: pagesWithMeta,
      errors: issues.length
    };
  }, []);

  const loadSEOData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fakeAdminToken = typeof window !== 'undefined' ? localStorage.getItem('fakeAdminToken') : null;

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token || fakeAdminToken) {
        headers.Authorization = `Bearer ${token || fakeAdminToken}`;
      }

      const response = await fetch('/api/admin/seo', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('برای دسترسی به تنظیمات سئو ابتدا وارد حساب مدیریتی شوید');
          router.push('/admin/login');
          return;
        }

        throw new Error(data?.error || 'خطا در دریافت داده‌های سئو');
      }

      if (data && data.global) {
        setSettings(data);
        setAnalysis(analyzeSEO(data));
      } else {
        console.error('ساختار داده نامعتبر:', data);
        const defaultSettings: SEOSettings = {
          global: {
            siteTitle: '',
            siteDescription: '',
            siteUrl: '',
            siteName: '',
            language: 'fa',
            direction: 'rtl',
            allowCrawling: true,
            googleAnalyticsId: '',
            googleSiteVerification: '',
            googleTagManagerId: '',
            socialMedia: {
              twitter: '',
              facebook: '',
              instagram: '',
              telegram: ''
            },
            contact: {
              email: '',
              phone: '',
              address: ''
            }
          },
          pages: []
        };
        setSettings(defaultSettings);
        setAnalysis(analyzeSEO(defaultSettings));
      }
    } catch (error) {
      console.error('خطا در بارگیری داده‌های SEO:', error);
      toast.error('خطا در بارگیری داده‌های SEO');
    } finally {
      setLoading(false);
    }
  }, [analyzeSEO, router]);

  useEffect(() => {
    void loadSEOData();
  }, [loadSEOData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">در حال بارگیری ماژول SEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-8 w-8 text-purple-500 ml-3" />
              <h1 className="text-xl font-bold">ماژول سئو</h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-400">
                آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-purple-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap gap-2 py-3">
            {[
              { id: 'dashboard', name: 'داشبورد', icon: ChartBarIcon, color: 'blue' },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, color: 'cyan' },
              { id: 'settings', name: 'تنظیمات', icon: CogIcon, color: 'gray' },
              { id: 'pages', name: 'صفحات', icon: DocumentTextIcon, color: 'amber' },
              { id: 'content', name: 'محتوا', icon: DocumentTextIcon, color: 'indigo' },
              { id: 'dynamic-content', name: 'مدیریت محتوایی', icon: DocumentTextIcon, color: 'pink' },
              { id: 'page-speed', name: 'سرعت', icon: BoltIcon, color: 'yellow' },
              { id: 'schemas', name: 'Schema', icon: CodeBracketIcon, color: 'green' },
              { id: 'page-analysis', name: 'تحلیل', icon: EyeIcon, color: 'violet' },
              { id: 'analysis', name: 'آنالیز', icon: ArrowTrendingUpIcon, color: 'emerald' },
              { id: 'urls', name: 'URL', icon: LinkIcon, color: 'orange' },
              { id: 'backup', name: 'پشتیبان', icon: CloudArrowDownIcon, color: 'teal' },
              { id: 'tools', name: 'ابزار', icon: GlobeAltIcon, color: 'red' }
            ].map((tab) => {
              const getTabColor = (color: string, isActive: boolean) => {
                if (isActive) {
                  const activeColors: Record<string, string> = {
                    blue: 'bg-blue-600 shadow-lg shadow-blue-500/50',
                    cyan: 'bg-cyan-600 shadow-lg shadow-cyan-500/50',
                    gray: 'bg-gray-600 shadow-lg shadow-gray-500/50',
                    amber: 'bg-amber-600 shadow-lg shadow-amber-500/50',
                    indigo: 'bg-indigo-600 shadow-lg shadow-indigo-500/50',
                    pink: 'bg-pink-600 shadow-lg shadow-pink-500/50',
                    yellow: 'bg-yellow-600 shadow-lg shadow-yellow-500/50',
                    green: 'bg-green-600 shadow-lg shadow-green-500/50',
                    violet: 'bg-violet-600 shadow-lg shadow-violet-500/50',
                    emerald: 'bg-emerald-600 shadow-lg shadow-emerald-500/50',
                    orange: 'bg-orange-600 shadow-lg shadow-orange-500/50',
                    teal: 'bg-teal-600 shadow-lg shadow-teal-500/50',
                    red: 'bg-red-600 shadow-lg shadow-red-500/50'
                  };
                  return activeColors[color] || activeColors.blue;
                } else {
                  const hoverColors: Record<string, string> = {
                    blue: 'hover:bg-blue-900/50 hover:border-blue-500',
                    cyan: 'hover:bg-cyan-900/50 hover:border-cyan-500',
                    gray: 'hover:bg-gray-700 hover:border-gray-500',
                    amber: 'hover:bg-amber-900/50 hover:border-amber-500',
                    indigo: 'hover:bg-indigo-900/50 hover:border-indigo-500',
                    pink: 'hover:bg-pink-900/50 hover:border-pink-500',
                    yellow: 'hover:bg-yellow-900/50 hover:border-yellow-500',
                    green: 'hover:bg-green-900/50 hover:border-green-500',
                    violet: 'hover:bg-violet-900/50 hover:border-violet-500',
                    emerald: 'hover:bg-emerald-900/50 hover:border-emerald-500',
                    orange: 'hover:bg-orange-900/50 hover:border-orange-500',
                    teal: 'hover:bg-teal-900/50 hover:border-teal-500',
                    red: 'hover:bg-red-900/50 hover:border-red-500'
                  };
                  return hoverColors[color] || hoverColors.blue;
                }
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border ${
                    activeTab === tab.id
                      ? `${getTabColor(tab.color, true)} text-white border-transparent`
                      : `text-gray-300 bg-gray-800/50 border-gray-700 ${getTabColor(tab.color, false)}`
                  }`}
                >
                  <tab.icon className="h-4 w-4 ml-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* SEO Score Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">امتیاز کلی SEO</h2>
                  <p className="text-purple-100">وضعیت بهینه‌سازی سایت شما</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{analysis?.score || 0}/100</div>
                  <div className={`text-sm ${(analysis?.score || 0) >= 80 ? 'text-green-200' : (analysis?.score || 0) >= 60 ? 'text-yellow-200' : 'text-red-200'}`}>
                    {(analysis?.score || 0) >= 80 ? 'عالی' : (analysis?.score || 0) >= 60 ? 'خوب' : 'نیاز به بهبود'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-blue-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-400">کل صفحات</p>
                    <p className="text-2xl font-bold">{analysis?.totalPages || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-400">صفحات بهینه</p>
                    <p className="text-2xl font-bold">{analysis?.indexedPages || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-400">مسائل SEO</p>
                    <p className="text-2xl font-bold">{analysis?.errors || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center">
                  <EyeIcon className="h-8 w-8 text-purple-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-400">ایندکس Google</p>
                    <p className="text-2xl font-bold">{settings?.global.allowCrawling ? 'فعال' : 'غیرفعال'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Issues */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 ml-2" />
                  مسائل نیازمند رفع
                </h3>
                {analysis?.issues && analysis.issues.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="block w-2 h-2 bg-red-400 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                        <span className="text-gray-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-400">✅ هیچ مسئله‌ای یافت نشد!</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-400 ml-2" />
                  پیشنهادات بهبود
                </h3>
                {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="block w-2 h-2 bg-blue-400 rounded-full mt-2 ml-2 flex-shrink-0"></span>
                        <span className="text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-400">✅ تمام پیشنهادات اعمال شده!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SEOSettingsForm onTabChange={setActiveTab} />
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <AdvancedAnalytics />
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <SEOPagesManager onTabChange={setActiveTab} />
        )}

        {/* Content Optimization Tab */}
        {activeTab === 'content' && (
          <ContentOptimizationPanel />
        )}

        {/* Dynamic Content Tab - Unified Content Manager */}
        {activeTab === 'dynamic-content' && (
          <DynamicContentManager onUpdate={loadSEOData} />
        )}

        {/* Page Speed Optimization Tab */}
        {activeTab === 'page-speed' && (
          <PageSpeedOptimization />
        )}

        {/* Schema Manager Tab */}
        {activeTab === 'schemas' && (
          <AdvancedSchemaManagerSimple />
        )}

        {/* Page Analysis Tab */}
        {activeTab === 'page-analysis' && (
          <PagesAnalysis 
            onAnalysisUpdate={handleAnalysisUpdate}
          />
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <SEOAnalysis onTabChange={setActiveTab} />
        )}

        {/* URLs Tab */}
        {activeTab === 'urls' && (
          <URLManager onTabChange={setActiveTab} />
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <SEOBackupManager />
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <SEOTools onTabChange={setActiveTab} />
        )}
      </div>
    </div>
  );
}