'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const completeOrder = async () => {
      if (!orderId) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error('Error completing order:', error);
      } finally {
        setLoading(false);
      }
    };

    completeOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-12 h-12 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">در حال تکمیل سفارش...</p>
        </div>
      </div>
    );
  }

  const hasDigitalProducts = order?.items?.some((item: any) => 
    item.productType === 'DIGITAL' || item.productType === 'digital'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg transform hover:scale-105 transition-transform">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">پرداخت موفق!</h1>
            <p className="text-xl text-gray-200">سفارش شما با موفقیت ثبت شد</p>
          </div>
          {order && (
            <div className="bg-purple-900/30 backdrop-blur-md rounded-2xl p-6 mb-6 border border-purple-400/20">
              <div className="flex justify-between items-center mb-6 pb-5 border-b border-white/10">
                <span className="text-gray-300 text-lg">شماره سفارش:</span>
                <span className="text-white font-mono font-bold text-xl">{order.orderNumber}</span>
              </div>
              <div className="space-y-4 mb-5">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{item.productType === 'DIGITAL' ? '📥' : '📦'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-lg truncate">{item.name}</p>
                      <p className="text-sm text-gray-300">{item.productType === 'DIGITAL' ? 'محصول دیجیتال' : 'محصول فیزیکی'} • تعداد {item.quantity}</p>
                    </div>
                    <span className="text-white font-bold text-lg whitespace-nowrap">{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</span>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-xl p-5 border border-purple-400/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-200 font-bold text-xl">مجموع:</span>
                  <span className="text-white font-bold text-2xl">{order.totalAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Link href="/profile/orders" className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl text-center font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg">
              <span className="text-2xl">📋</span>
              <span>مشاهده سفارشات من</span>
            </Link>
            <Link href="/" className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white rounded-2xl text-center font-bold text-lg transition-all transform hover:scale-[1.02]">
              <span className="text-2xl">🏠</span>
              <span>بازگشت به صفحه اصلی</span>
            </Link>
          </div>
          {order?.contactInfo?.email && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-200 flex items-center justify-center gap-2">
                <span className="text-xl">✉️</span>
                <span>ایمیل تأیید سفارش به <strong className="text-white">{order.contactInfo.email}</strong> ارسال شد</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
