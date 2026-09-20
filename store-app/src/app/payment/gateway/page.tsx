'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentGatewayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);

  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // شبیه‌سازی صفحه درگاه بانکی
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // در محیط واقعی، کاربر در این صفحه اطلاعات کارت را وارد می‌کند
          // و بعد از پرداخت موفق، به verify هدایت می‌شود
          
          // فعلاً مستقیماً به صفحه تأیید می‌بریم (شبیه‌سازی پرداخت موفق)
          router.push(`/payment/success?orderId=${orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setLoading(false);

    return () => clearInterval(timer);
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-5xl">💳</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          درگاه پرداخت بانکی
        </h1>

        <p className="text-gray-300 mb-6">
          این یک صفحه شبیه‌سازی شده است. در محیط واقعی، شما به درگاه بانک هدایت می‌شوید.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">شماره سفارش:</span>
            <span className="text-white font-mono">{orderId?.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">مبلغ قابل پرداخت:</span>
            <span className="text-white font-bold text-xl">
              {Number(amount).toLocaleString('fa-IR')} تومان
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-white">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>در حال اتصال به بانک...</span>
          </div>
        ) : (
          <div className="text-white">
            <p className="text-lg mb-2">شبیه‌سازی پرداخت موفق</p>
            <p className="text-sm text-gray-300">
              هدایت خودکار در {countdown} ثانیه...
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-400">
            🔒 این تراکنش توسط سیستم امن بانکی محافظت می‌شود
          </p>
        </div>
      </div>
    </div>
  );
}
