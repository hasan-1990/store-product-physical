'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

export default function WebVitals() {
  useEffect(() => {
    // فقط در production و اگر performance API موجود باشه
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && 'performance' in window) {
      
      const vitalsUrl = '/api/analytics/web-vitals';
      
      const sendToAnalytics = ({ name, delta, value, id }: any) => {
        // ارسال به API analytics
        fetch(vitalsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            value,
            delta,
            id,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        }).catch((err) => {
          console.error('Error sending web vitals:', err);
        });
      };

      // Core Web Vitals - INP جایگزین FID شده
      onCLS(sendToAnalytics);
      onINP(sendToAnalytics); // INP (Interaction to Next Paint) جایگزین FID شده
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    }
  }, []);

  return null;
}