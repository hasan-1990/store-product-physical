'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface WishlistItem {
  _id: string;
  productId: string;
  addedAt: Date;
  product: {
    id: string;
    sequentialId?: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    stock: number;
    active: boolean;
  } | null;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // چک کردن authentication و بارگذاری wishlist در ابتدا
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      setIsAuthenticated(false);
      setWishlist([]);
      return;
    }

    let userData: { role?: string } | null = null;
    let isAdminUser = false;

    try {
      userData = JSON.parse(user);
      const role = userData?.role;
      isAdminUser = typeof role === 'string' && role.toLowerCase() === 'admin';
    } catch (parseError) {
      console.warn('WishlistContext - Failed to parse user data from localStorage', parseError);
    }

    if (isAdminUser) {
      console.log('WishlistContext - Admin user detected, skipping wishlist preload');
      setIsAuthenticated(false);
      setWishlist([]);
      return;
    }

    setIsAuthenticated(true);
    fetchWishlist();
  }, []);

  // بارگذاری wishlist
  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      console.log('WishlistContext - Missing token or user, skipping fetch');
      setWishlist([]);
      setIsAuthenticated(false);
      return;
    }

    try {
      const userData = JSON.parse(user);
      const role = userData?.role;
      const isAdminUser = typeof role === 'string' && role.toLowerCase() === 'admin';

      if (isAdminUser) {
        console.log('WishlistContext - Admin user detected during fetch, skipping wishlist call');
        setWishlist([]);
        setIsAuthenticated(false);
        return;
      }
    } catch (parseError) {
      console.warn('WishlistContext - Failed to parse user data before fetch', parseError);
    }

    try {
      setLoading(true);
      console.log('WishlistContext - Fetching wishlist with JWT token...');
      
      const response = await fetch('/api/user/wishlist', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // اگر خطای 401 بود، token منقضی شده
      if (response.status === 401) {
        console.log('WishlistContext - Token expired or invalid');
        
        // Don't logout admin users - they use a different auth system
        const user = localStorage.getItem('user');
        const userData = user ? JSON.parse(user) : null;
        const isAdmin = userData?.role === 'admin' || userData?.role === 'ADMIN';
        
        if (!isAdmin) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
        
        setWishlist([]);
        return;
      }

      // اگر خطای 500 بود، مشکل سرور است
      if (response.status === 500) {
        console.warn('WishlistContext - Server error (500)');
        setWishlist([]);
        return;
      }

      const data = await response.json();
      console.log('WishlistContext - API response:', data);

      if (data.success) {
        setWishlist(data.data || []);
        console.log('WishlistContext - Wishlist updated:', data.data?.length || 0, 'items');
      } else {
        console.warn('WishlistContext - API returned error:', data.error);
        setWishlist([]);
      }
    } catch (error) {
      console.error('WishlistContext - Error fetching wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // بررسی وجود محصول در wishlist
  const isInWishlist = (productId: string): boolean => {
    const result = wishlist.some(item => {
      // Compare as strings to handle both ObjectId and string formats
      const itemId = String(item.productId);
      const checkId = String(productId);
      return itemId === checkId;
    });
    
    console.log('🔍 isInWishlist check:', {
      productId,
      wishlistCount: wishlist.length,
      wishlistProductIds: wishlist.map(item => String(item.productId)),
      result
    });
    
    return result;
  };

  // افزودن به wishlist
  const addToWishlist = async (productId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    try {
      console.log('WishlistContext - Adding product to wishlist:', productId, 'Type:', typeof productId);
      
      const response = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (data.success) {
        await fetchWishlist(); // بروزرسانی لیست
        toast.success('محصول به لیست علاقه‌مندی‌ها اضافه شد');
      } else {
        toast.error(data.error || 'خطا در افزودن به لیست علاقه‌مندی‌ها');
      }
    } catch (error) {
      console.error('WishlistContext - Error adding to wishlist:', error);
      toast.error('خطا در افزودن به لیست علاقه‌مندی‌ها');
    }
  };

  // حذف از wishlist
  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    try {
      console.log('WishlistContext - Removing product from wishlist:', productId);
      
      const response = await fetch(`/api/user/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setWishlist(prev => prev.filter(item => item.productId !== productId));
        toast.success('محصول از لیست علاقه‌مندی‌ها حذف شد');
      } else {
        toast.error(data.error || 'خطا در حذف از لیست علاقه‌مندی‌ها');
      }
    } catch (error) {
      console.error('WishlistContext - Error removing from wishlist:', error);
      toast.error('خطا در حذف از لیست علاقه‌مندی‌ها');
    }
  };

  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        loading,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
