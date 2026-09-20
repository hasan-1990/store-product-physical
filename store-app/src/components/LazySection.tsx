'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LazySectionProps {
  loader: () => React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  once?: boolean;
}

const LazySection: React.FC<LazySectionProps> = ({
  loader,
  placeholder = null,
  rootMargin = '0px 0px 320px 0px',
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (once && isVisible) {
      return;
    }

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              currentObserver.disconnect();
            }
          }
        });
      },
      {
        rootMargin,
      }
    );

    const node = containerRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
      observer.disconnect();
    };
  }, [isVisible, once, rootMargin]);

  return <div ref={containerRef}>{isVisible ? loader() : placeholder}</div>;
};

export default LazySection;
