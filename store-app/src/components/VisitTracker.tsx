'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for admin and API routes
    const excludePaths = ['/admin', '/api', '/_next'];
    const shouldTrack = !excludePaths.some(path => pathname.startsWith(path));

    if (shouldTrack) {
      // Track visit via API call
      fetch('/api/track-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pathname,
          timestamp: new Date().toISOString(),
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
        }),
      }).catch(error => {
        console.error('Failed to track visit:', error);
      });
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}