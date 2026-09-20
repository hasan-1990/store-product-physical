'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  UserIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

// Analytics Event Types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// Goal Types
export interface Goal {
  id: string;
  name: string;
  type: 'purchase' | 'signup' | 'contact' | 'download' | 'view_item' | 'add_to_cart' | 'custom';
  value?: number;
  conversion_rate?: number;
  total_conversions?: number;
}

// Enhanced Analytics Class
class AdvancedAnalyticsManager {
  private isInitialized = false;
  private goals: Goal[] = [];

  // Initialize Analytics
  init() {
    if (this.isInitialized) return;
    
    // Set up default goals (including SEO goals)
    this.goals = [
      { id: 'purchase', name: 'خرید محصول', type: 'purchase', value: 0, conversion_rate: 0, total_conversions: 0 },
      { id: 'signup', name: 'ثبت نام کاربر', type: 'signup', value: 10, conversion_rate: 0, total_conversions: 0 },
      { id: 'contact', name: 'تماس با ما', type: 'contact', value: 5, conversion_rate: 0, total_conversions: 0 },
      { id: 'add_to_cart', name: 'افزودن به سبد', type: 'add_to_cart', value: 2, conversion_rate: 0, total_conversions: 0 },
      { id: 'view_item', name: 'مشاهده محصول', type: 'view_item', value: 1, conversion_rate: 0, total_conversions: 0 },
      // SEO Performance Goals
      { id: 'fast_lcp', name: 'LCP سریع (<2.5s)', type: 'custom', value: 3, conversion_rate: 0, total_conversions: 0 },
      { id: 'fast_fid', name: 'FID سریع (<100ms)', type: 'custom', value: 3, conversion_rate: 0, total_conversions: 0 },
      { id: 'stable_cls', name: 'CLS پایدار (<0.1)', type: 'custom', value: 3, conversion_rate: 0, total_conversions: 0 },
      { id: 'long_session', name: 'نشست طولانی (+2min)', type: 'custom', value: 5, conversion_rate: 0, total_conversions: 0 },
      { id: 'content_engagement', name: 'تعامل با محتوا', type: 'custom', value: 2, conversion_rate: 0, total_conversions: 0 }
    ];

    this.isInitialized = true;
  }

  // Track Goal Conversion
  trackGoal(goalId: string, value?: number, additionalData?: Record<string, any>) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        goal_id: goalId,
        goal_name: goal.name,
        goal_type: goal.type,
        value: value || goal.value,
        currency: 'USD',
        ...additionalData
      });
    }

    // Update local goal stats
    goal.total_conversions = (goal.total_conversions || 0) + 1;
  }

  // E-commerce Tracking
  trackPurchase(transactionData: {
    transaction_id: string;
    value: number;
    currency?: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  }) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: transactionData.transaction_id,
        value: transactionData.value,
        currency: transactionData.currency || 'USD',
        items: transactionData.items
      });
    }

    this.trackGoal('purchase', transactionData.value, {
      transaction_id: transactionData.transaction_id,
      items_count: transactionData.items.length
    });
  }

  // Enhanced Event Tracking
  trackEvent(event: AnalyticsEvent) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      });
    }
  }

  // User Engagement Tracking
  trackUserEngagement(action: string, data?: Record<string, any>) {
    this.trackEvent({
      action,
      category: 'engagement',
      custom_parameters: {
        timestamp: Date.now(),
        page: window.location.pathname,
        ...data
      }
    });
  }

  // Form Tracking
  trackFormSubmission(formName: string, success: boolean, data?: Record<string, any>) {
    this.trackEvent({
      action: success ? 'form_submit_success' : 'form_submit_error',
      category: 'form',
      label: formName,
      value: success ? 1 : 0,
      custom_parameters: data
    });

    if (success && formName === 'contact') {
      this.trackGoal('contact');
    } else if (success && formName === 'signup') {
      this.trackGoal('signup');
    }
  }

  // Product Interaction Tracking
  trackProductInteraction(action: string, productData: {
    product_id: string;
    product_name: string;
    category: string;
    price?: number;
  }) {
    this.trackEvent({
      action,
      category: 'product',
      label: productData.product_name,
      value: productData.price,
      custom_parameters: {
        product_id: productData.product_id,
        category: productData.category
      }
    });

    if (action === 'view_item') {
      this.trackGoal('view_item');
    } else if (action === 'add_to_cart') {
      this.trackGoal('add_to_cart');
    }
  }

  // Page Performance Tracking
  trackPagePerformance(metrics: {
    page_load_time: number;
    largest_contentful_paint: number;
    first_input_delay: number;
    cumulative_layout_shift: number;
  }) {
    this.trackEvent({
      action: 'page_performance',
      category: 'performance',
      custom_parameters: {
        lcp: metrics.largest_contentful_paint,
        fid: metrics.first_input_delay,
        cls: metrics.cumulative_layout_shift,
        load_time: metrics.page_load_time,
        timestamp: Date.now()
      }
    });

    // SEO Performance Goals
    if (metrics.largest_contentful_paint < 2500) {
      this.trackGoal('fast_lcp', 1, { lcp_score: 'good' });
    }
    if (metrics.first_input_delay < 100) {
      this.trackGoal('fast_fid', 1, { fid_score: 'good' });
    }
    if (metrics.cumulative_layout_shift < 0.1) {
      this.trackGoal('stable_cls', 1, { cls_score: 'good' });
    }
  }

  // SEO-specific Tracking
  trackSEOMetrics(data: {
    page_title: string;
    meta_description: string;
    h1_count: number;
    internal_links: number;
    external_links: number;
    images_without_alt: number;
    page_size_kb: number;
  }) {
    this.trackEvent({
      action: 'seo_audit',
      category: 'seo',
      custom_parameters: {
        ...data,
        timestamp: Date.now(),
        url: window.location.pathname
      }
    });
  }

  // Search Console Integration
  trackSearchQuery(query: string, position: number, clicks: number) {
    this.trackEvent({
      action: 'search_query',
      category: 'seo',
      label: query,
      value: position,
      custom_parameters: {
        clicks,
        impressions: 1,
        ctr: clicks > 0 ? (clicks / 1) * 100 : 0
      }
    });
  }

  // Get Goals
  getGoals(): Goal[] {
    return this.goals;
  }

  // Update Goal
  updateGoal(goalId: string, updates: Partial<Goal>) {
    const goalIndex = this.goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
      this.goals[goalIndex] = { ...this.goals[goalIndex], ...updates };
    }
  }
}

// Global Analytics Instance
export const analytics = new AdvancedAnalyticsManager();

// Analytics Dashboard Component
interface AnalyticsDashboardProps {
  className?: string;
}

export default function AdvancedAnalytics({ className = '' }: AnalyticsDashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [abTestResults, setAbTestResults] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalPageViews: 0,
    totalUsers: 0,
    totalRevenue: 0,
    conversionRate: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    onlineUsers: 0,
    pagesBeingViewed: 0,
    todayConversions: 0
  });

  const [realTimeData, setRealTimeData] = useState({
    currentPageViews: 0,
    sessionsToday: 0,
    activeUsers: 0
  });

  // Load real analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      // بارگذاری داده‌های Analytics
      const analyticsResponse = await fetch('/api/admin/analytics');
      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json();
        setMetrics(data.metrics || metrics);
        setRealTimeData(data.realTime || realTimeData);
      }

      // بارگذاری نتایج A/B Testing
      const abTestResponse = await fetch('/api/admin/ab-tests?status=running');
      if (abTestResponse.ok) {
        const abData = await abTestResponse.json();
        setAbTestResults(abData.tests || []);
      }
    } catch (error) {
      console.log('Using local analytics data:', error);
      // Use localStorage for development
      loadLocalAnalyticsData();
    }
  }, []);

  // Load from localStorage (for development)
  const loadLocalAnalyticsData = useCallback(() => {
    const storedData = localStorage.getItem('dev_analytics_data');
    if (storedData) {
      const data = JSON.parse(storedData);
      setMetrics(data.metrics);
      setRealTimeData(data.realTime);
    } else {
      // Initialize with zero values for development
      const initialMetrics = {
        totalPageViews: 0,
        totalUsers: 0,
        totalRevenue: 0,
        conversionRate: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        onlineUsers: 1, // Current user
        pagesBeingViewed: 1,
        todayConversions: 0
      };
      const initialRealTime = {
        currentPageViews: 1,
        sessionsToday: 1,
        activeUsers: 1
      };
      
      setMetrics(initialMetrics);
      setRealTimeData(initialRealTime);
      
      // Save to localStorage
      localStorage.setItem('dev_analytics_data', JSON.stringify({
        metrics: initialMetrics,
        realTime: initialRealTime,
        lastUpdated: Date.now()
      }));
    }
  }, []);

  useEffect(() => {
    // Initialize Analytics
    analytics.init();
    setGoals(analytics.getGoals());

    // Load real data
    loadAnalyticsData().finally(() => {
      setIsLoading(false);
    });

    // Real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadAnalyticsData]);

  // Test Goal Tracking (updates localStorage in development)
  const testGoalTracking = (goalId: string) => {
    analytics.trackGoal(goalId, Math.floor(Math.random() * 100));
    
    // Update local state
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, total_conversions: (goal.total_conversions || 0) + 1 }
        : goal
    );
    setGoals(updatedGoals);

    // Update localStorage for persistence in development
    const currentData = JSON.parse(localStorage.getItem('dev_analytics_data') || '{}');
    const updatedMetrics = {
      ...metrics,
      todayConversions: metrics.todayConversions + 1
    };
    
    if (goalId === 'purchase') {
      updatedMetrics.totalRevenue += Math.floor(Math.random() * 1000) + 100;
    }
    
    setMetrics(updatedMetrics);
    
    localStorage.setItem('dev_analytics_data', JSON.stringify({
      ...currentData,
      metrics: updatedMetrics,
      goals: updatedGoals,
      lastUpdated: Date.now()
    }));
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-8 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-8 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-400 ml-3" />
            تحلیل‌های پیشرفته
          </h2>
          <p className="text-gray-300 mt-2">ردیابی اهداف و تحلیل رفتار کاربران</p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300 border border-green-700">
            فعال
          </span>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">بازدید صفحات</p>
              <p className="text-2xl font-bold">{metrics.totalPageViews.toLocaleString()}</p>
            </div>
            <EyeIcon className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">کاربران</p>
              <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
            </div>
            <UserIcon className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">درآمد کل</p>
              <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">نرخ تبدیل</p>
              <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">مدت نشست</p>
              <p className="text-2xl font-bold">{Math.floor(metrics.avgSessionDuration / 60)}m</p>
            </div>
            <ClockIcon className="h-8 w-8 text-teal-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">نرخ خروج</p>
              <p className="text-2xl font-bold">{metrics.bounceRate}%</p>
            </div>
            <DevicePhoneMobileIcon className="h-8 w-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Goals Tracking */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          🎯 ردیابی اهداف
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-gray-700 border border-gray-600 rounded-lg p-6 hover:bg-gray-650 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white">{goal.name}</h4>
                <span className="text-sm text-gray-400">{goal.type}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">تعداد تبدیل:</span>
                  <span className="font-bold text-lg text-blue-400">{goal.total_conversions || 0}</span>
                </div>
                
                {goal.value && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">ارزش:</span>
                    <span className="font-semibold text-green-400">${goal.value}</span>
                  </div>
                )}
                
                <button
                  onClick={() => testGoalTracking(goal.id)}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  تست ردیابی
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Analytics */}
      <div className="bg-gray-750 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          🔴 آمار لحظه‌ای
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{realTimeData.activeUsers}</p>
            <p className="text-sm text-gray-400">کاربران آنلاین</p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{realTimeData.currentPageViews}</p>
            <p className="text-sm text-gray-400">صفحات در حال مشاهده</p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{metrics.todayConversions}</p>
            <p className="text-sm text-gray-400">تبدیل‌های امروز</p>
          </div>
        </div>
      </div>

      {/* A/B Test Results Section */}
      {abTestResults.length > 0 && (
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            نتایج A/B Testing
          </h3>

          <div className="space-y-4">
            {abTestResults.map((test) => (
              <div key={test.id} className="bg-gray-800/30 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">{test.name}</h4>
                    <p className="text-gray-400 text-sm">{test.description}</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                    در حال اجرا
                  </span>
                </div>

                {test.results && Object.keys(test.results).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(test.results).map(([variantId, result]: [string, any]) => (
                      <div key={variantId} className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-center">
                          <p className="text-white font-medium">{variantId}</p>
                          <p className="text-2xl font-bold text-blue-400 mt-1">
                            {result.conversionRate?.toFixed(1) || 0}%
                          </p>
                          <p className="text-gray-400 text-xs">
                            {result.conversions || 0}/{result.views || 0} تبدیل
                          </p>
                          {result.revenue && (
                            <p className="text-green-400 text-xs mt-1">
                              {result.revenue.toLocaleString()} تومان
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!test.results || Object.keys(test.results).length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">هنوز داده‌ای وجود ندارد</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <a
              href="/admin/ab-testing"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
            >
              مشاهده همه تست‌ها
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Export analytics instance for use in other components
export { analytics as analyticsManager };