'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  description?: string;
  position: 'left' | 'right';
}

interface PromoBannersData {
  leftBanner: BannerData;
  rightBanner: BannerData;
}

interface PromoBannerProps {
  className?: string;
}

const PromoBanners: React.FC<PromoBannerProps> = ({ className = '' }) => {
  const [bannersData, setBannersData] = useState<PromoBannersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBannersData();
  }, []);

  const fetchBannersData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/promo-banner');
      
      if (!response.ok) {
        throw new Error('Failed to fetch banners data');
      }
      
      const data = await response.json();
      console.log('Banners data received:', data); // برای دیباگ
      setBannersData(data);
    } catch (err) {
      console.error('Error fetching banners data:', err);
      setError('خطا در بارگذاری بنرهای تبلیغاتی');
    } finally {
      setLoading(false);
    }
  };

  // در حالت لودینگ
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full h-[283px] bg-gray-200 animate-pulse rounded-lg"></div>
            <div className="w-full h-[283px] bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // در صورت خطا یا عدم وجود داده
  if (error || !bannersData) {
    console.log('Banners not showing - error:', error, 'bannersData:', bannersData); // برای دیباگ
    return null;
  }

  // بررسی که حداقل یکی از بنرها فعال باشد
  const hasActiveBanner = bannersData.leftBanner.isActive || bannersData.rightBanner.isActive;
  
  if (!hasActiveBanner) {
    console.log('Banners not showing - no active banners'); // برای دیباگ
    return null;
  }

  const renderBanner = (banner: BannerData) => {
    if (!banner.isActive) {
      return <div className="w-full h-[283px]"></div>; // فضای خالی برای بنر غیرفعال
    }

    const bannerContent = (
      <div className="relative w-full h-[283px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <Image
          src={banner.imageUrl}
          alt={banner.title || 'بنر تبلیغاتی'}
          fill
          className="object-cover transition-transform duration-300 hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {banner.title && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <span className="text-white text-lg font-semibold opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-4 py-2 rounded">
              {banner.title}
            </span>
          </div>
        )}
      </div>
    );

    return (
      <div key={banner.id} className="w-full">
        {banner.linkUrl ? (
          <Link href={banner.linkUrl} className="block w-full h-full">
            {bannerContent}
          </Link>
        ) : (
          bannerContent
        )}
        
        {/* متن توضیحی اختیاری */}
        {banner.description && (
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">{banner.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderBanner(bannersData.leftBanner)}
          {renderBanner(bannersData.rightBanner)}
        </div>
      </div>
    </div>
  );
};

export default PromoBanners;