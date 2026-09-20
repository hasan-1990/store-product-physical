'use client';

import { useState } from 'react';
import { useDiscountCode } from '@/hooks/useDiscountCode';

interface DiscountCodeInputProps {
  userId: string;
  orderAmount: number;
  productIds?: string[];
  categoryIds?: string[];
  onDiscountApplied?: (discountAmount: number, finalAmount: number) => void;
  onDiscountRemoved?: () => void;
}

const DiscountCodeInput = ({
  userId,
  orderAmount,
  productIds = [],
  categoryIds = [],
  onDiscountApplied,
  onDiscountRemoved,
}: DiscountCodeInputProps) => {
  const [discountCode, setDiscountCode] = useState('');
  const {
    appliedDiscount,
    isValidating,
    error,
    applyDiscountCode,
    removeDiscount,
    getDiscountAmount,
    formatDiscountDisplay,
  } = useDiscountCode();

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    const success = await applyDiscountCode(
      discountCode,
      userId,
      orderAmount,
      productIds,
      categoryIds
    );

    if (success) {
      const discountAmount = getDiscountAmount();
      const finalAmount = orderAmount - discountAmount;
      onDiscountApplied?.(discountAmount, finalAmount);
    }
  };

  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountCode('');
    onDiscountRemoved?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyDiscount();
    }
  };

  return (
    <div className="space-y-4">
      {/* Discount Code Input */}
      {!appliedDiscount && (
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            کد تخفیف دارید؟
          </h3>

          <div className="flex gap-3">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="کد تخفیف خود را وارد کنید"
              className="flex-1 px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
            />
            <button
              onClick={handleApplyDiscount}
              disabled={isValidating || !discountCode.trim()}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  بررسی...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  اعمال
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Applied Discount Display */}
      {appliedDiscount && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/30 rounded-lg">
                <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-green-300 font-semibold">کد تخفیف اعمال شد!</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-white font-mono bg-green-700/30 px-2 py-1 rounded text-sm">
                    {appliedDiscount.code}
                  </span>
                  <span className="text-green-200 text-sm">
                    {formatDiscountDisplay()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRemoveDiscount}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
              title="حذف کد تخفیف"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {appliedDiscount.description && (
            <p className="text-green-200/80 text-sm mt-2 pr-10">
              {appliedDiscount.description}
            </p>
          )}

          {/* Discount breakdown */}
          <div className="mt-4 pt-3 border-t border-green-500/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-200">مبلغ اصلی:</span>
              <span className="text-white">{orderAmount.toLocaleString()} تومان</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-green-200">تخفیف:</span>
              <span className="text-green-300 font-medium">
                -{getDiscountAmount().toLocaleString()} تومان
              </span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold mt-2 pt-2 border-t border-green-500/20">
              <span className="text-green-200">مبلغ نهایی:</span>
              <span className="text-green-300">
                {(orderAmount - getDiscountAmount()).toLocaleString()} تومان
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Discount suggestions (if any) */}
      {!appliedDiscount && !error && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-blue-300 text-sm">
              <p className="font-medium mb-1">نکته:</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• کدهای تخفیف حساس به حروف کوچک و بزرگ هستند</li>
                <li>• برخی کدها ممکن است محدودیت زمانی یا مبلغی داشته باشند</li>
                <li>• در صورت وجود مشکل، با پشتیبانی تماس بگیرید</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;