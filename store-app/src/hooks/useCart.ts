'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  stock: number;
  category?: string;
  productType?: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital';
  type?: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital';
  downloadUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  provisioningType?: 'download' | 'managed-site';
  templateSlug?: string;
  templateId?: string;
}

interface UseCartOptions {
  userId?: string;
  sessionId?: string;
}

export const useCart = ({ userId, sessionId }: UseCartOptions = {}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate session ID if not provided and no user
  const getSessionId = useCallback(() => {
    if (userId) return undefined;
    if (sessionId) return sessionId;
    
    // Generate or get from localStorage
    let id = localStorage.getItem('cart_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', id);
    }
    return id;
  }, [userId, sessionId]);

  // Fetch cart items - از API واقعی استفاده می‌کنیم
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentSessionId = sessionId || getSessionId();
      const params = new URLSearchParams();

      if (userId) {
        params.append('userId', userId);
        console.log('🛒 Fetching cart for userId:', userId);
      } else if (currentSessionId) {
        params.append('sessionId', currentSessionId);
        console.log('🛒 Fetching cart for sessionId:', currentSessionId);
      } else {
        // No userId or sessionId, don't fetch
        console.log('⚠️ No userId or sessionId, skipping cart fetch');
        setLoading(false);
        return;
      }

      console.log('🛒 Cart API call:', `/api/cart?${params.toString()}`);
      const response = await fetch(`/api/cart?${params.toString()}`);
      const data = await response.json();

      console.log('🛒 Cart response:', data);

      if (data.success) {
        setCartItems(data.data);
        console.log('✅ Cart items loaded:', data.data.length, 'items');
      } else {
        setError(data.error || 'خطا در دریافت سبد خرید');
        console.log('❌ Cart error:', data.error);
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
      console.error('❌ Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, getSessionId]);

  // Add item to cart
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    options: { size?: string; color?: string } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentSessionId = getSessionId();
      
      // Prepare request body - only send userId OR sessionId, not both
      const requestBody: any = {
        productId,
        quantity: Number(quantity), // Ensure quantity is a number
        size: options.size,
        color: options.color,
      };

      if (userId) {
        requestBody.userId = userId;
      } else {
        requestBody.sessionId = currentSessionId;
      }
      
      console.log('🛒 Adding to cart:', requestBody);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('🛒 Add to cart response:', data);

      if (data.success) {
        await fetchCart(); // Refresh cart
        return { success: true, message: data.message };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = 'خطا در اضافه کردن به سبد خرید';
      setError(errorMsg);
      console.error('Add to cart error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [userId, getSessionId, fetchCart]);

  // Remove item from cart - از API واقعی استفاده می‌کنیم
  const removeItem = useCallback(async (itemId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart(); // Refresh cart
        return { success: true, message: data.message };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = 'خطا در حذف از سبد خرید';
      setError(errorMsg);
      console.error('Remove item error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Update item quantity - از API واقعی استفاده می‌کنیم
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeItem(itemId);
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart(); // Refresh cart
        return { success: true, message: data.message };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = 'خطا در بروزرسانی سبد خرید';
      setError(errorMsg);
      console.error('Update quantity error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchCart, removeItem]);

  // Clear entire cart - از API واقعی استفاده می‌کنیم
  const clearCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentSessionId = getSessionId();
      const params = new URLSearchParams();
      
      if (userId) {
        params.append('userId', userId);
      } else if (currentSessionId) {
        params.append('sessionId', currentSessionId);
      }

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCartItems([]);
        return { success: true, message: data.message };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = 'خطا در پاک کردن سبد خرید';
      setError(errorMsg);
      console.error('Clear cart error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [userId, getSessionId]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Load cart on mount and when userId/sessionId changes
  useEffect(() => {
    fetchCart();
  }, [userId, sessionId, fetchCart]);

  return {
    cartItems,
    loading,
    error,
    subtotal,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };
};
