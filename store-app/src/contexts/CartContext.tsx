'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCart, CartItem } from '@/hooks/useCart';

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  subtotal: number;
  itemCount: number;
  addToCart: (productId: string, quantity?: number, options?: { size?: string; color?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeItem: (itemId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, userId }) => {
  const cartHook = useCart({ userId });

  // Enhanced cart methods with event triggering
  const enhancedAddToCart = async (
    productId: string, 
    quantity: number = 1, 
    options: { size?: string; color?: string } = {}
  ) => {
    const result = await cartHook.addToCart(productId, quantity, options);
    if (result.success && typeof window !== 'undefined') {
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { action: 'add', productId, quantity } 
      }));
    }
    return result;
  };

  const enhancedRemoveItem = async (itemId: string) => {
    const result = await cartHook.removeItem(itemId);
    if (result.success && typeof window !== 'undefined') {
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { action: 'remove', itemId } 
      }));
    }
    return result;
  };

  const enhancedUpdateQuantity = async (itemId: string, quantity: number) => {
    const result = await cartHook.updateQuantity(itemId, quantity);
    if (result.success && typeof window !== 'undefined') {
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { action: 'update', itemId, quantity } 
      }));
    }
    return result;
  };

  const enhancedClearCart = async () => {
    const result = await cartHook.clearCart();
    if (result.success && typeof window !== 'undefined') {
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { action: 'clear' } 
      }));
    }
    return result;
  };

  const contextValue = {
    ...cartHook,
    addToCart: enhancedAddToCart,
    removeItem: enhancedRemoveItem,
    updateQuantity: enhancedUpdateQuantity,
    clearCart: enhancedClearCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

// Higher-order component for automatic user detection
export const CartProviderWithAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get user from your auth system
    const userString = localStorage.getItem('user');
    if (userString && userString !== 'undefined') {
      try {
        const userData = JSON.parse(userString);
        // Only set userId if it's a valid ObjectId (24 hex characters)
        if (userData.id && /^[0-9a-fA-F]{24}$/.test(userData.id)) {
          setUserId(userData.id);
        }
        // No need to log anything - guest cart is normal behavior
      } catch (error) {
        // Silent fail for invalid JSON
        localStorage.removeItem('user');
      }
    }
  }, []);

  // جلوگیری از hydration error
  if (!mounted) {
    return (
      <CartProvider userId={undefined}>
        {children}
      </CartProvider>
    );
  }

  return (
    <CartProvider userId={userId}>
      {children}
    </CartProvider>
  );
};
