'use client';

import { useState, useEffect } from 'react';

interface HydrationWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export default function HydrationWrapper({ 
  children, 
  fallback,
  className 
}: HydrationWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // اگر هنوز hydrate نشده، fallback نمایش داده می‌شود
  if (!isHydrated) {
    return fallback ? (
      <div className={className}>
        {fallback}
      </div>
    ) : null;
  }

  return <div className={className}>{children}</div>;
}