'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function HomePageAnalytics() {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const timer = setTimeout(() => trackPageView(), 100);
    return () => clearTimeout(timer);
  }, [trackPageView]);

  return null;
}
