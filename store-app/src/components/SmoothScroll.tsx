'use client';

import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    // اضافه کردن smooth scroll با CSS
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Auto-hide scrollbar functionality
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      document.body.classList.add('scrolling');
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = '';
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return null;
}
