'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CheckoutSteps } from '@/components/cart/CheckoutSteps';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { ShippingPaymentSection, TrustBadge } from '@/components/cart/ShippingPaymentSection';
import { useCart } from '@/components/providers/CartProvider';
import {
  getCartItemCount,
  getCartSubtotal,
  type PaymentMethod,
} from '@/lib/cart';

export function CartPageView() {
  const { items, loading, updateQuantity, removeItem, refresh } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');

  const itemCount = getCartItemCount(items);
  const subtotal = getCartSubtotal(items);
  const shippingCost = 0;
  const total = Math.max(0, subtotal + shippingCost - discount);
  const isEmpty = items.length === 0;

  async function applyPromo() {
    const normalized = promoCode.trim();
    if (!normalized) {
      setDiscount(0);
      setPromoMessage('کد تخفیف را وارد کنید.');
      return;
    }

    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(normalized)}`);
      const json = await res.json();
      if (json.valid && json.discount > 0) {
        setDiscount(json.discount);
        setPromoMessage('کد تخفیف با موفقیت اعمال شد.');
      } else {
        setDiscount(0);
        setPromoMessage('کد تخفیف معتبر نیست.');
      }
    } catch {
      setDiscount(0);
      setPromoMessage('خطا در بررسی کد تخفیف.');
    }
  }

  async function handleCheckout() {
    if (isEmpty) return;
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      alert('لطفاً نام، شماره تماس و آدرس را وارد کنید.');
      return;
    }

    setCheckingOut(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          address,
          paymentMethod,
          promoCode,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(`سفارش ${json.orderNumber} با موفقیت ثبت شد.`);
        await refresh();
        setCustomerName('');
        setCustomerPhone('');
        setAddress('');
        setPromoCode('');
        setDiscount(0);
      } else {
        alert(json.error || 'خطا در ثبت سفارش');
      }
    } finally {
      setCheckingOut(false);
    }
  }

  const emptyState = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low py-20 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-on-surface-variant" strokeWidth={1.25} />
        <h2 className="font-display text-2xl text-on-surface">سبد خرید شما خالی است</h2>
        <p className="mt-2 text-sm text-on-surface-variant">محصولات مورد علاقه خود را به سبد اضافه کنید.</p>
        <Link href="/products" className="btn-primary mt-6">
          مشاهده محصولات
        </Link>
      </div>
    ),
    [],
  );

  if (loading) {
    return (
      <div className="page-container py-32 text-center text-on-surface-variant">در حال بارگذاری سبد خرید...</div>
    );
  }

  return (
    <div className="page-container pb-24 pt-28 md:pt-32">
      <header className="mb-12 text-center">
        <h1 className="page-title mb-2">سبد خرید شما</h1>
        <p className="text-sm text-on-surface-variant">
          اقلام انتخابی خود را مرور کنید و برای نهایی کردن سفارش به مرحله پرداخت بروید.
        </p>
      </header>

      {isEmpty ? (
        emptyState
      ) : (
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <CheckoutSteps currentStep={1} />

            <section className="space-y-6 rounded-xl bg-surface-container-low p-6 md:p-8">
              <h2 className="text-lg font-semibold text-on-surface">لیست محصولات</h2>
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantityChange={(id, quantity) => void updateQuantity(id, quantity)}
                  onRemove={(id) => void removeItem(id)}
                />
              ))}
            </section>

            <section className="space-y-4 rounded-xl bg-surface-container-low p-6 md:p-8">
              <h2 className="text-lg font-semibold text-on-surface">اطلاعات تحویل</h2>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="شماره تماس"
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3"
                dir="ltr"
              />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="آدرس کامل"
                rows={3}
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3"
              />
            </section>

            <ShippingPaymentSection paymentMethod={paymentMethod} onPaymentChange={setPaymentMethod} />
          </div>

          <div className="lg:col-span-4">
            <OrderSummary
              itemCount={itemCount}
              subtotal={subtotal}
              discount={discount}
              shippingCost={shippingCost}
              total={total}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromo={applyPromo}
              onCheckout={handleCheckout}
              checkoutDisabled={checkingOut}
            />
            {promoMessage && (
              <p className="mt-3 text-center text-xs text-on-surface-variant">{promoMessage}</p>
            )}
            <div className="mt-6">
              <TrustBadge />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
