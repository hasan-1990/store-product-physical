'use client';

import { CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import type { PaymentMethod } from '@/lib/cart';

type ShippingPaymentSectionProps = {
  paymentMethod: PaymentMethod;
  onPaymentChange: (method: PaymentMethod) => void;
};

export function ShippingPaymentSection({ paymentMethod, onPaymentChange }: ShippingPaymentSectionProps) {
  return (
    <section className="space-y-8 rounded-xl border border-outline/30 bg-white p-6 md:p-8">
      <h2 className="border-b border-outline pb-4 font-display text-2xl text-on-surface md:text-[32px] md:leading-10">
        اطلاعات ارسال
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">نام و نام خانوادگی</span>
          <input
            type="text"
            placeholder="مثلاً سارا احمدی"
            className="border-b border-outline bg-transparent py-2 text-sm transition focus:border-secondary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">شماره تماس</span>
          <input
            type="tel"
            dir="ltr"
            placeholder="۰۹۱۲۰۰۰۰۰۰۰"
            className="border-b border-outline bg-transparent py-2 text-left text-sm transition focus:border-secondary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">آدرس کامل پستی</span>
          <textarea
            rows={3}
            placeholder="استان، شهر، خیابان..."
            className="resize-none border-b border-outline bg-transparent py-2 text-sm transition focus:border-secondary focus:outline-none"
          />
        </label>
      </div>

      <h2 className="mt-8 border-b border-outline pb-4 font-display text-2xl text-on-surface md:text-[32px] md:leading-10">
        روش پرداخت
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label
          className={`relative flex cursor-pointer items-center rounded-lg border p-4 transition-all ${
            paymentMethod === 'online'
              ? 'border-secondary bg-primary-container/10'
              : 'border-outline hover:border-secondary'
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === 'online'}
            onChange={() => onPaymentChange('online')}
            className="text-secondary focus:ring-secondary"
          />
          <div className="mr-4">
            <p className="text-lg font-semibold text-on-surface">پرداخت آنلاین</p>
            <p className="text-sm text-on-surface-variant">با تمامی کارت‌های شتاب</p>
          </div>
          <CreditCard className="absolute left-4 h-6 w-6 text-secondary" strokeWidth={1.5} />
        </label>

        <label
          className={`relative flex cursor-pointer items-center rounded-lg border p-4 transition-all ${
            paymentMethod === 'cod'
              ? 'border-secondary bg-primary-container/10'
              : 'border-outline hover:border-secondary'
          }`}
        >
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === 'cod'}
            onChange={() => onPaymentChange('cod')}
            className="text-secondary focus:ring-secondary"
          />
          <div className="mr-4">
            <p className="text-lg font-semibold text-on-surface">پرداخت در محل</p>
            <p className="text-sm text-on-surface-variant">ویژه تهران و کرج</p>
          </div>
          <Wallet className="absolute left-4 h-6 w-6 text-on-surface-variant" strokeWidth={1.5} />
        </label>
      </div>
    </section>
  );
}

export function TrustBadge() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary-container/50 bg-primary-container/20 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary">
        <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface">ضمانت اصالت و بازگشت</p>
        <p className="text-xs text-on-surface-variant">۷ روز ضمانت بازگشت کالا</p>
      </div>
    </div>
  );
}
