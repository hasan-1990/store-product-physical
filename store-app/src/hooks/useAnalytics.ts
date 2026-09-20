import { useEffect, useCallback, createElement } from 'react';
import { analyticsManager } from '@/components/analytics/AdvancedAnalytics';
import { initAnalyticsOnce, trackViewItem, trackAddToCart as dlAddToCart, trackPurchase as dlPurchase } from '@/lib/analytics';

// Custom Hook for Analytics
export function useAnalytics() {
  useEffect(() => {
    // Initialize analytics when hook is used
    analyticsManager.init();
    initAnalyticsOnce();
  }, []);

  // Track page view
  const trackPageView = useCallback((page?: string) => {
    const currentPage = page || window.location.pathname;
    analyticsManager.trackEvent({
      action: 'page_view',
      category: 'navigation',
      label: currentPage
    });
  }, []);

  // Track user signup
  const trackSignup = useCallback((method?: string) => {
    analyticsManager.trackGoal('signup', 10, { signup_method: method });
    analyticsManager.trackFormSubmission('signup', true, { method });
  }, []);

  // Track user login
  const trackLogin = useCallback((method?: string) => {
    analyticsManager.trackEvent({
      action: 'login',
      category: 'auth',
      label: method,
      custom_parameters: { login_method: method }
    });
  }, []);

  // Track product view
  const trackProductView = useCallback((productData: {
    product_id: string;
    product_name: string;
    category: string;
    price: number;
  }) => {
    analyticsManager.trackProductInteraction('view_item', productData);
    // dataLayer push
    trackViewItem({
      item_id: productData.product_id,
      item_name: productData.product_name,
      item_category: productData.category,
      price: productData.price,
      quantity: 1
    });
    
    // Enhanced GA4 tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_item', {
        currency: 'USD',
        value: productData.price,
        items: [{
          item_id: productData.product_id,
          item_name: productData.product_name,
          category: productData.category,
          price: productData.price,
          quantity: 1
        }]
      });
    }
  }, []);

  // Track add to cart
  const trackAddToCart = useCallback((productData: {
    product_id: string;
    product_name: string;
    category: string;
    price: number;
    quantity: number;
  }) => {
    analyticsManager.trackProductInteraction('add_to_cart', productData);
    dlAddToCart({
      item_id: productData.product_id,
      item_name: productData.product_name,
      item_category: productData.category,
      price: productData.price,
      quantity: productData.quantity
    });
    
    // Enhanced GA4 tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: productData.price * productData.quantity,
        items: [{
          item_id: productData.product_id,
          item_name: productData.product_name,
          category: productData.category,
          price: productData.price,
          quantity: productData.quantity
        }]
      });
    }
  }, []);

  // Track purchase
  const trackPurchase = useCallback((purchaseData: {
    transaction_id: string;
    total_amount: number;
    items: Array<{
      product_id: string;
      product_name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    payment_method?: string;
    shipping_cost?: number;
    tax?: number;
  }) => {
    // Convert items format
    const formattedItems = purchaseData.items.map(item => ({
      item_id: item.product_id,
      item_name: item.product_name,
      category: item.category,
      quantity: item.quantity,
      price: item.price
    }));

    analyticsManager.trackPurchase({
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.total_amount,
      currency: 'USD',
      items: formattedItems
    });
    dlPurchase({
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.total_amount,
      currency: 'USD',
      tax: purchaseData.tax,
      shipping: purchaseData.shipping_cost,
      items: formattedItems.map(i => ({
        item_id: i.item_id,
        item_name: i.item_name,
        item_category: i.category,
        price: i.price,
        quantity: i.quantity
      }))
    });

    // Additional purchase tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.total_amount,
        currency: 'USD',
        shipping: purchaseData.shipping_cost || 0,
        tax: purchaseData.tax || 0,
        payment_type: purchaseData.payment_method || 'unknown',
        items: formattedItems
      });
    }
  }, []);

  // Track search
  const trackSearch = useCallback((searchTerm: string, results?: number) => {
    analyticsManager.trackEvent({
      action: 'search',
      category: 'engagement',
      label: searchTerm,
      value: results,
      custom_parameters: {
        search_term: searchTerm,
        results_count: results
      }
    });

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'search', {
        search_term: searchTerm,
        results_count: results
      });
    }
  }, []);

  // Track contact form
  const trackContactForm = useCallback((success: boolean, formData?: Record<string, any>) => {
    analyticsManager.trackFormSubmission('contact', success, formData);
    
    if (success) {
      analyticsManager.trackGoal('contact', 5, formData);
    }
  }, []);

  // Track newsletter signup
  const trackNewsletterSignup = useCallback((email: string, source?: string) => {
    analyticsManager.trackEvent({
      action: 'newsletter_signup',
      category: 'engagement',
      label: source,
      custom_parameters: {
        email_domain: email.split('@')[1],
        source: source || 'unknown'
      }
    });

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'sign_up', {
        method: 'newsletter',
        source: source
      });
    }
  }, []);

  // Track file download
  const trackDownload = useCallback((fileName: string, fileType: string) => {
    analyticsManager.trackEvent({
      action: 'file_download',
      category: 'engagement',
      label: fileName,
      custom_parameters: {
        file_name: fileName,
        file_type: fileType
      }
    });

    analyticsManager.trackGoal('download', 1, { fileName, fileType });
  }, []);

  // Track video interaction
  const trackVideoInteraction = useCallback((action: 'play' | 'pause' | 'complete', videoTitle: string, progress?: number) => {
    analyticsManager.trackEvent({
      action: `video_${action}`,
      category: 'media',
      label: videoTitle,
      value: progress,
      custom_parameters: {
        video_title: videoTitle,
        progress_percent: progress
      }
    });
  }, []);

  // Track social share
  const trackSocialShare = useCallback((platform: string, contentType: string, contentId?: string) => {
    analyticsManager.trackEvent({
      action: 'share',
      category: 'social',
      label: platform,
      custom_parameters: {
        platform,
        content_type: contentType,
        content_id: contentId
      }
    });

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: contentType,
        item_id: contentId
      });
    }
  }, []);

  // Track error
  const trackError = useCallback((error: string, context?: string) => {
    analyticsManager.trackEvent({
      action: 'error',
      category: 'technical',
      label: error,
      custom_parameters: {
        error_message: error,
        context: context || 'unknown',
        page: window.location.pathname,
        user_agent: navigator.userAgent
      }
    });
  }, []);

  // Track performance metrics
  const trackPerformance = useCallback((metrics: {
    page_load_time?: number;
    largest_contentful_paint?: number;
    first_input_delay?: number;
    cumulative_layout_shift?: number;
  }) => {
    analyticsManager.trackPagePerformance({
      page_load_time: metrics.page_load_time || 0,
      largest_contentful_paint: metrics.largest_contentful_paint || 0,
      first_input_delay: metrics.first_input_delay || 0,
      cumulative_layout_shift: metrics.cumulative_layout_shift || 0
    });
  }, []);

  // Track custom event
  const trackCustomEvent = useCallback((action: string, category: string, label?: string, value?: number, customParams?: Record<string, any>) => {
    analyticsManager.trackEvent({
      action,
      category,
      label,
      value,
      custom_parameters: customParams
    });
  }, []);

  // SEO-specific tracking
  const trackSEOEvent = useCallback((eventType: 'fast_lcp' | 'fast_fid' | 'stable_cls' | 'long_session' | 'content_engagement', data?: Record<string, any>) => {
    analyticsManager.trackGoal(eventType, undefined, data);
  }, []);

  const trackContentEngagement = useCallback((action: 'scroll' | 'click' | 'share' | 'download', details?: string) => {
    analyticsManager.trackEvent({
      action: 'content_engagement',
      category: 'seo',
      label: details,
      custom_parameters: { engagement_type: action }
    });
    if (action === 'scroll' && details?.includes('75%')) {
      analyticsManager.trackGoal('content_engagement');
    }
  }, []);

  const trackInternalLink = useCallback((linkUrl: string, linkText: string) => {
    analyticsManager.trackEvent({
      action: 'internal_link_click',
      category: 'navigation',
      label: linkText,
      custom_parameters: {
        link_url: linkUrl,
        source_page: window.location.pathname
      }
    });
  }, []);

  return {
    // Page tracking
    trackPageView,
    
    // Authentication
    trackSignup,
    trackLogin,
    
    // E-commerce
    trackProductView,
    trackAddToCart,
    trackPurchase,
    
    // Engagement
    trackSearch,
    trackContactForm,
    trackNewsletterSignup,
    trackDownload,
    trackVideoInteraction,
    trackSocialShare,
    
    // Technical
    trackError,
    trackPerformance,
    
    // Custom
    trackCustomEvent,
    
    // SEO-specific
    trackSEOEvent,
    trackContentEngagement,
    trackInternalLink,
    
    // Direct access to manager
    analytics: analyticsManager
  };
}

// HOC for automatic page view tracking
export function withAnalytics<T extends Record<string, any>>(Component: React.ComponentType<T>) {
  return function AnalyticsWrapper(props: T) {
    const { trackPageView } = useAnalytics();
    
    useEffect(() => {
      trackPageView();
    }, [trackPageView]);
    
    return createElement(Component, props);
  };
}

// Helper functions for common tracking scenarios
export const AnalyticsHelpers = {
  // Track user journey step
  trackJourneyStep: (step: string, data?: Record<string, any>) => {
    analyticsManager.trackEvent({
      action: 'journey_step',
      category: 'user_flow',
      label: step,
      custom_parameters: {
        step_name: step,
        step_order: data?.order,
        ...data
      }
    });
  },

  // Track feature usage
  trackFeatureUsage: (feature: string, action: string, data?: Record<string, any>) => {
    analyticsManager.trackEvent({
      action: `feature_${action}`,
      category: 'features',
      label: feature,
      custom_parameters: {
        feature_name: feature,
        action_type: action,
        ...data
      }
    });
  },

  // Track conversion funnel
  trackFunnelStep: (funnel: string, step: string, stepNumber: number) => {
    analyticsManager.trackEvent({
      action: 'funnel_step',
      category: 'conversion',
      label: `${funnel}_${step}`,
      value: stepNumber,
      custom_parameters: {
        funnel_name: funnel,
        step_name: step,
        step_number: stepNumber
      }
    });
  }
};