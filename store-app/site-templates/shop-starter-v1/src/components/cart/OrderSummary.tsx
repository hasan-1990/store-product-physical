'use client';

import { ArrowLeft } from 'lucide-react';
import { formatCartPrice } from '@/lib/cart';

type OrderSummaryProps = {
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onApplyPromo: () => void;
  onCheckout: () => void;
  checkoutDisabled?: boolean;
};

export function OrderSummary({
  itemCount,
  subtotal,
  discount,
  shippingCost,
  total,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  onCheckout,
  checkoutDisabled,
}: OrderSummaryProps) {
  return (
    <aside className="sticky top-28 space-y-6 lg:top-32">
      <div className="rounded-xl bg-surface-container-high p-6 shadow-soft md:p-8">
        <h2 className="mb-6 text-lg font-semibold text-on-surface">خلاصه سفارش</h2>

        <div className="space-y-4 text-sm text-on-surface-variant">
          <div className="flex justify-between">
            <span>قیمت کالاها ({itemCount.toLocaleString('fa-IR')})</span>
            <span>{formatCartPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>هزینه ارسال</span>
            <span>{shippingCost === 0 ? 'رایگان' : formatCartPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>تخفیف</span>
            <span>{formatCartPrice(discount)}</span>
          </div>

          <div className="border-t border-outline pt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider">کد تخفیف</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                placeholder="کد را وارد کنید"
                className="flex-grow rounded-lg border border-outline bg-surface px-3 py-2 text-sm focus:ring-1 focus:ring-secondary focus:outline-none"
              />
              <button
                type="button"
                onClick={onApplyPromo}
                className="rounded-lg bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:opacity-90"
              >
                اعمال
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-outline pt-6">
            <span className="text-lg font-semibold text-on-surface">مبلغ قابل پرداخت</span>
            <span className="font-display text-2xl text-on-surface md:text-[32px] md:leading-10">
              {formatCartPrice(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={checkoutDisabled}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface py-4 text-lg font-semibold text-surface transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {checkoutDisabled ? 'در حال ثبت سفارش...' : 'تکمیل و پرداخت نهایی'}
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <p className="mt-4 text-center text-[11px] text-on-surface-variant">
          با ثبت سفارش،{' '}
          <a href="#" className="underline">
            قوانین و مقررات
          </a>{' '}
          MUSE را پذیرفته‌اید.
        </p>
      </div>
    </aside>
  );
}
