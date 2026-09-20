'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '@/lib/cart';
import { getCartItemCount } from '@/lib/cart';

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setItems(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      const json = await res.json();
      if (json.success) {
        await refresh();
        return true;
      }
      alert(json.error || 'خطا در افزودن به سبد');
      return false;
    },
    [refresh],
  );

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      const res = await fetch(`/api/cart/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const json = await res.json();
      if (json.success) {
        await refresh();
      } else {
        alert(json.error || 'خطا در بروزرسانی');
      }
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await fetch(`/api/cart/${id}`, { method: 'DELETE', credentials: 'include' });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      loading,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
    }),
    [items, loading, refresh, addItem, updateQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
