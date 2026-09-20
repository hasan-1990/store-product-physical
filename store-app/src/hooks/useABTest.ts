'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // درصد نمایش (0-100)
  config?: Record<string, any>; // تنظیمات اضافی برای variant
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    percentage: number; // درصد کاربرانی که در تست شرکت می‌کنند
    conditions?: {
      newUsers?: boolean;
      returningUsers?: boolean;
      minPageViews?: number;
      countries?: string[];
      devices?: ('desktop' | 'mobile' | 'tablet')[];
    };
  };
  goals: {
    primary: string; // هدف اصلی (مثل 'purchase', 'signup')
    secondary?: string[]; // اهداف فرعی
  };
  results?: {
    [variantId: string]: {
      views: number;
      conversions: number;
      conversionRate: number;
      revenue?: number;
    };
  };
}

interface ABTestAssignment {
  testId: string;
  variantId: string;
  assignedAt: number;
}

export interface UseABTestReturn {
  // دریافت variant فعال برای یک تست
  getVariant: (testId: string) => string | null;
  
  // بررسی اینکه آیا کاربر در تست خاصی شرکت دارد
  isInTest: (testId: string) => boolean;
  
  // ثبت conversion برای تست
  trackConversion: (testId: string, goal: string, value?: number) => void;
  
  // دریافت تمام تست‌های فعال
  getActiveTests: () => ABTest[];
  
  // assignment‌های کاربر
  assignments: ABTestAssignment[];
  
  // بارگذاری مجدد تست‌ها
  refreshTests: () => Promise<void>;
  
  // آمار loading
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'ab_test_assignments';
const TESTS_CACHE_KEY = 'ab_tests_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 دقیقه

export function useABTest(): UseABTestReturn {
  const { trackCustomEvent } = useAnalytics();
  const [assignments, setAssignments] = useState<ABTestAssignment[]>([]);
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // بارگذاری assignments از localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAssignments(JSON.parse(saved));
      } catch (err) {
        console.error('خطا در بارگذاری AB Test assignments:', err);
      }
    }
  }, []);

  // ذخیره assignments در localStorage
  const saveAssignments = useCallback((newAssignments: ABTestAssignment[]) => {
    setAssignments(newAssignments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAssignments));
  }, []);

  // بارگذاری تست‌های فعال
  const loadActiveTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // چک کردن cache
      const cached = localStorage.getItem(TESTS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setActiveTests(data);
          setLoading(false);
          return;
        }
      }

      // فراخوانی API
      const response = await fetch('/api/admin/ab-tests?status=running');
      if (!response.ok) {
        throw new Error('خطا در دریافت تست‌ها');
      }

      const result = await response.json();
      if (result.success) {
        setActiveTests(result.tests || []);
        
        // ذخیره در cache
        localStorage.setItem(TESTS_CACHE_KEY, JSON.stringify({
          data: result.tests || [],
          timestamp: Date.now()
        }));
      } else {
        throw new Error(result.error || 'خطا در دریافت تست‌ها');
      }
    } catch (err) {
      console.error('خطا در بارگذاری AB Tests:', err);
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
      
      // در صورت خطا، تست‌های نمونه برمی‌گردانیم
      setActiveTests([
        {
          id: 'button-color-test',
          name: 'تست رنگ دکمه خرید',
          description: 'آزمایش تأثیر رنگ دکمه بر نرخ تبدیل',
          status: 'running',
          variants: [
            { id: 'control', name: 'آبی (کنترل)', weight: 33 },
            { id: 'red', name: 'قرمز', weight: 33 },
            { id: 'green', name: 'سبز', weight: 34 }
          ],
          goals: { primary: 'add_to_cart' },
          results: {
            'control': { views: 1250, conversions: 87, conversionRate: 6.96, revenue: 174000 },
            'red': { views: 1189, conversions: 103, conversionRate: 8.66, revenue: 206000 },
            'green': { views: 1211, conversions: 92, conversionRate: 7.59, revenue: 184000 }
          }
        },
        {
          id: 'header-layout-test',
          name: 'تست چیدمان هدر',
          description: 'مقایسه دو نوع چیدمان مختلف برای هدر سایت',
          status: 'running',
          variants: [
            { id: 'control', name: 'چیدمان فعلی', weight: 50 },
            { id: 'compact', name: 'چیدمان فشرده', weight: 50 }
          ],
          goals: { primary: 'navigation_click' },
          results: {
            'control': { views: 2085, conversions: 445, conversionRate: 21.34, revenue: 0 },
            'compact': { views: 2065, conversions: 468, conversionRate: 22.66, revenue: 0 }
          }
        },
        {
          id: 'pricing-display-test',
          name: 'تست نمایش قیمت',
          description: 'مقایسه نمایش ساده در مقابل تاکید بر تخفیف',
          status: 'running',
          variants: [
            { id: 'control', name: 'نمایش ساده', weight: 50 },
            { id: 'discount', name: 'تاکید بر تخفیف', weight: 50 }
          ],
          goals: { primary: 'add_to_cart' },
          results: {
            'control': { views: 1432, conversions: 98, conversionRate: 6.84, revenue: 196000 },
            'discount': { views: 1368, conversions: 127, conversionRate: 9.28, revenue: 254000 }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // بارگذاری اولیه
  useEffect(() => {
    loadActiveTests();
  }, [loadActiveTests]);

  // تخصیص کاربر به variant
  const assignUserToVariant = useCallback((test: ABTest): string => {
    // چک کردن شرایط هدف‌گذاری
    if (test.targetAudience) {
      const { percentage, conditions } = test.targetAudience;
      
      // بررسی درصد شرکت
      if (Math.random() * 100 > percentage) {
        return 'excluded'; // خارج از تست
      }

      // بررسی شرایط اضافی (در آینده می‌توان گسترش داد)
      if (conditions) {
        // مثال: بررسی نوع دستگاه
        if (conditions.devices) {
          const userAgent = navigator.userAgent.toLowerCase();
          const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
          const isTablet = /tablet|ipad/.test(userAgent);
          
          let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
          if (isTablet) deviceType = 'tablet';
          else if (isMobile) deviceType = 'mobile';
          
          if (!conditions.devices.includes(deviceType)) {
            return 'excluded';
          }
        }
      }
    }

    // تخصیص تصادفی بر اساس weight
    let random = Math.random() * 100;
    for (const variant of test.variants) {
      if (random <= variant.weight) {
        return variant.id;
      }
      random -= variant.weight;
    }

    // fallback به اولین variant
    return test.variants[0]?.id || 'control';
  }, []);

  // دریافت variant فعال
  const getVariant = useCallback((testId: string): string | null => {
    // جستجوی assignment موجود
    const existing = assignments.find(a => a.testId === testId);
    if (existing) {
      return existing.variantId === 'excluded' ? null : existing.variantId;
    }

    // جستجوی تست
    const test = activeTests.find(t => t.id === testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // تخصیص جدید
    const variantId = assignUserToVariant(test);
    const newAssignment: ABTestAssignment = {
      testId,
      variantId,
      assignedAt: Date.now()
    };

    const newAssignments = [...assignments, newAssignment];
    saveAssignments(newAssignments);

    // ردیابی تخصیص
    trackCustomEvent('ab_test_assigned', 'ab_testing', `${testId}:${variantId}`);

    return variantId === 'excluded' ? null : variantId;
  }, [assignments, activeTests, assignUserToVariant, saveAssignments, trackCustomEvent]);

  // بررسی شرکت در تست
  const isInTest = useCallback((testId: string): boolean => {
    const variant = getVariant(testId);
    return variant !== null;
  }, [getVariant]);

  // ردیابی conversion
  const trackConversion = useCallback((testId: string, goal: string, value?: number) => {
    const variant = getVariant(testId);
    if (!variant) return;

    // ردیابی در Analytics
    trackCustomEvent('ab_test_conversion', 'ab_testing', `${testId}:${variant}:${goal}`, value);

    // ارسال به API برای ذخیره در دیتابیس
    fetch('/api/admin/ab-tests/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        variantId: variant,
        goal,
        value,
        timestamp: Date.now()
      })
    }).catch(err => console.error('خطا در ذخیره conversion:', err));
  }, [getVariant, trackCustomEvent]);

  return {
    getVariant,
    isInTest,
    trackConversion,
    getActiveTests: () => activeTests,
    assignments,
    refreshTests: loadActiveTests,
    loading,
    error
  };
}