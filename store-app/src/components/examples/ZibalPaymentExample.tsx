/**
 * نمونه کامپوننت React برای پرداخت با Zibal
 * مثال کاربردی استفاده از درگاه پرداخت
 */

'use client';

import { useState } from 'react';

export default function ZibalPaymentExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ایجاد درخواست پرداخت
   */
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ ایجاد درخواست پرداخت
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: `ORD-${Date.now()}`, // شماره سفارش یکتا
          amount: 50000, // 5,000 تومان = 50,000 ریال
          description: 'خرید محصول نمونه',
          mobile: '09123456789',
          gateway: 'zibal', // یا 'zarinpal' یا حذف کنید برای انتخاب خودکار
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'خطا در ایجاد درخواست پرداخت');
      }

      // 2️⃣ هدایت به درگاه پرداخت
      console.log('Payment URL:', data.data.paymentUrl);
      console.log('Track ID:', data.data.trackId);
      console.log('Gateway:', data.data.gateway);

      // هدایت کاربر به صفحه پرداخت
      window.location.href = data.data.paymentUrl;

    } catch (err) {
      console.error('Payment Error:', err);
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  };

  /**
   * پرداخت با انتخاب درگاه
   */
  const handlePaymentWithGateway = async (gateway: 'zibal' | 'zarinpal') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `ORD-${Date.now()}`,
          amount: 100000, // 10,000 تومان
          description: 'خرید محصول',
          gateway, // انتخاب درگاه
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.paymentUrl;
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        نمونه پرداخت آنلاین
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* پرداخت با درگاه پیش‌فرض */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">پرداخت سریع</h3>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'در حال پردازش...' : 'پرداخت 5,000 تومان'}
        </button>
      </div>

      {/* انتخاب درگاه */}
      <div>
        <h3 className="text-lg font-semibold mb-3">انتخاب درگاه پرداخت</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePaymentWithGateway('zibal')}
            disabled={loading}
            className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <div className="text-sm">Zibal</div>
            <div className="text-xs">زیبال</div>
          </button>

          <button
            onClick={() => handlePaymentWithGateway('zarinpal')}
            disabled={loading}
            className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            <div className="text-sm">ZarinPal</div>
            <div className="text-xs">زرین‌پال</div>
          </button>
        </div>
      </div>

      {/* راهنما */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <p className="mb-2">
          <strong>نکته:</strong> برای تست از merchant "zibal" استفاده کنید.
        </p>
        <p>
          پس از پرداخت، به صفحه تایید هدایت می‌شوید.
        </p>
      </div>
    </div>
  );
}

/**
 * مثال استفاده در API Route (Server-Side)
 */
export async function createPaymentExample() {
  const response = await fetch('/api/payment/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: 'ORD-123',
      amount: 50000,
      description: 'خرید محصول',
      mobile: '09123456789',
      email: 'user@example.com',
      gateway: 'zibal',
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    return {
      paymentUrl: data.data.paymentUrl,
      trackId: data.data.trackId,
      gateway: data.data.gateway,
    };
  } else {
    throw new Error(data.error);
  }
}

/**
 * مثال استفاده با فرم سفارش
 */
export function CheckoutFormExample() {
  const [formData, setFormData] = useState({
    amount: 50000,
    mobile: '',
    email: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `ORD-${Date.now()}`,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ذخیره اطلاعات در localStorage قبل از redirect
        localStorage.setItem('lastPayment', JSON.stringify({
          trackId: data.data.trackId,
          amount: formData.amount,
          timestamp: new Date().toISOString(),
        }));

        // هدایت به درگاه
        window.location.href = data.data.paymentUrl;
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('خطا در ارتباط با سرور');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">مبلغ (ریال)</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
          min="1000"
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">شماره موبایل</label>
        <input
          type="tel"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          pattern="09[0-9]{9}"
          placeholder="09123456789"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ایمیل</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">توضیحات</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        پرداخت {(formData.amount / 10).toLocaleString('fa-IR')} تومان
      </button>
    </form>
  );
}
