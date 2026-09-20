'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
  orderId: string;
  totalAmount: number;
  orderItems: any[];
}

export default function CheckoutForm({ orderId, totalAmount, orderItems }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
  });

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // اعتبارسنجی
      if (!formData.mobile && !formData.email) {
        setError('لطفاً حداقل شماره موبایل یا ایمیل را وارد کنید');
        setLoading(false);
        return;
      }

      // ارسال درخواست پرداخت
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: totalAmount, // مبلغ به ریال
          description: `پرداخت سفارش #${orderId}`,
          mobile: formData.mobile,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
      }

      // هدایت به صفحه پرداخت زرین‌پال
      window.location.href = data.data.paymentUrl;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'خطا در پردازش پرداخت');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      {/* Order Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="space-y-3 mb-4">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="text-sm text-gray-400">× {item.quantity}</span>
                </div>
                <span className="font-medium">
                  {(item.price * item.quantity).toLocaleString('fa-IR')} ریال
                </span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">جمع کل:</span>
              <span className="text-2xl font-bold text-purple-600">
                {totalAmount.toLocaleString('fa-IR')} ریال
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 text-left">
              ≈ {(totalAmount / 10).toLocaleString('fa-IR')} تومان
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">اطلاعات تماس</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="09123456789"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ایمیل (اختیاری)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-600 font-medium text-center">{error}</p>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            در حال اتصال به درگاه پرداخت...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            پرداخت امن با زرین‌پال
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>پرداخت از طریق درگاه امن زرین‌پال</span>
      </div>
    </div>
  );
}
