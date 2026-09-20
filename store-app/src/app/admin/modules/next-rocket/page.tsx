/**
 * Next Rocket Module Page
 * صفحه ماژول Next Rocket در بخش Admin
 */

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const NextRocketDashboard = dynamic(
  () => import('@/modules/next-rocket/components/Dashboard'),
  { 
    ssr: false, 
    loading: () => (
      <div className="p-6 text-white flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    )
  }
);

export default function NextRocketPage() {
  return (
    <Suspense fallback={
      <div className="p-6 text-white flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <NextRocketDashboard />
    </Suspense>
  );
}
