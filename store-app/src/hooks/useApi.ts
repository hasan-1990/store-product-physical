import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Products hooks
export const useProducts = (limit = 100, searchTerm = '', selectedCategory = 'all') => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    ...(searchTerm && { search: searchTerm }),
    ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
  });

  return useQuery({
    queryKey: ['admin', 'products', limit, searchTerm, selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products?${queryParams}`);
      if (!response.ok) throw new Error('خطا در دریافت محصولات');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 دقیقه
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: any) => {
      console.log('🚀 Sending product data:', productData);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      const result = await response.json();
      console.log('📥 API Response:', result);
      
      if (!response.ok) {
        console.error('❌ API Error:', result);
        throw new Error(result.error || 'خطا در اضافه کردن محصول');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate all product queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      queryClient.invalidateQueries({ queryKey: ['latest-products-with-settings'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('خطا در حذف محصول');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// SMS Settings hooks
export const useSMSSettings = () => {
  return useQuery({
    queryKey: ['admin', 'sms-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sms-settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات پیامک');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useSaveSMSSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/admin/sms-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('خطا در ذخیره تنظیمات');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sms-settings'] });
    },
  });
};

export const useSMSCredit = () => {
  return useQuery({
    queryKey: ['sms', 'credit'],
    queryFn: async () => {
      const response = await fetch('/api/sms?action=credit');
      if (!response.ok) throw new Error('خطا در دریافت اعتبار');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 ثانیه
    refetchInterval: 5 * 60 * 1000, // هر 5 دقیقه خودکار
  });
};

export const useSendSMS = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (smsData: any) => {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsData),
      });
      if (!response.ok) throw new Error('خطا در ارسال پیامک');
      return response.json();
    },
    onSuccess: () => {
      // Refresh credit after sending SMS
      queryClient.invalidateQueries({ queryKey: ['sms', 'credit'] });
    },
  });
};

// Categories hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

// Settings hooks
export const useSettings = () => {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });
};


// Cache Management hooks
export const useCacheStats = () => {
  return useQuery({
    queryKey: ['admin', 'cache', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/cache');
      if (!response.ok) throw new Error('خطا در دریافت وضعیت کش');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 ثانیه
    refetchInterval: 10 * 1000, // هر 10 ثانیه
  });
};

export const useClearCache = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cache', { method: 'DELETE' });
      if (!response.ok) throw new Error('خطا در پاک کردن کش');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cache'] });
    },
  });
};

// Line Numbers hook
export const useLineNumbers = () => {
  return useQuery({
    queryKey: ['sms', 'lineNumbers'],
    queryFn: async () => {
      const response = await fetch('/api/sms?action=lines');
      if (!response.ok) throw new Error('خطا در دریافت خطوط ارسال');
      return response.json();
    },
    enabled: false, // فقط به صورت دستی فراخوانی شود
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

// Home Page hooks
export const usePublicSettings = () => {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const response = await fetch('/api/public-settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات عمومی');
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 دقیقه
  });
};

export const useSiteHeaderSettings = () => {
  return useQuery({
    queryKey: ['admin', 'site-header-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/site-header-settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات هدر سایت');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useWhyUsSettings = () => {
  return useQuery({
    queryKey: ['admin', 'whyus-section-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/whyus-section-settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات بخش چرا ما');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useProductsIntroSettings = () => {
  return useQuery({
    queryKey: ['admin', 'products-intro-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/products-intro-settings');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات معرفی محصولات');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useHomepageSections = () => {
  return useQuery({
    queryKey: ['admin', 'homepage-sections'],
    queryFn: async () => {
      const response = await fetch('/api/admin/homepage-sections');
      if (!response.ok) throw new Error('خطا در دریافت بخش‌های صفحه اصلی');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};


// Latest Products with settings hook
export const useLatestProductsWithSettings = () => {
  return useQuery({
    queryKey: ['latest-products-with-settings'],
    queryFn: async () => {
      const [productsResponse, settingsResponse] = await Promise.all([
        fetch('/api/latest-products'),
        fetch('/api/admin/tabbed-products-settings')
      ]);

      if (!productsResponse.ok || !settingsResponse.ok) {
        throw new Error('خطا در دریافت جدیدترین محصولات');
      }

      const [productsResult, settingsResult] = await Promise.all([
        productsResponse.json(),
        settingsResponse.json()
      ]);

      return {
        products: productsResult,
        settings: settingsResult
      };
    },
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });
};

// Public Products (for products page)
export const usePublicProducts = (limit = 100) => {
  return useQuery({
    queryKey: ['public-products', limit],
    queryFn: async () => {
      const response = await fetch(`/api/products?limit=${limit}`);
      if (!response.ok) throw new Error('خطا در دریافت محصولات');
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 دقیقه
  });
};

// Single Product (for product detail page)
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('محصول یافت نشد');
      return response.json();
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });
};

// Custom Sections hooks
export const useCustomSections = () => {
  return useQuery({
    queryKey: ['admin', 'custom-sections'],
    queryFn: async () => {
      const response = await fetch('/api/admin/custom-sections');
      if (!response.ok) throw new Error('خطا در دریافت بخش‌های سفارشی');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useSaveCustomSections = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sections: any) => {
      const response = await fetch('/api/admin/custom-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (!response.ok) throw new Error('خطا در ذخیره بخش‌های سفارشی');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-sections'] });
    },
  });
};

// Unified Product Sections hooks
export const useUnifiedProductSections = () => {
  return useQuery({
    queryKey: ['admin', 'unified-product-sections'],
    queryFn: async () => {
      const response = await fetch('/api/admin/unified-product-sections');
      if (!response.ok) throw new Error('خطا در دریافت تنظیمات بخش‌های محصولات');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useSaveUnifiedProductSections = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/admin/unified-product-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('خطا در ذخیره تنظیمات');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'unified-product-sections'] });
    },
  });
};

// Product Types hooks (for different product types)
export const useProductsByType = (type: string, limit = 8, selectedProducts: string[] = []) => {
  return useQuery({
    queryKey: ['products-by-type', type, limit, selectedProducts],
    queryFn: async () => {
      if (type === 'manual' && selectedProducts.length > 0) {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: selectedProducts }),
        });
        if (!response.ok) throw new Error('خطا در دریافت محصولات انتخاب شده');
        const data = await response.json();
        return data.products?.slice(0, limit) || [];
      } else {
        const queryParams = new URLSearchParams({
          limit: limit.toString(),
          type: type,
          active: 'true'
        });
        
        const response = await fetch(`/api/products?${queryParams}`);
        if (!response.ok) throw new Error('خطا در دریافت محصولات');
        const data = await response.json();
        return data.products || [];
      }
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });
};

// Homepage Products hooks
export const useHomepageProducts = (type: string, limit = 8) => {
  return useQuery({
    queryKey: ['homepage-products', type, limit],
    queryFn: async () => {
      const response = await fetch(`/api/homepage/products?type=${type}&limit=${limit}`);
      if (!response.ok) throw new Error('خطا در دریافت محصولات صفحه اصلی');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });
};

// Categories for homepage
export const useHomepageCategories = (limit = 6, sortBy = 'order') => {
  return useQuery({
    queryKey: ['homepage-categories', limit, sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/homepage/categories?limit=${limit}&sortBy=${sortBy}`);
      if (!response.ok) throw new Error('خطا در دریافت دسته‌بندی‌های صفحه اصلی');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

// Mega Menu hook
export const useMegaMenu = () => {
  return useQuery({
    queryKey: ['mega-menu'],
    queryFn: async () => {
      const response = await fetch('/api/mega-menu');
      if (!response.ok) throw new Error('خطا در دریافت منوی اصلی');
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 دقیقه
  });
};

// Cart hooks
export const useCart = (sessionId: string) => {
  return useQuery({
    queryKey: ['cart', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/cart?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('خطا در دریافت سبد خرید');
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000, // 1 دقیقه
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { productId: string; sessionId: string; quantity: number }) => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('خطا در افزودن به سبد خرید');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.sessionId] });
    },
  });
};

// Search Products hook
export const useSearchProducts = (query: string, limit = 6) => {
  return useQuery({
    queryKey: ['search-products', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];

      const response = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('خطا در جستجوی محصولات');
      }

      const data = await response.json();
      return data.success ? (data.products || []) : [];
    },
    enabled: !!query && query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 ثانیه
  });
};

// Brands hooks
export const useBrands = (limit = 100) => {
  return useQuery({
    queryKey: ['brands', limit],
    queryFn: async () => {
      const response = await fetch(`/api/brands?limit=${limit}`);
      if (!response.ok) throw new Error('خطا در دریافت برندها');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
};

export const useAddBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandData: any) => {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });
      if (!response.ok) throw new Error('خطا در افزودن برند');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('خطا در بروزرسانی برند');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (brandId: string) => {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('خطا در حذف برند');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};
