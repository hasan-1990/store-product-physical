'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
import Toast from './Toast';
import { Product } from '@/types';
import { useCart } from '../hooks/useCart';
import { useURLSettings } from '@/contexts/URLSettingsContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useWishlist } from '@/contexts/WishlistContext';
import ReviewsList from './ReviewsList';
import ReviewForm from './ReviewForm';
import HiddenSEOContent, { HiddenStructuredContent, HiddenKeywords, HiddenDescription } from '@/components/SEO/HiddenSEOContent';
import { HiddenSEOGenerator } from '@/lib/hidden-seo-generator';
import ProductSchema, { BreadcrumbSchema } from '@/components/SEO/ProductSchema';
import ProductRecommendations from './ProductRecommendations';
import { useProductViewTracker, trackCartBehavior, trackAddToWishlist } from '@/hooks/useProductTracking';
import ReadMoreContent from './ReadMoreContent';



interface ProductVariation {
  id: string;
  name: string;
  value: string;
  available: boolean;
  price?: number;
}

interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[]; // injected server-side for stronger internal linking
  categoryCrossLinks?: Array<{ name: string; slug: string }>; // optional future extension
}

const ProductDetailClient = ({ product, relatedProducts = [], categoryCrossLinks = [] }: ProductDetailClientProps) => {
  // Track کردن بازدید این محصول
  useProductViewTracker({
    productId: product._id || product.id || '',
    categoryId: typeof product.category === 'object' ? product.category?._id : product.categoryId,
    userId: undefined // اگر سیستم لاگین داری، userId رو از session/context بگیر
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isZoomed, setIsZoomed] = useState(false);

  // Helper function to check if technical specifications exist
  const hasSpecifications = () => {
    return product.technicalSpecs && (
      product.technicalSpecs.weight ||
      product.technicalSpecs.dimensions ||
      product.technicalSpecs.material ||
      product.technicalSpecs.brand ||
      product.technicalSpecs.warranty ||
      product.technicalSpecs.origin
    );
  };
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  // relatedProducts now provided by server; keep local state only if we want client augmentation later
  const [clientRelated, setClientRelated] = useState<Product[]>(relatedProducts);
  const [cartError, setCartError] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const purchaseBoxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [boxMode, setBoxMode] = useState<'static' | 'fixed' | 'absolute'>('static');
  const [fixedLeft, setFixedLeft] = useState<number | null>(null);
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Analytics hook
  const { trackProductView, trackAddToCart, trackCustomEvent } = useAnalytics();
  const { generateProductUrl } = useURLSettings();

  // Wishlist hook
  const { isInWishlist, addToWishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  
  // Check authentication status from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Get user ID for cart
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Only set userId if it's a valid ObjectId (24 hex characters)
        if (userData.id && /^[0-9a-fA-F]{24}$/.test(userData.id)) {
          setUserId(userData.id);
        }
        // No need to log anything - guest cart is normal behavior
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const { addToCart } = useCart({ userId });

  // Use product colors and sizes from database only
  const [colors] = useState<ProductVariation[]>(
    product.colors && product.colors.length > 0 ? product.colors : []
  );

  const [sizes] = useState<ProductVariation[]>(
    product.sizes && product.sizes.length > 0 ? product.sizes : []
  );

  const [reviews] = useState<ProductReview[]>([
    {
      id: '1',
      userName: 'John D.',
      rating: 5,
      comment: 'Excellent product! Highly recommend it. The quality is outstanding and delivery was fast.',
      date: '2025-01-15',
      verified: true
    },
    {
      id: '2',
      userName: 'Sarah M.',
      rating: 4,
      comment: 'Great value for money. Good quality but could be improved in some areas.',
      date: '2025-01-10',
      verified: true
    },
    {
      id: '3',
      userName: 'Mike R.',
      rating: 5,
      comment: 'Perfect! Exactly what I was looking for. Will definitely buy again.',
      date: '2025-01-08',
      verified: false
    }
  ]);

  useEffect(() => {
    setSelectedColor(colors[0]?.id || '');
    setSelectedSize(sizes[0]?.id || '');
    
    // Track product view
    trackProductView({
      product_id: product.id || 'unknown',
      product_name: product.name,
      category: typeof product.category === 'object' ? (product.category.name || 'uncategorized') : (product.category || 'uncategorized'),
      price: product.price
    });
    
    // Optionally augment server suggestions client-side if fewer than 4 (deferred enhancement)
    if (clientRelated.length < 4) {
      // Placeholder: could fetch by price range or features
    }
  }, [product, colors, sizes]);

  const handleAddToCart = async () => {
    if (!product) return;

    // Use both _id and id to be safe - convert to string
    let productId: string | undefined = product._id as string | undefined || product.id as string | undefined;
    if (!productId) {
      setCartError('شناسه محصول یافت نشد');
      return;
    }

    // Convert ObjectId to string if needed
    if (typeof productId === 'object' && 'toString' in productId) {
      productId = (productId as any).toString();
    }

    // Ensure productId is a string
    productId = String(productId);

    // Find the actual color and size values
    const selectedColorValue = colors.find(c => c.id === selectedColor)?.name || selectedColor;
    const selectedSizeValue = sizes.find(s => s.id === selectedSize)?.value || selectedSize;

    setAddingToCart(true);
    setCartError('');

    try {
      console.log('Adding to cart:', {
        productId,
        quantity,
        color: selectedColorValue,
        size: selectedSizeValue,
        userId
      });

      const result = await addToCart(productId, quantity, {
        color: selectedColorValue,
        size: selectedSizeValue
      });

      console.log('Add to cart result:', result);

      if (result.success) {
        // Track add to cart event (Analytics)
        trackAddToCart({
          product_id: productId,
          product_name: product.name,
          category: typeof product.category === 'object' ? (product.category.name || 'uncategorized') : (product.category || 'uncategorized'),
          price: product.price,
          quantity
        });

        // Track برای سیستم پیشنهاد هوشمند
        trackCartBehavior(productId, undefined);

        // Trigger cart update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { action: 'add', productId } }));
        }

        setAddedToCart(true);
        setToast({ message: '✅ محصول با موفقیت به سبد خرید اضافه شد', type: 'success' });
        setTimeout(() => setAddedToCart(false), 3000);
      } else {
        setCartError(result.error || 'خطا در افزودن به سبد خرید');
        setToast({ message: `❌ خطا: ${result.error || 'خطا در افزودن به سبد خرید'}`, type: 'error' });
        console.error('Add to cart failed:', result.error);
      }
    } catch (error) {
      setCartError('خطا در اتصال به سرور');
      setToast({ message: '❌ خطا در اتصال به سرور', type: 'error' });
      console.error('Add to cart error:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  // مدیریت کلیک روی دکمه علاقه‌مندی
  const handleWishlistClick = async () => {
    // بررسی وضعیت لاگین با JWT
    if (!isAuthenticated) {
      alert('برای استفاده از لیست علاقه‌مندی‌ها ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    if (!product) return;

    const productId = product._id || product.id;
    if (!productId) return;
    
    console.log('🔍 ProductDetailClient - Product data:', {
      _id: product._id,
      id: product.id,
      sequentialId: product.sequentialId,
      selectedProductId: productId
    });

    const wasInWishlist = isInWishlist(productId);

    try {
      if (wasInWishlist) {
        await removeFromWishlist(productId);
        trackCustomEvent('wishlist_removed', `Product ${productId} removed from wishlist`);
      } else {
        await addToWishlist(productId);
        trackCustomEvent('wishlist_added', `Product ${productId} added to wishlist`);
        
        // Track برای سیستم پیشنهاد هوشمند
        trackAddToWishlist(String(productId), undefined);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const calculateAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`${sizeClasses[size]} ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // Images array - using product imageUrl and gallery
  const images = [
    product.imageUrl || product.image, 
    ...(product.gallery || [])
  ].filter(Boolean); // Remove any empty/null values
  
  // Fallback to placeholder if no images
  // تصاویر محصول با fallback بهینه
  const displayImages = images.length > 0 ? images : ['/placeholder.jpg'];
  
  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isGalleryModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isGalleryModalOpen]);

  // Handle sticky behavior for purchase box - compute thresholds and toggle modes
  useEffect(() => {
    const updateMeasurements = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }

      if (purchaseBoxRef.current) {
        const br = purchaseBoxRef.current.getBoundingClientRect();
        setFixedLeft(br.left + window.scrollX);
        setFixedWidth(br.width);
      }
    };

    let ticking = false;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!purchaseBoxRef.current || !contentRef.current || !wrapperRef.current) return;

        const boxRect = purchaseBoxRef.current.getBoundingClientRect();
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;

        // world coordinates
        const wrapperTop = wrapperRect.top + scrollY;
        const wrapperBottom = wrapperRect.bottom + scrollY;
        const boxHeight = boxRect.height;

        const start = wrapperTop - 16; // when box should start sticking (16px = 1rem)
        const end = wrapperBottom - boxHeight - 16; // when box should stop (absolute at bottom)

        if (scrollY < start) {
          setBoxMode('static');
        } else if (scrollY >= start && scrollY <= end) {
          // stick to viewport
          setBoxMode('fixed');
        } else {
          // reached bottom of wrapper - pin to bottom inside wrapper
          setBoxMode('absolute');
        }
      });
    };

    const onResize = () => {
      updateMeasurements();
      onScroll();
    };

    // initial
    updateMeasurements();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    const observer = new ResizeObserver(() => {
      updateMeasurements();
      onScroll();
    });
    if (contentRef.current) observer.observe(contentRef.current);
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!isGalleryModalOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setGalleryIndex((prev) => 
          prev < displayImages.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowLeft') {
        setGalleryIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        setIsGalleryModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGalleryModalOpen, displayImages.length]);
  
  const averageRating = calculateAverageRating();

  // ساخت breadcrumb data برای schema
  const breadcrumbItems = [
    { name: 'خانه', url: '/' },
    { name: 'محصولات', url: '/products' },
  ];
  
  if (Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
    product.categoryPath.forEach((c) => {
      if (c?.slug) {
        breadcrumbItems.push({
          name: c.name || c.slug,
          url: `/products/${c.slug}`
        });
      }
    });
  }
  
  breadcrumbItems.push({
    name: product.name,
    url: `/products/${product.slug}`
  });

  // Contextual auto-linking for description & key features
  const autoLinkText = (text: string) => {
    if (!text) return text;
    
    // اگر متن قبلاً لینک داشت، دیگه auto-link نکن
    if (text.includes('<a ') || text.includes('<a>')) {
      return text;
    }
    
    const keywords: Array<{ label: string; href: string }> = [];
    
    // فقط دسته‌بندی‌ها (معمولاً 1-2 تا)
    if (Array.isArray(product.categoryPath)) {
      product.categoryPath.forEach(c => { 
        if (c.slug) keywords.push({ label: c.name, href: `/products/${c.slug}` }); 
      });
    }
    
    // فقط 3 ویژگی اول (برای کل صفحه حداکثر 5 لینک)
    (product.keyFeatures || []).slice(0, 3).forEach(f => {
      const slug = f.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-آ-ی]/gi, '');
      keywords.push({ label: f, href: `/search?feature=${encodeURIComponent(slug)}` });
    });
    
    // محدود به 5 کلمه کلیدی
    const limitedKeywords = keywords.slice(0, 5);
    
    // Prevent overlapping replacements using sort by label length desc
    const uniqueMap = new Map<string, string>();
    limitedKeywords.forEach(k => { if (!uniqueMap.has(k.label)) uniqueMap.set(k.label, k.href); });
    const ordered = Array.from(uniqueMap.keys()).sort((a,b)=>b.length - a.length);
    
    let result = text;
    let linksAdded = 0;
    const MAX_LINKS = 5;
    
    ordered.forEach(label => {
      if (linksAdded >= MAX_LINKS) return; // حداکثر 5 لینک
      
      const href = uniqueMap.get(label)!;
      // فقط اولین occurrence رو لینک کن (نه همه)
      const pattern = new RegExp(`(?!<[^>]*)(${label.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})(?![^<]*>)`, '');
      
      if (pattern.test(result)) {
        result = result.replace(pattern, `<a href="${href}" class=\"text-purple-400 hover:underline\" data-auto-link=\"1\">$1</a>`);
        linksAdded++;
      }
    });
    
    return result;
  };

  return (
    <>
      {/* JSON-LD Schema Markup برای گوگل - امتیاز مثبت SEO و Rich Results */}
      <ProductSchema 
        product={product} 
        averageRating={averageRating} 
        reviewCount={reviews.length} 
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2000}
        />
      )}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-24 py-4" style={{ maxWidth: 'min(1600px, 100vw)', overflow: 'visible', minHeight: '100vh' }}>
        {/* مسیر ناوبری (Breadcrumb) - استایل شبیه دیجی‌کالا */}
        {(() => {
        // ساخت آیتم‌های breadcrumb پویا
        const items: Array<{ label: string; href?: string }> = [
          { label: 'خانه', href: '/' },
          { label: 'محصولات', href: '/products' },
        ];

        if (Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
          // هر دسته به صفحه محصولات با فیلتر category (slug) هدایت شود
          product.categoryPath.forEach((c) => {
            if (!c?.slug) return;
            items.push({
              label: c.name || c.slug,
              href: `/products/${c.slug}`
            });
          });
        }

  // آیتم نهایی (نام محصول) - حالا با لینک مستقیم به URL نهایی محصول
  const canonicalProductUrl = generateProductUrl(product);
  items.push({ label: product.name, href: canonicalProductUrl });

        const truncate = (text: string, max = 42) => text.length > max ? text.slice(0, max - 3) + '…' : text;

        return (
          <nav
            aria-label="Breadcrumb"
            dir="rtl"
            className="mb-6 md:mb-8 w-full"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            {/* در حالت RTL برای قرارگیری در راست، نباید از justify-end استفاده کنیم چون end در RTL یعنی چپ */}
            <ol className="flex flex-wrap items-center justify-start gap-1 md:gap-2 text-[11px] md:text-xs font-medium w-full" style={{ maxWidth: '100%' }}>
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const position = index + 1; // برای microdata
                return (
                  <li
                    key={index}
                    className="flex items-center group max-w-[120px] sm:max-w-[180px] md:max-w-[220px] flex-shrink-0"
                    itemProp="itemListElement"
                    itemScope
                    itemType="https://schema.org/ListItem"
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        itemProp="item"
                        className="relative px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors backdrop-blur-sm border border-white/10 shadow-sm overflow-hidden"
                      >
                        <span itemProp="name" className="truncate block">
                          {truncate(item.label)}
                        </span>
                        <meta itemProp="position" content={String(position)} />
                      </Link>
                    ) : null}
                    {(!isLast) && (
                      <svg
                        className="w-4 h-4 mx-1 text-gray-500/60 group-hover:text-gray-300 transition-colors rotate-180"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {/* Right Column: Product Images (RTL - appears on right) */}
        <div className="lg:col-span-4 w-full order-first" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {/* Product Images Gallery */}
          <div className="space-y-3 w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          {/* Main Image with Zoom - Reduced size */}
          <div 
            className="relative w-full h-64 lg:h-80 rounded-xl bg-white/10 backdrop-blur-md border border-purple-500/20 cursor-crosshair overflow-hidden"
            style={{ maxWidth: '100%' }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleImageMouseMove}
          >
            {displayImages[selectedImage] && (
              <OptimizedImage
                src={displayImages[selectedImage]}
                alt={`${product.name} - تصویر محصول`}
                enhancedAlt={`${typeof product.category === 'object' ? product.category?.name : product.category || ''}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 500px"
                className={`object-contain transition-transform duration-300 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={{
                  transformOrigin: isZoomed ? zoomPosition.x + "% " + zoomPosition.y + "%" : 'center'
                }}
                priority={selectedImage === 0}
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XqFtUjPlTqfkb+Ej5W6n5E/k="
              />
            )}
            {isZoomed && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs backdrop-blur-sm">
                🔍 Zoom
              </div>
            )}
            
            {/* دکمه باز کردن گالری */}
            {displayImages.length > 1 && (
              <button
                onClick={() => {
                  setGalleryIndex(selectedImage);
                  setIsGalleryModalOpen(true);
                }}
                className="absolute bottom-3 left-3 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-all flex items-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>مشاهده گالری ({displayImages.length})</span>
              </button>
            )}
          </div>

          {/* Thumbnail Images - Smaller and more compact */}
          <div className="grid grid-cols-4 gap-2 w-full" style={{ maxWidth: '100%' }}>
            {displayImages.map((image, index) => (
              image && (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-full h-16 lg:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === index
                      ? 'border-purple-400 ring-2 ring-purple-400/50'
                      : 'border-purple-500/30 hover:border-purple-400/50'
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    alt={`${product.name} - تصویر ${index + 1}`}
                    enhancedAlt={`گالری تصاویر محصول ${typeof product.category === 'object' ? product.category?.name : product.category}`}
                    fill
                    sizes="(max-width: 768px) 20vw, 80px"
                    className="object-contain"
                    quality={75}
                  />
                </button>
              )
            ))}
          </div>
          </div>
        </div>

        {/* Left Column: Product Info + Purchase Box (RTL - appears on left) */}
        <div className="lg:col-span-8 space-y-4 w-full" style={{ maxWidth: '100%' }}>
          {/* Product Title and Category */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">
                  {typeof product.category === 'object' ? product.category.name : product.category}
                </span>
              )}
              <div className="flex items-center gap-1">
                <div className="flex">
                  {renderStars(averageRating, 'sm')}
                </div>
                <span className="text-gray-400 text-xs">
                  ({averageRating}) • {reviews.length} نظر
                </span>
              </div>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              {product.name}
            </h1>
          </div>

          {/* Price and Brand - Vertical Layout */}
          <div className="space-y-4 w-full" style={{ maxWidth: '100%' }}>
            {/* Brand Display - Top */}
            {product.brand && typeof product.brand === 'object' && product.brand.logo && (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center overflow-hidden p-1.5 border-2 border-white/30 shadow-lg flex-shrink-0">
                  <Image
                    src={product.brand.logo}
                    alt={product.brand.name}
                    width={74}
                    height={74}
                    className="w-full h-full object-contain rounded-full"
                    unoptimized={product.brand.logo.startsWith('data:')}
                  />
                </div>
                <p className="text-white font-semibold text-sm">{product.brand.name}</p>
              </div>
            )}

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold text-purple-400">
                  {product.price.toLocaleString('fa-IR')} تومان
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      {product.originalPrice.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% تخفیف
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Color Selection - More compact */}
          {colors.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-white mb-2">رنگ</h3>
              <div className="flex items-center gap-2">
                {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  disabled={!color.available}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    selectedColor === color.id
                      ? 'border-purple-400 ring-2 ring-purple-400/50'
                      : 'border-gray-400 hover:border-purple-400'
                  } ${!color.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!color.available && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-0.5 bg-red-500 rotate-45"></div>
                    </div>
                  )}
                </button>
              ))}
              </div>
            </div>
          )}

          {/* Wishlist & Preview Buttons - Compact */}
          <div className="flex justify-start gap-3">
            <button
              onClick={handleWishlistClick}
              disabled={wishlistLoading || (!product._id && !product.id)}
              className={`px-4 py-2.5 border-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                (() => {
                  if (!isAuthenticated) {
                    return 'border-gray-500 text-gray-400 hover:border-purple-500 hover:text-purple-400';
                  }
                  const productId = product._id || product.id;
                  return productId && isInWishlist(productId)
                    ? 'border-pink-500 bg-pink-500 text-white hover:bg-pink-600 hover:border-pink-600'
                    : 'border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white';
                })()
              } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={(() => {
                if (!isAuthenticated) {
                  return 'برای استفاده از لیست علاقه‌مندی‌ها وارد شوید';
                }
                const productId = product._id || product.id;
                return productId && isInWishlist(productId) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';
              })()}
            >
              <svg
                className="w-5 h-5"
                fill={(() => {
                  if (!isAuthenticated) return "none";
                  const productId = product._id || product.id;
                  return productId && isInWishlist(productId) ? "currentColor" : "none";
                })()}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">
                {(() => {
                  if (!isAuthenticated) return 'افزودن به علاقه‌مندی‌ها';
                  const productId = product._id || product.id;
                  return productId && isInWishlist(productId) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';
                })()}
              </span>
            </button>

            {/* Premium Template Preview Button - Only for Digital Products */}
            {product.isDigital && product.previewUrl && (
              <a
                href={product.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-6 py-2.5 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 inline-flex items-center"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-400/30 rounded-xl transition-all duration-300 group-hover:border-purple-400/60"></div>
                
                {/* Glass effect overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-xl"></div>
                
                {/* Animated shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                {/* Button content */}
                <div className="relative flex items-center gap-2.5 text-white">
                  {/* Animated icon */}
                  <svg 
                    className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                    />
                  </svg>
                  
                  {/* Text with gradient */}
                  <span className="text-sm font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-purple-100 group-hover:to-pink-100 transition-all duration-300">
                    {product.previewType === 'plugin' && 'پیشنمایش افزونه'}
                    {product.previewType === 'theme' && 'پیشنمایش تم'}
                    {product.previewType === 'app' && 'پیشنمایش اپلیکیشن'}
                    {(!product.previewType || product.previewType === 'template') && 'پیشنمایش قالب'}
                  </span>
                  
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping animation-delay-150"></div>
                </div>
                
                {/* Bottom glow effect */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              </a>
            )}
          </div>

          {/* Purchase Section - Clean without box */}
          <div className="space-y-4">
            {/* Features List */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">پشتیبانی رایگان</p>
                  <p className="text-[10px] text-gray-400">6 ماه پشتیبانی رایگان</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">دسترسی دائمی به فایل محصول</p>
                  <p className="text-[10px] text-gray-400">دانلود نامحدود</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">تضمین اصالت و کیفیت</p>
                  <p className="text-[10px] text-gray-400">محصول اورجینال</p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-start">
                <label className="text-xs font-medium text-white">تعداد:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-10 text-center text-white font-medium bg-slate-800/50 py-1 rounded-lg text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex justify-start">
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart || addingToCart || !product || (product.stock || 0) < 1}
                  className={`w-2/5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    addedToCart
                      ? 'bg-green-600 text-white'
                      : addingToCart
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : !product || (product.stock || 0) < 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>اضافه شد!</span>
                    </>
                  ) : addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>در حال افزودن...</span>
                    </>
                  ) : !product || (product.stock || 0) < 1 ? (
                    'ناموجود'
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>افزودن به سبد خرید</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {cartError && (
                <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-xs text-center">{cartError}</p>
                </div>
              )}

              {/* Stock Warning */}
              {product && (product.stock || 0) > 0 && (product.stock || 0) < 10 && (
                <div className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-300 text-[10px] text-center">⚠️ تنها {product.stock} عدد در انبار باقی مانده</p>
                </div>
              )}
            </div>

            {/* Product Meta Info */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-start gap-2 py-2 text-[10px]">
                <span className="text-gray-400">تاریخ انتشار:</span>
                <span className="text-white font-medium">
                  {product.createdAt 
                    ? new Date(product.createdAt).toLocaleDateString('fa-IR')
                    : '۲۲ مهر ۱۴۰۶'
                  }
                </span>
              </div>
              <div className="flex items-center justify-start gap-2 text-[10px]">
                <span className="text-gray-400">نسخه:</span>
                <span className="text-white font-medium">
                  {product.version || '۱.۰'}
                </span>
              </div>
              {product.updateDate && (
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-gray-400">تاریخ بروزرسانی:</span>
                  <span className="text-white font-medium">
                    {new Date(product.updateDate).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs - Reduced padding and spacing */}
      <div className="border-t border-purple-500/20 pt-4 mb-6 w-full sticky-parent" style={{ maxWidth: '100%' }}>
        <div className="relative flex gap-6 mb-4 w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
          {[
            { key: 'description', label: 'توضیحات' },
            ...(hasSpecifications() ? [{ key: 'specifications', label: 'مشخصات' }] : []),
            { key: 'reviews', label: 'نظرات' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-2 text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.key
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-purple-300'
              }`}
            >
              {tab.label}
              {/* Animated underline with glow effect */}
              <div
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300 ease-in-out ${
                  activeTab === tab.key ? 'w-full opacity-100 shadow-lg shadow-purple-400/50' : 'w-0 opacity-0'
                }`}
              />
              {/* Glow effect when active */}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 blur-sm opacity-50 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Grid Layout: Content (70%) + Purchase Box (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 sticky-parent" style={{ alignItems: 'flex-start' }}>
          {/* Main Content Area - 70% */}
          <div ref={contentRef} className="lg:col-span-8 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-purple-500/20 w-full" style={{ maxWidth: '100%' }}>
          {activeTab === 'description' && (
            <div className="space-y-3 animate-fadeInUp">
              <h3 className="text-lg font-semibold text-white mb-3 animate-fadeInUp-delay-1">توضیحات محصول</h3>
              {product.description && product.description.trim() ? (
                <>
                  <style jsx>{`
                    .product-description :global(p) {
                      margin-bottom: 1rem;
                      line-height: 1.75;
                    }
                    .product-description :global(br) {
                      display: block;
                      content: "";
                      margin: 0.5rem 0;
                    }
                    .product-description :global(h1),
                    .product-description :global(h2),
                    .product-description :global(h3),
                    .product-description :global(h4) {
                      margin-top: 1.5rem;
                      margin-bottom: 1rem;
                      font-weight: 600;
                      color: rgb(216, 180, 254);
                    }
                    .product-description :global(ul),
                    .product-description :global(ol) {
                      margin: 1rem 0;
                      padding-right: 1.5rem;
                      list-style-position: outside;
                    }
                    .product-description :global(ul) {
                      list-style-type: disc;
                    }
                    .product-description :global(ol) {
                      list-style-type: decimal;
                    }
                    .product-description :global(li) {
                      margin-bottom: 0.5rem;
                    }
                    .product-description :global(strong) {
                      font-weight: 700;
                      color: rgb(229, 231, 235);
                    }
                    .product-description :global(em) {
                      font-style: italic;
                    }
                    .product-description :global(img) {
                      max-width: 100%;
                      height: auto;
                      margin: 1rem auto;
                      border-radius: 0.5rem;
                    }
                    .product-description :global(a) {
                      color: rgb(167, 139, 250);
                      text-decoration: underline;
                    }
                    .product-description :global(a:hover) {
                      color: rgb(196, 181, 253);
                    }
                    .product-description :global([data-read-more-separator]) {
                      display: none !important;
                    }
                    .product-description[data-expanded="false"] :global(img[data-has-read-more="true"]) {
                      position: relative;
                      height: 400px;
                      width: 100%;
                      object-fit: cover;
                      object-position: 50% 0%;
                      border-radius: 0.5rem;
                      margin: 1.5rem auto;
                      display: block;
                    }
                    .product-description[data-expanded="true"] :global(img[data-has-read-more="true"]) {
                      height: auto !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      object-fit: contain !important;
                      object-position: 50% 50% !important;
                    }
                  `}</style>
                  <div className="relative">
                    <ReadMoreContent
                      content={autoLinkText(product.description)}
                      className="product-description text-gray-300 leading-relaxed text-sm animate-fadeInUp-delay-2"
                      readMoreText="مشاهده بیشتر"
                      readLessText="مشاهده کمتر"
                      useImageOverlayToggle
                      teaserHeight={400}
                    />
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-center py-4">
                  توضیحاتی برای این محصول ثبت نشده است.
                </div>
              )}
              
              {/* فقط اگر توضیحات وجود داشت این بخش نمایش داده شود */}
              {product.description && product.description.trim() && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fadeInUp-delay-3">
                  {/* فقط اگر ویژگی‌های کلیدی وجود داشت */}
                  {product.keyFeatures && product.keyFeatures.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-purple-400 mb-2">ویژگی‌های کلیدی</h4>
                      <ul className="space-y-1 text-gray-300 text-sm">
                        {product.keyFeatures.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* فقط اگر محتویات جعبه وجود داشت */}
                  {product.whatIncluded && product.whatIncluded.length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-purple-400 mb-2">محتویات جعبه</h4>
                      <ul className="space-y-1 text-gray-300 text-sm">
                        {product.whatIncluded.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && hasSpecifications() && (
            <div className="space-y-3 animate-fadeInUp">
              <h3 className="text-lg font-semibold text-white mb-3 animate-fadeInUp-delay-1">مشخصات فنی</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeInUp-delay-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                    <span className="text-gray-400">دسته‌بندی</span>
                    <span className="text-white">{typeof product.category === 'object' ? product.category.name : product.category}</span>
                  </div>
                  {product.technicalSpecs?.weight && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">وزن</span>
                      <span className="text-white">{product.technicalSpecs.weight}</span>
                    </div>
                  )}
                  {product.technicalSpecs?.dimensions && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">ابعاد</span>
                      <span className="text-white">{product.technicalSpecs.dimensions}</span>
                    </div>
                  )}
                  {product.technicalSpecs?.material && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">جنس</span>
                      <span className="text-white">{product.technicalSpecs.material}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {product.technicalSpecs?.brand && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">برند</span>
                      <span className="text-white">{product.technicalSpecs.brand}</span>
                    </div>
                  )}
                  {product.technicalSpecs?.warranty && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">گارانتی</span>
                      <span className="text-white">{product.technicalSpecs.warranty}</span>
                    </div>
                  )}
                  {product.technicalSpecs?.origin && (
                    <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                      <span className="text-gray-400">مبدا</span>
                      <span className="text-white">{product.technicalSpecs.origin}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5 border-b border-purple-500/20 text-sm">
                    <span className="text-gray-400">SKU</span>
                    <span className="text-white">PRD-{String(product.id).padStart(6, "0")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-fadeInUp">
              {/* فرم ثبت نظر */}
              <div className="animate-fadeInUp-delay-1">
                <ReviewForm 
                  productId={product.sequentialId?.toString() || product._id || product.id || ''}
                  productSlug={product.slug}
                  onSuccess={() => {
                    // می‌توانید اینجا یک refresh یا notification اضافه کنید
                    console.log('Review submitted successfully');
                  }}
                />
              </div>

              {/* لیست نظرات */}
              <div className="animate-fadeInUp-delay-2">
                <ReviewsList 
                  productId={product.sequentialId?.toString() || product._id || product.id || ''}
                  productSlug={product.slug}
                />
              </div>
            </div>
          )}
          </div>

          {/* Purchase Box - Right Side (30%) */}
          <div 
            ref={wrapperRef}
            className="lg:col-span-4"
            style={{
              height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
              position: 'relative'
            }}
          >
            <div 
              ref={purchaseBoxRef}
              className="bg-slate-900/70 backdrop-blur-xl rounded-xl p-5 border border-purple-500/30 shadow-2xl space-y-4 glass-scrollbar"
              style={
                boxMode === 'fixed'
                  ? {
                      position: 'fixed',
                      top: '1rem',
                      left: fixedLeft !== null ? `${fixedLeft}px` : undefined,
                      width: fixedWidth !== null ? `${fixedWidth}px` : undefined,
                      maxHeight: 'calc(100vh - 2rem)',
                      overflowY: 'auto',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                    }
                  : boxMode === 'absolute'
                  ? {
                      position: 'absolute',
                      bottom: '0',
                      left: 0,
                      right: 0,
                      maxHeight: 'calc(100vh - 2rem)',
                      overflowY: 'auto',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                    }
                  : {
                      position: 'relative',
                      maxHeight: 'calc(100vh - 2rem)',
                      overflowY: 'auto',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                    }
              }
            >
              {/* Price Section */}
              <div className="space-y-3 pb-4 border-b border-purple-500/20">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {product.price.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-sm text-gray-300">تومان</span>
                </div>
                
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">
                      {product.originalPrice.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}٪ تخفیف
                    </span>
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-2.5 py-3 border-b border-purple-500/20">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">پشتیبانی رایگان</p>
                    <p className="text-[10px] text-gray-400">6 ماه پشتیبانی رایگان</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">دسترسی دائمی به فایل محصول</p>
                    <p className="text-[10px] text-gray-400">دانلود نامحدود</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">تضمین اصالت و کیفیت</p>
                    <p className="text-[10px] text-gray-400">محصول اورجینال</p>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white">تعداد:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 flex items-center justify-center bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-10 text-center text-white font-medium bg-slate-800/50 py-1 rounded-lg text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart || addingToCart || !product || (product.stock || 0) < 1}
                    className={`w-2/5 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    addedToCart
                      ? 'bg-green-600 text-white'
                      : addingToCart
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : !product || (product.stock || 0) < 1
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>اضافه شد!</span>
                    </>
                  ) : addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>در حال افزودن...</span>
                    </>
                  ) : !product || (product.stock || 0) < 1 ? (
                    'ناموجود'
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>افزودن به سبد خرید</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
                {cartError && (
                  <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-xs text-center">{cartError}</p>
                  </div>
                )}

                {/* Stock Warning */}
                {product && (product.stock || 0) > 0 && (product.stock || 0) < 10 && (
                  <div className="p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-300 text-[10px] text-center">⚠️ تنها {product.stock} عدد در انبار باقی مانده</p>
                  </div>
                )}
              </div>

              {/* Product Meta Info */}
              <div className="space-y-1.5 pt-3 border-t border-purple-500/20">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">تاریخ انتشار:</span>
                  <span className="text-white font-medium">
                    {product.createdAt 
                      ? new Date(product.createdAt).toLocaleDateString('fa-IR')
                      : '۲۲ مهر ۱۴۰۶'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400">نسخه:</span>
                  <span className="text-white font-medium">
                    {product.version || '۱.۰'}
                  </span>
                </div>
                {product.updateDate && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">تاریخ بروزرسانی:</span>
                    <span className="text-white font-medium">
                      {new Date(product.updateDate).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Icons */}
              <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-purple-500/20">
                <div className="text-[10px] text-gray-400">روش‌های پرداخت:</div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-[10px]">💳</span>
                  </div>
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-[10px]">🏦</span>
                  </div>
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-[10px]">📱</span>
                  </div>
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                    <span className="text-[10px]">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* پیشنهادات هوشمند بر اساس رفتار کاربر */}
      <ProductRecommendations 
        currentProductId={product._id || product.id}
        userId={undefined} // اگر سیستم لاگین داری، userId رو بده
        limit={5}
        title="محصولاتی که شاید بپسندید"
        className="mt-8"
      />
      </div>

      {/* Hidden SEO Content - فقط برای موتورهای جستجو */}
      {(() => {
        const seoData = HiddenSEOGenerator.generateCompleteProductSEO(product);
        return (
          <>
            {/* Category Cross Links */}
            {categoryCrossLinks.length > 0 && (
              <nav aria-label="دسته‌های مرتبط" className="mt-16 mb-8 max-w-full overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-4">دسته‌های مرتبط</h2>
                <ul className="flex flex-wrap gap-2 max-w-full">
                  {categoryCrossLinks.map(cat => (
                    <li key={cat.slug}>
                      <Link href={`/products/${cat.slug}`} className="px-3 py-1 text-xs rounded-full bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition">
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <HiddenStructuredContent
              title={seoData.title}
              description={seoData.description}
              keywords={seoData.keywords}
              categories={seoData.categories}
              features={seoData.features}
            />

            <HiddenKeywords keywords={seoData.keywords} />

            <HiddenDescription description={seoData.description} />
          </>
        );
      })()}

      {/* Fashion Gallery Modal */}
      {isGalleryModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden"
          onClick={() => setIsGalleryModalOpen(false)}
          style={{ width: '100vw', height: '100vh' }}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={() => setIsGalleryModalOpen(false)}
            className="absolute top-4 left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 sm:top-6 sm:left-6 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg transition-all group"
          >
            <svg className="w-6 h-6 text-gray-800 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center px-2 sm:px-4 md:px-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100vw' }}
          >
            {/* Left Thumbnails - Hidden on mobile */}
            <div className="hidden lg:flex flex-col gap-4 mr-4 xl:mr-8 flex-shrink-0 max-w-[80px]">
              {displayImages.filter((img): img is string => !!img).slice(0, Math.min(5, Math.floor(displayImages.length / 2))).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-300 ${
                    galleryIndex === index
                      ? 'ring-4 ring-purple-500 scale-110 shadow-2xl'
                      : 'opacity-40 hover:opacity-100 hover:scale-105 shadow-lg'
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    enhancedAlt={`${product.name} - تصویر کوچک ${index + 1}`}
                    fill
                    className="object-contain"
                    quality={70}
                  />
                </button>
              ))}
            </div>

            {/* Center Main Image */}
            <div className="relative flex-1 h-[70vh] flex items-center justify-center overflow-hidden" style={{ maxWidth: 'min(48rem, calc(100vw - 4rem))' }}>
              {/* Navigation Button - Right (Previous in RTL) */}
              {galleryIndex > 0 && (
                <button
                  onClick={() => setGalleryIndex(galleryIndex - 1)}
                  className="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center transition-all group"
                  style={{ right: 'max(0.5rem, 2%)' }}
                >
                  <div className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-full animate-spin-slow"></div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </button>
              )}

              {/* Main Image Card */}
              <div className="relative w-full h-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ maxWidth: '100%' }}>
                {displayImages[galleryIndex] && (
                  <>
                    <OptimizedImage
                      src={displayImages[galleryIndex]}
                      alt={`${product.name} - ${galleryIndex + 1}`}
                      enhancedAlt={`نمایش بزرگ ${typeof product.category === 'object' ? product.category?.name : product.category} | گالری تصاویر با کیفیت`}
                      fill
                      className="object-contain p-4 sm:p-6 md:p-8"
                      quality={95}
                      priority
                    />
                    
                    {/* Product Name Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none max-w-full px-4">
                      <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.3)] opacity-50 mix-blend-overlay truncate">
                        {product.name}
                      </h2>
                    </div>

                    {/* Image Counter Badge */}
                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">
                        {galleryIndex + 1} / {displayImages.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Navigation Button - Left (Next in RTL) */}
              {galleryIndex < displayImages.length - 1 && (
                <button
                  onClick={() => setGalleryIndex(galleryIndex + 1)}
                  className="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center transition-all group"
                  style={{ left: 'max(0.5rem, 2%)' }}
                >
                  <div className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-full animate-spin-slow"></div>
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}
            </div>

            {/* Right Thumbnails - Hidden on mobile */}
            <div className="hidden lg:flex flex-col gap-4 ml-4 xl:ml-8 flex-shrink-0 max-w-[80px]">
              {displayImages.filter((img): img is string => !!img).slice(Math.floor(displayImages.length / 2), Math.floor(displayImages.length / 2) + 5).map((image, index) => {
                const actualIndex = index + Math.floor(displayImages.length / 2);
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setGalleryIndex(actualIndex)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-300 ${
                      galleryIndex === actualIndex
                        ? 'ring-4 ring-purple-500 scale-110 shadow-2xl'
                        : 'opacity-40 hover:opacity-100 hover:scale-105 shadow-lg'
                    }`}
                  >
                    <OptimizedImage
                      src={image}
                      alt={`Thumbnail ${actualIndex + 1}`}
                      enhancedAlt={`${product.name} - پیش‌نمایش تصویر ${actualIndex + 1}`}
                      fill
                      className="object-contain"
                      quality={70}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Thumbnails for Mobile */}
          <div className="lg:hidden absolute bottom-4 left-0 right-0 px-2 overflow-hidden" style={{ maxWidth: '100vw' }}>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ width: '100%' }}>
              {displayImages.filter((img): img is string => !!img).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryIndex(index)}
                  className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 ${
                    galleryIndex === index
                      ? 'ring-2 ring-purple-500 scale-110 shadow-xl'
                      : 'opacity-50 hover:opacity-100 shadow-md'
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    enhancedAlt={`${product.name} - پیش‌نمایش کوچک ${index + 1}`}
                    fill
                    className="object-contain"
                    quality={60}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm shadow-lg">
            استفاده از کلیدهای ← و → برای حرکت • ESC برای بستن
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailClient;