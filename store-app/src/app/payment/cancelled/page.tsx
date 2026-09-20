'use client';

import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {/* Warning Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-4">
          پرداخت لغو شد
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8">
          شما پرداخت را لغو کردید. هیچ مبلغی از حساب شما کسر نشده است.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/cart"
            className="block w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-2xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            بازگشت به سبد خرید
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all duration-300"
          >
            ادامه خرید
          </Link>
        </div>
      </div>
    </div>
  );
}
