'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStatusMessage } from '@/utils/zarinpal-messages';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('پرداخت ناموفق بود');

  useEffect(() => {
    const errorCode = searchParams.get('error');
    
    if (errorCode) {
      if (errorCode === 'invalid_authority') {
        setErrorMessage('کد تراکنش نامعتبر است');
      } else if (errorCode === 'payment_not_found') {
        setErrorMessage('اطلاعات پرداخت یافت نشد');
      } else if (errorCode === 'server_error') {
        setErrorMessage('خطای سرور رخ داده است');
      } else {
        const code = parseInt(errorCode);
        if (!isNaN(code)) {
          setErrorMessage(getStatusMessage(code));
        }
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {/* Error Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 mb-4">
          پرداخت ناموفق
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          {errorMessage}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/cart"
            className="block w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            تلاش مجدد
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all duration-300"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">در صورت بروز مشکل:</p>
          <Link
            href="/contact"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            تماس با پشتیبانی
          </Link>
        </div>
      </div>
    </div>
  );
}
