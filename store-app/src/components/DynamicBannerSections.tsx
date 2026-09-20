'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Banner {
  title: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  description: string
}

interface BannerSection {
  _id: string
  name: string
  title: string
  position: string
  leftBanner: Banner
  rightBanner: Banner
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface DynamicBannerSectionsProps {
  position: string
}

// Global cache - SHARED بین تمام instances
let globalBannerCache: BannerSection[] | null = null;
let globalCacheTimestamp = 0;
const CACHE_DURATION = 300000; // 5 دقیقه

// Global fetch promise - جلوگیری از request های موازی تکراری
let fetchPromise: Promise<BannerSection[]> | null = null;

async function fetchAllBannerSections(): Promise<BannerSection[]> {
  const now = Date.now();
  
  // اگر کش معتبر هست، برگردون
  if (globalBannerCache && (now - globalCacheTimestamp < CACHE_DURATION)) {
    return globalBannerCache || [];
  }
  
  // اگر در حال fetch هست، همون promise رو برگردون
  if (fetchPromise) {
    return fetchPromise;
  }
  
  // شروع fetch جدید
  fetchPromise = fetch('/api/admin/banner-sections', {
    cache: 'no-store', // از browser cache استفاده نکن، خودمون مدیریت می‌کنیم
    credentials: 'same-origin' // برای CORS
  })
    .then(res => {
      if (!res.ok) {
        console.warn('Banner sections API returned:', res.status);
        return { sections: [] };
      }
      return res.json();
    })
    .then(data => {
      globalBannerCache = data.sections || [];
      globalCacheTimestamp = Date.now();
      fetchPromise = null; // پاک کردن promise
      return globalBannerCache || [];
    })
    .catch(err => {
      console.error('Error fetching banner sections:', err);
      fetchPromise = null;
      return [];
    });
  
  return fetchPromise;
}

function DynamicBannerSectionsComponent({ position }: DynamicBannerSectionsProps) {
  const [sections, setSections] = useState<BannerSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let mounted = true;
    
    fetchAllBannerSections().then(allSections => {
      if (!mounted) return;
      
      // فیلتر برای این position خاص
      const filtered = allSections
        .filter((section: BannerSection) => 
          section.isActive && 
          section.position === position &&
          (section.leftBanner?.isActive || section.rightBanner?.isActive)
        )
        .sort((a: BannerSection, b: BannerSection) => a.order - b.order);
      
      setSections(filtered);
      setIsLoading(false);
    });
    
    return () => { 
      mounted = false;
      setIsMounted(false);
    };
  }, [position]);

  // هنگام loading یا اگر section نداشت، هیچ فضایی رزرو نکن
  // این باعث می‌شود که Layout Shift کاهش یابد
  if (!isMounted || isLoading) {
    return null;
  }
  
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {sections.map((section) => {
            // جمع‌آوری بنرهای فعال
            const activeBanners: any[] = []
            
            if (section.leftBanner?.isActive) {
              activeBanners.push({ ...section.leftBanner, position: 'left', id: `${section._id}-left` })
            }
            
            if (section.rightBanner?.isActive) {
              activeBanners.push({ ...section.rightBanner, position: 'right', id: `${section._id}-right` })
            }

            // اگر هیچ بنر فعالی وجود ندارد، این بخش را نمایش نده
            if (activeBanners.length === 0) {
              return null
            }

            return (
              <div key={section._id} className="banner-section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBanners.map((banner) => (
                    <div key={banner.id} className="relative group overflow-hidden">
                      <Link 
                        href={banner.linkUrl || '#'} 
                        className="block"
                        target={banner.linkUrl?.startsWith('http') ? '_blank' : '_self'}
                      >
                        <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-xl">
                          <Image
                            src={banner.imageUrl || '/images/products/placeholder.svg'}
                            alt={banner.title || 'Banner'}
                            width={600}
                            height={300}
                            className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                            priority={position === 'before-hero'}
                            loading={position === 'before-hero' ? 'eager' : 'lazy'}
                            unoptimized={false}
                            quality={75}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                          {banner.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                              <h3 className="text-white text-lg font-semibold">
                                {banner.title}
                              </h3>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// استفاده از React.memo برای جلوگیری از re-render های غیرضروری
const DynamicBannerSections = React.memo(DynamicBannerSectionsComponent, (prevProps, nextProps) => {
  return prevProps.position === nextProps.position;
});

DynamicBannerSections.displayName = 'DynamicBannerSections';

export default DynamicBannerSections;