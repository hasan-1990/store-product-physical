"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { Sparkles } from 'lucide-react';
import { useURLSettings } from '@/contexts/URLSettingsContext';
import OptimizedImage from '@/components/OptimizedImage';

interface ProductRecommendationsProps {
  currentProductId?: string;
  userId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function ProductRecommendations({
  currentProductId,
  userId,
  limit = 5,
  title = "پیشنهاد ویژه برای شما",
  className = ""
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>("");
  const { generateProductUrl } = useURLSettings();

  useEffect(() => {
    // گرفتن یا ساختن sessionId
    let sid = sessionStorage.getItem('sessionId');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sid);
    }
    setSessionId(sid);

    // بارگذاری پیشنهادات
    loadRecommendations(sid);
  }, [currentProductId, userId]);

  const loadRecommendations = async (sid: string) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        sessionId: sid,
        limit: limit.toString(),
        ...(userId && { userId }),
        ...(currentProductId && { 
          currentProductId,
          excludeIds: currentProductId
        })
      });

      const response = await fetch(`/api/recommendations?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track view event
  const trackView = async (productId: string) => {
    try {
      await fetch('/api/track-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'click',
          productId,
          sessionId,
          userId,
          metadata: { source: 'recommendations' }
        })
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">در حال بارگذاری پیشنهادات...</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-white/10 rounded-lg mb-3"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {title}
          </h2>
          <span className="text-sm text-gray-400 mr-auto">
            بر اساس رفتار شما انتخاب شده
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recommendations.map((product) => {
            // ساخت لینک کامل محصول با دسته‌بندی
            const productUrl = generateProductUrl(product);
            
            return (
            <Link
              key={product._id}
              href={productUrl}
              onClick={() => trackView(product._id!)}
              className="group bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-white/5">
                {product.image || product.imageUrl ? (
                  <OptimizedImage
                    src={product.image || product.imageUrl || ''}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                
                {/* Discount Badge */}
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}٪
                  </div>
                )}

                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ویژه
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {product.name}
                </h3>

                <div className="flex items-center justify-between">
                  {product.price ? (
                    <div className="flex flex-col">
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {product.originalPrice.toLocaleString('fa-IR')} تومان
                        </span>
                      )}
                      <span className="text-purple-400 font-bold">
                        {product.price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">تماس بگیرید</span>
                  )}
                </div>

                {/* Rating */}
                {product.rating && product.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-gray-400 text-xs">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
