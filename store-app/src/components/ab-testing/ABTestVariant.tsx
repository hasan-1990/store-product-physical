
'use client';
import React, { ReactNode } from 'react';
import { useABTestContext } from '@/contexts/ABTestContext';

interface ABTestVariantProps {
  testId: string;
  variant: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * کامپوننت برای نمایش محتوای مخصوص هر variant در A/B Test
 * 
 * @example
 * <ABTestVariant testId="button-color-test" variant="red">
 *   <button className="bg-red-500">خرید کنید</button>
 * </ABTestVariant>
 * 
 * <ABTestVariant testId="button-color-test" variant="control">
 *   <button className="bg-blue-500">خرید کنید</button>
 * </ABTestVariant>
 */
export function ABTestVariant({ testId, variant, children, fallback = null }: ABTestVariantProps) {
  const { getVariant, loading } = useABTestContext();

  // در حین بارگذاری، محتوای پیش‌فرض را نمایش می‌دهیم
  if (loading) {
    return <>{fallback}</>;
  }

  const activeVariant = getVariant(testId);

  // اگر کاربر در این تست شرکت ندارد یا variant مطابقت ندارد
  if (activeVariant !== variant) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface ABTestWrapperProps {
  testId: string;
  variants: Record<string, ReactNode>;
  fallback?: ReactNode;
}

/**
 * کامپوننت Wrapper برای مدیریت آسان‌تر variant های متعدد
 * 
 * @example
 * <ABTestWrapper 
 *   testId="button-color-test"
 *   variants={{
 *     control: <button className="bg-blue-500">خرید کنید</button>,
 *     red: <button className="bg-red-500">خرید کنید</button>,
 *     green: <button className="bg-green-500">خرید کنید</button>
 *   }}
 *   fallback={<button className="bg-gray-500">خرید کنید</button>}
 * />
 */
export function ABTestWrapper({ testId, variants, fallback = null }: ABTestWrapperProps) {
  const { getVariant, loading } = useABTestContext();

  if (loading) {
    return <>{fallback}</>;
  }

  const activeVariant = getVariant(testId);

  if (!activeVariant || !variants[activeVariant]) {
    return <>{fallback}</>;
  }

  return <>{variants[activeVariant]}</>;
}

interface ABTestConditionalProps {
  testId: string;
  children: (variant: string | null, isInTest: boolean) => ReactNode;
}

/**
 * کامپوننت انعطاف‌پذیر برای render conditional بر اساس A/B Test
 * 
 * @example
 * <ABTestConditional testId="button-color-test">
 *   {(variant, isInTest) => (
 *     <button 
 *       className={`${
 *         variant === 'red' ? 'bg-red-500' : 
 *         variant === 'green' ? 'bg-green-500' : 
 *         'bg-blue-500'
 *       } px-4 py-2 text-white rounded`}
 *       onClick={() => {
 *         if (isInTest) {
 *           // ردیابی کلیک برای A/B test
 *           trackConversion(testId, 'button_click');
 *         }
 *         // عملکرد عادی دکمه
 *       }}
 *     >
 *       خرید کنید
 *     </button>
 *   )}
 * </ABTestConditional>
 */
export function ABTestConditional({ testId, children }: ABTestConditionalProps) {
  const { getVariant, isInTest, loading } = useABTestContext();

  if (loading) {
    return <>{children(null, false)}</>;
  }

  const variant = getVariant(testId);
  const inTest = isInTest(testId);

  return <>{children(variant, inTest)}</>;
}

// Hook برای استفاده آسان‌تر در کامپوننت‌های functional
export function useABTestVariant(testId: string) {
  const { getVariant, isInTest, trackConversion, loading } = useABTestContext();
  
  return {
    variant: loading ? null : getVariant(testId),
    isInTest: loading ? false : isInTest(testId),
    trackConversion: (goal: string, value?: number) => trackConversion(testId, goal, value),
    loading
  };
}