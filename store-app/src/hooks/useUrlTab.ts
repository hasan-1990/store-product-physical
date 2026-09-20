'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Hook internal که searchParams استفاده می‌کند
function useUrlTabInternal(defaultTab: string, paramName = 'tab') {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // دریافت tab از URL یا استفاده از default
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return searchParams.get(paramName) || defaultTab;
    }
    return defaultTab;
  });

  // تابع تغییر tab که URL را هم به‌روزرسانی می‌کند
  const setActiveTab = (newTab: string) => {
    setActiveTabState(newTab);
    
    // به‌روزرسانی URL
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set(paramName, newTab);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // تغییر URL بدون refresh
    router.replace(`${window.location.pathname}${query}`, { scroll: false });
  };

  // همگام‌سازی با تغییرات URL
  useEffect(() => {
    const urlTab = searchParams.get(paramName);
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [searchParams, paramName, activeTab]);

  return [activeTab, setActiveTab] as const;
}

// Hook خارجی با fallback
export function useUrlTab(defaultTab: string, paramName = 'tab') {
  // Fallback state
  const [fallbackTab, setFallbackTab] = useState(defaultTab);
  
  try {
    return useUrlTabInternal(defaultTab, paramName);
  } catch (error) {
    // Fallback to simple state management if not wrapped in Suspense
    return [fallbackTab, setFallbackTab] as const;
  }
}
