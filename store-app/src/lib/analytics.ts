// Centralized Google Tag Manager & GA4 helper
// Usage: dataLayerPush({ event: 'view_item', ... })

interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

interface PurchaseData {
  transaction_id: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  items: GA4Item[];
}

// Ensure dataLayer exists
export function ensureDataLayer() {
  if (typeof window !== 'undefined') {
    (window as any).dataLayer = (window as any).dataLayer || [];
    return (window as any).dataLayer;
  }
  return [];
}

export function dataLayerPush(payload: Record<string, any>) {
  if (typeof window === 'undefined') return;
  ensureDataLayer().push(payload);
}

export function trackViewItem(item: GA4Item) {
  dataLayerPush({
    event: 'view_item',
    ecommerce: {
      currency: 'USD',
      value: item.price || 0,
      items: [item]
    }
  });
}

export function trackAddToCart(item: GA4Item) {
  dataLayerPush({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'USD',
      value: (item.price || 0) * (item.quantity || 1),
      items: [item]
    }
  });
}

export function trackBeginCheckout(items: GA4Item[], value?: number) {
  dataLayerPush({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'USD',
      value: value || items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0),
      items
    }
  });
}

export function trackAddPaymentInfo(items: GA4Item[], payment_type: string) {
  dataLayerPush({
    event: 'add_payment_info',
    ecommerce: {
      payment_type,
      currency: 'USD',
      value: items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0),
      items
    }
  });
}

export function trackPurchase(p: PurchaseData) {
  dataLayerPush({
    event: 'purchase',
    ecommerce: {
      transaction_id: p.transaction_id,
      value: p.value,
      tax: p.tax || 0,
      shipping: p.shipping || 0,
      currency: p.currency || 'USD',
      items: p.items
    }
  });
}

export function trackCustomConversion(name: string, params?: Record<string, any>) {
  dataLayerPush({
    event: name,
    ...params
  });
}

export function initAnalyticsOnce() {
  if (typeof window === 'undefined') return;
  if ((window as any).__ANALYTICS_INIT__) return;
  (window as any).__ANALYTICS_INIT__ = true;
  ensureDataLayer();
}
