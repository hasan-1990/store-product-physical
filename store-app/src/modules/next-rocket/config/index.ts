/**
 * Next Rocket Configuration
 * تنظیمات پیش‌فرض ماژول
 */

import { NextRocketSettings } from '../types';

export const DEFAULT_SETTINGS: NextRocketSettings = {
  enabled: true,
  
  // File Optimization - بهینه‌سازی فایل‌ها
  fileOptimization: {
    enabled: true,
    minifyCss: true,
    minifyJs: true,
    combineCss: true,
    combineJs: false, // ممکنه مشکل ایجاد کنه
    removeUnusedCss: true,
    criticalCss: true,
    asyncCss: true,
  },
  
  // Media Optimization - بهینه‌سازی رسانه‌ها
  mediaOptimization: {
    enabled: true,
    lazyLoadImages: true,
    lazyLoadIframes: true,
    lazyLoadVideos: true,
    lazyLoadBackgrounds: true,
    webpConversion: true,
    imageDimensions: true,
    youtubePreview: true,
  },
  
  // Cache System - سیستم کش
  cache: {
    enabled: true,
    pageCache: true,
    browserCache: true,
    mobileCache: true,
    userCache: false, // برای سایت‌های شخصی‌سازی شده
    cacheLifespan: 10, // 10 دقیقه
    excludeUrls: [
      '/admin/*',
      '/profile/*',
      '/cart',
      '/checkout',
      '/api/auth/*',
    ],
    excludeCookies: ['auth-token', 'session', 'cart'],
    excludeUserAgents: ['bot', 'crawler', 'spider'],
    preloadCache: true,
  },
  
  // JavaScript Optimization - بهینه‌سازی جاوااسکریپت
  javascript: {
    enabled: true,
    delayExecution: true,
    deferLoading: true,
    excludeFiles: [
      'gtm.js',
      'analytics.js',
      'critical-*.js',
    ],
    delayTimeout: 3000, // 3 ثانیه بعد از لود
  },
  
  // Database Optimization - بهینه‌سازی دیتابیس
  database: {
    enabled: true,
    autoCleanup: true,
    cleanupSchedule: '0 2 * * *', // هر شب ساعت 2
    optimizeIndexes: true,
    connectionPooling: true,
  },
  
  // CDN Integration - اتصال به CDN
  cdn: {
    enabled: false,
    provider: null,
    customCdnUrl: '',
    excludeFiles: ['/api/*', '/admin/*'],
    cloudflareSettings: undefined,
  },
  
  // Preload System - سیستم پیش‌بارگذاری
  preload: {
    enabled: true,
    preloadLinks: true,
    prefetchLinks: true,
    dnsPrefetch: [
      // 'https://fonts.googleapis.com', // حذف شد - استفاده از فونت‌های محلی
      'https://www.googletagmanager.com',
    ],
    preconnect: [
      // 'https://fonts.gstatic.com', // حذف شد - استفاده از فونت‌های محلی
    ],
    sitemapPreload: true,
  },
  
  // Advanced Rules - قوانین پیشرفته
  advancedRules: {
    neverCacheUrls: [],
    neverCacheCookies: [],
    neverCacheUserAgents: [],
    alwaysPurgeUrls: [],
    cacheQueryStrings: ['page', 'category', 'sort'],
  },
};

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  lcp: {
    good: 2500,
    needsImprovement: 4000,
  },
  fid: {
    good: 100,
    needsImprovement: 300,
  },
  cls: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  fcp: {
    good: 1800,
    needsImprovement: 3000,
  },
  ttfb: {
    good: 600,
    needsImprovement: 1500,
  },
};

// Cache Sizes
export const CACHE_LIMITS = {
  memory: 100 * 1024 * 1024, // 100MB
  redis: 500 * 1024 * 1024, // 500MB
  disk: 2 * 1024 * 1024 * 1024, // 2GB
};

// Optimization Priorities
export const OPTIMIZATION_PRIORITY = [
  'criticalCss',
  'removeUnusedCss',
  'delayJavascript',
  'lazyLoadImages',
  'minifyCss',
  'minifyJs',
  'pageCache',
];
