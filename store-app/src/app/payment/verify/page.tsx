'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentVerifyPage() {
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority) {
      router.push('/payment/failed?error=invalid_authority');
      return;
    }

    // API تایید پرداخت را صدا می‌زند
    fetch(`/api/payment/verify?Authority=${authority}&Status=${status}`)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        console.error('Payment verification error:', error);
        router.push('/payment/failed?error=server_error');
      });
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">در حال تایید پرداخت...</h2>
          <p className="text-gray-600">لطفاً صبر کنید</p>
        </div>
      </div>
    );
  }

  return null;
}
