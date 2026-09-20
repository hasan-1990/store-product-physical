'use client';

import { useState } from 'react';
import { DiscountCode, DiscountValidationResult } from '@/types/discount';

export const useDiscountCode = () => {
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [validationResult, setValidationResult] = useState<DiscountValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string>('');

  // Validate discount code
  const validateDiscountCode = async (
    code: string,
    userId: string,
    orderAmount: number,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): Promise<DiscountValidationResult> => {
    if (!code.trim()) {
      const result = { isValid: false, error: 'کد تخفیف الزامی است' };
      setValidationResult(result);
      setError(result.error!);
      return result;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/discount-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId,
          orderAmount,
          productIds,
          categoryIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data as DiscountValidationResult;
        setValidationResult(result);

        if (result.isValid && result.discountCode) {
          setAppliedDiscount(result.discountCode);
          setError('');
        } else {
          setAppliedDiscount(null);
          setError(result.error || 'کد تخفیف نامعتبر است');
        }

        return result;
      } else {
        const result = { isValid: false, error: data.error || 'خطا در اعتبارسنجی کد تخفیف' };
        setValidationResult(result);
        setError(result.error);
        setAppliedDiscount(null);
        return result;
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      const result = { isValid: false, error: 'خطا در اتصال به سرور' };
      setValidationResult(result);
      setError(result.error);
      setAppliedDiscount(null);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  // Apply discount code
  const applyDiscountCode = async (
    code: string,
    userId: string,
    orderAmount: number,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): Promise<boolean> => {
    const result = await validateDiscountCode(code, userId, orderAmount, productIds, categoryIds);
    return result.isValid;
  };

  // Remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setValidationResult(null);
    setError('');
  };

  // Calculate final amount with discount
  const calculateFinalAmount = (originalAmount: number): number => {
    if (!appliedDiscount || !validationResult?.isValid) {
      return originalAmount;
    }

    return validationResult.finalAmount || originalAmount;
  };

  // Get discount amount
  const getDiscountAmount = (): number => {
    if (!appliedDiscount || !validationResult?.isValid) {
      return 0;
    }

    return validationResult.discountAmount || 0;
  };

  // Format discount display
  const formatDiscountDisplay = (): string => {
    if (!appliedDiscount) return '';

    if (appliedDiscount.type === 'percentage') {
      return `${appliedDiscount.value}% تخفیف`;
    } else {
      return `${appliedDiscount.value.toLocaleString()} تومان تخفیف`;
    }
  };

  return {
    appliedDiscount,
    validationResult,
    isValidating,
    error,
    validateDiscountCode,
    applyDiscountCode,
    removeDiscount,
    calculateFinalAmount,
    getDiscountAmount,
    formatDiscountDisplay,
  };
};

// Hook for managing discount codes in admin panel
export const useDiscountManagement = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch discount codes
  const fetchDiscountCodes = async (filters?: any, page = 1, limit = 20) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/discount-codes?${params}`);
      const data = await response.json();

      if (data.success) {
        setDiscountCodes(data.data);
        return {
          data: data.data,
          pagination: data.pagination,
        };
      } else {
        setError(data.error || 'خطا در دریافت کدهای تخفیف');
        return null;
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      setError('خطا در اتصال به سرور');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create discount code
  const createDiscountCode = async (discountData: any): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'خطا در ایجاد کد تخفیف');
        return false;
      }
    } catch (error) {
      console.error('Error creating discount code:', error);
      setError('خطا در اتصال به سرور');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update discount code
  const updateDiscountCode = async (id: string, discountData: any): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/discount-codes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...discountData }),
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'خطا در به‌روزرسانی کد تخفیف');
        return false;
      }
    } catch (error) {
      console.error('Error updating discount code:', error);
      setError('خطا در اتصال به سرور');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete discount codes
  const deleteDiscountCodes = async (ids: string[]): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('id', id));

      const response = await fetch(`/api/admin/discount-codes?${params}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'خطا در حذف کدهای تخفیف');
        return false;
      }
    } catch (error) {
      console.error('Error deleting discount codes:', error);
      setError('خطا در اتصال به سرور');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generate unique code
  const generateUniqueCode = async (length = 8): Promise<string | null> => {
    try {
      const response = await fetch(`/api/admin/discount-codes/generate?length=${length}`);
      const data = await response.json();

      if (data.success) {
        return data.code;
      } else {
        setError(data.error || 'خطا در تولید کد');
        return null;
      }
    } catch (error) {
      console.error('Error generating code:', error);
      setError('خطا در اتصال به سرور');
      return null;
    }
  };

  return {
    discountCodes,
    loading,
    error,
    fetchDiscountCodes,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCodes,
    generateUniqueCode,
  };
};