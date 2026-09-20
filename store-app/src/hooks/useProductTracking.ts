"use client";

import { useEffect, useRef } from 'react';

interface UseProductViewTrackerProps {
  productId: string;
  categoryId?: string;
  userId?: string;
}

export function useProductViewTracker({ 
  productId, 
  categoryId,
  userId 
}: UseProductViewTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    hasTrackedRef.current = false;

    // Track view when component mounts
    const trackView = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        
        await fetch('/api/track-behavior', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'view',
            productId,
            categoryId,
            sessionId,
            userId,
            timestamp: new Date()
          })
        });

        hasTrackedRef.current = true;
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();

    // Track duration when component unmounts
    return () => {
      if (hasTrackedRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Send duration update
        const sessionId = getOrCreateSessionId();
        fetch('/api/track-behavior', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'view',
            productId,
            categoryId,
            sessionId,
            userId,
            duration,
            metadata: { viewEnd: true }
          })
        }).catch(err => console.error('Error tracking duration:', err));
      }
    };
  }, [productId, categoryId, userId]);
}

// Helper to track cart actions
export async function trackCartBehavior(productId: string, userId?: string) {
  try {
    const sessionId = getOrCreateSessionId();
    
    await fetch('/api/track-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cart',
        productId,
        sessionId,
        userId
      })
    });
  } catch (error) {
    console.error('Error tracking cart:', error);
  }
}

// Helper to track wishlist actions
export async function trackAddToWishlist(productId: string, userId?: string) {
  try {
    const sessionId = getOrCreateSessionId();
    
    await fetch('/api/track-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'wishlist',
        productId,
        sessionId,
        userId
      })
    });
  } catch (error) {
    console.error('Error tracking wishlist:', error);
  }
}

// Helper to track purchase
export async function trackPurchase(productIds: string[], userId?: string, orderTotal?: number) {
  try {
    const sessionId = getOrCreateSessionId();
    
    for (const productId of productIds) {
      await fetch('/api/track-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'purchase',
          productId,
          sessionId,
          userId,
          metadata: { orderTotal }
        })
      });
    }
  } catch (error) {
    console.error('Error tracking purchase:', error);
  }
}

// Helper to track search
export async function trackSearch(searchQuery: string, userId?: string) {
  try {
    const sessionId = getOrCreateSessionId();
    
    await fetch('/api/track-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'search',
        searchQuery,
        sessionId,
        userId
      })
    });
  } catch (error) {
    console.error('Error tracking search:', error);
  }
}

// Get or create session ID
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('sessionId');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
}
