/**
 * Next Rocket Module Types
 * ماژول بهینه‌سازی پرفورمنس (مشابه WP Rocket)
 */

// ==================== Module Settings ====================
export interface NextRocketSettings {
  enabled: boolean;
  
  // File Optimization
  fileOptimization: {
    enabled: boolean;
    minifyCss: boolean;
    minifyJs: boolean;
    combineCss: boolean;
    combineJs: boolean;
    removeUnusedCss: boolean;
    criticalCss: boolean;
    asyncCss: boolean;
  };
  
  // Media Optimization
  mediaOptimization: {
    enabled: boolean;
    lazyLoadImages: boolean;
    lazyLoadIframes: boolean;
    lazyLoadVideos: boolean;
    lazyLoadBackgrounds: boolean;
    webpConversion: boolean;
    imageDimensions: boolean;
    youtubePreview: boolean;
  };
  
  // Cache System
  cache: {
    enabled: boolean;
    pageCache: boolean;
    browserCache: boolean;
    mobileCache: boolean;
    userCache: boolean;
    cacheLifespan: number; // minutes
    excludeUrls: string[];
    excludeCookies: string[];
    excludeUserAgents: string[];
    preloadCache: boolean;
  };
  
  // JavaScript Optimization
  javascript: {
    enabled: boolean;
    delayExecution: boolean;
    deferLoading: boolean;
    excludeFiles: string[];
    delayTimeout: number; // ms
  };
  
  // Database Optimization
  database: {
    enabled: boolean;
    autoCleanup: boolean;
    cleanupSchedule: string; // cron format
    optimizeIndexes: boolean;
    connectionPooling: boolean;
  };
  
  // CDN Integration
  cdn: {
    enabled: boolean;
    provider: 'cloudflare' | 'custom' | null;
    customCdnUrl: string;
    excludeFiles: string[];
    cloudflareSettings?: {
      zoneId: string;
      apiKey: string;
      email: string;
    };
  };
  
  // Preload System
  preload: {
    enabled: boolean;
    preloadLinks: boolean;
    prefetchLinks: boolean;
    dnsPrefetch: string[];
    preconnect: string[];
    sitemapPreload: boolean;
  };
  
  // Advanced Rules
  advancedRules: {
    neverCacheUrls: string[];
    neverCacheCookies: string[];
    neverCacheUserAgents: string[];
    alwaysPurgeUrls: string[];
    cacheQueryStrings: string[];
  };
}

// ==================== Cache Types ====================
export interface CacheEntry {
  key: string;
  value: string;
  type: 'page' | 'api' | 'image' | 'asset';
  size: number;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  tags: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  redisUsage: number;
  diskUsage: number;
}

// ==================== Performance Metrics ====================
export interface PerformanceMetrics {
  timestamp: Date;
  
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
  
  // Resource Metrics
  totalPageSize: number;
  totalRequests: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  fontSize: number;
  
  // Cache Metrics
  cacheHitRate: number;
  cacheMissRate: number;
  
  // Score
  gtmetrixScore?: number;
  lighthouseScore?: number;
  pagespeedScore?: number;
}

// ==================== Optimization Tasks ====================
export interface OptimizationTask {
  id: string;
  type: 'css' | 'js' | 'image' | 'cache' | 'database';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: OptimizationResult;
  error?: string;
}

export interface OptimizationResult {
  success: boolean;
  beforeSize?: number;
  afterSize?: number;
  savings?: number;
  savingsPercentage?: number;
  filesProcessed?: number;
  duration?: number;
  details?: any;
}

// ==================== Critical CSS ====================
export interface CriticalCssResult {
  url: string;
  css: string;
  size: number;
  originalSize: number;
  savings: number;
  generatedAt: Date;
}

// ==================== Unused CSS ====================
export interface UnusedCssResult {
  file: string;
  originalSize: number;
  unusedSize: number;
  usedSize: number;
  savingsPercentage: number;
  unusedSelectors: string[];
}

// ==================== Module Status ====================
export interface ModuleStatus {
  enabled: boolean;
  version: string;
  lastOptimization?: Date;
  nextScheduledOptimization?: Date;
  performanceScore: number;
  warnings: string[];
  errors: string[];
  statistics: {
    totalOptimizations: number;
    totalBytesSaved: number;
    averageLoadTime: number;
    cacheHitRate: number;
  };
}

// ==================== API Response Types ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OptimizeResponse {
  success: boolean;
  tasks: OptimizationTask[];
  estimatedDuration: number;
  message: string;
}

export interface ClearCacheResponse {
  success: boolean;
  clearedEntries: number;
  clearedSize: number;
  message: string;
}
