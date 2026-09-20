'use client';

import { useState, useEffect, Suspense } from 'react';
import AboutPageManager from '@/components/admin/AboutPageManager';

const AboutPageAdminContent = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // شبیه‌سازی بارگذاری
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* About Page Manager */}
      <AboutPageManager />
    </div>
  );
};

const AboutPageAdmin = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <AboutPageAdminContent />
    </Suspense>
  );
};

export default AboutPageAdmin;