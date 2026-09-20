'use client';

import React, { useState, useEffect } from 'react';
import PromoBanners from './PromoBanners';

interface BannerPositionProps {
  position: string;
  className?: string;
}

const ConditionalPromoBanners: React.FC<BannerPositionProps> = ({ position, className = '' }) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPosition();
  }, [position]);

  const checkPosition = async () => {
    try {
      const response = await fetch('/api/admin/banner-position');
      if (response.ok) {
        const data = await response.json();
        setShouldShow(data.isActive && data.position === position);
      }
    } catch (error) {
      console.error('Error checking banner position:', error);
      setShouldShow(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // یا یک loading spinner کوچک
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <section className={`py-8 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PromoBanners />
      </div>
    </section>
  );
};

export default ConditionalPromoBanners;