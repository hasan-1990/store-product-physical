// SEO Module Types
export interface SEOSettings {
  id?: string;
  // Meta Tags
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  
  // Twitter Cards
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  
  // Structured Data
  structuredData?: any;
  schemaType?: 'Article' | 'Product' | 'WebSite' | 'BreadcrumbList' | 'Organization';
  
  // URL Management
  slug?: string;
  urlFormat?: 'kebab-case' | 'camelCase' | 'snake_case';
  
  // Performance
  preloadResources?: string[];
  prefetchUrls?: string[];
  lazyLoadImages?: boolean;
  
  // Analytics
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  searchConsoleVerification?: string;
  
  // Site Settings
  siteName?: string;
  siteUrl?: string;
  locale?: string;
  hreflang?: Array<{ lang: string; url: string }>;
  
  // Page specific
  pageType?: 'home' | 'blog' | 'product' | 'category' | 'page';
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  tags?: string[];
  
  // SEO Analysis
  titleLength?: number;
  descriptionLength?: number;
  keywordDensity?: Array<{ word: string; count: number; density: number }>;
  readabilityScore?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface RedirectRule {
  id?: string;
  from: string;
  to: string;
  type: 301 | 302;
  isActive: boolean;
  createdAt?: string;
}

export interface SEOAnalysis {
  pageUrl: string;
  title: {
    text: string;
    length: number;
    isOptimal: boolean;
    suggestions: string[];
  };
  description: {
    text: string;
    length: number;
    isOptimal: boolean;
    suggestions: string[];
  };
  keywords: {
    primary?: string;
    density: Array<{ word: string; count: number; density: number }>;
    suggestions: string[];
  };
  headings: {
    h1Count: number;
    h2Count: number;
    structure: string[];
    issues: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    suggestions: string[];
  };
  links: {
    internal: number;
    external: number;
    broken?: string[];
  };
  performance: {
    loadTime?: number;
    coreWebVitals?: {
      lcp: number; // Largest Contentful Paint
      fid: number; // First Input Delay
      cls: number; // Cumulative Layout Shift
    };
  };
  overallScore: number;
  suggestions: string[];
}

export interface GoogleSearchConsoleData {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  query?: string;
  page?: string;
  date?: string;
}