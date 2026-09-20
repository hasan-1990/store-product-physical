import type { NextConfig } from "next";
import path from "path";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const cdnBase = process.env.CDN_URL || process.env.NEXT_PUBLIC_CDN_URL;

function getCoreApiBase(): string {
  const explicit = process.env.CORE_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const port = process.env.CORE_SERVER_PORT?.trim() || '4000';
  return `http://127.0.0.1:${port}`;
}

/** در dev پیش‌فرض /api و /uploads به Express (core-server) پروکسی می‌شود */
function shouldProxyApiToCore(): boolean {
  if (process.env.NEXT_PROXY_API_TO_CORE === 'false') return false;
  if (process.env.NEXT_PROXY_API_TO_CORE === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

const nextConfig: NextConfig = {
  // CDN برای static assets (اختیاری — Q4 Scale)
  ...(cdnBase ? { assetPrefix: cdnBase.replace(/\/$/, '') } : {}),

  // Ensure Next.js treats this folder as the workspace root (helps when multiple lockfiles exist)
  outputFileTracingRoot: path.join(__dirname),
  
  // Output configuration for Docker
  output: 'standalone',
  
  // ✅ Performance optimizations - حذف console در production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // فقط error و warn نگه داشته شود
    } : false,
  },
  
  // ✅ Bundle optimization - بهینه‌سازی imports برای کاهش TBT
  experimental: {
    optimizePackageImports: [
      '@heroicons/react', 
      '@headlessui/react', 
      'framer-motion', 
      'react-hot-toast',
      'swiper',
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
      'zod'
    ],
    scrollRestoration: true, // بهبود تجربه کاربری
  },
  
  // Modern bundler configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack: keep Next.js default chunk splitting; custom splitChunks breaks client navigation
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        mongodb: false,
      };
    }

    return config;
  },
  
  // Include ioredis and other external packages in standalone build
  serverExternalPackages: ['ioredis', 'bcrypt', 'sharp', 'mongodb'],
  
  // React strict mode - disabled to prevent double rendering in development
  reactStrictMode: false,
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'], // فقط WebP برای کاهش request ها و compatibility بهتر
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fathemes.com',
      },
      {
        protocol: 'http',
        hostname: 'fathemes.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4000',
        pathname: '**',
      },
    ],
  },

  /** Express backend (:4000) — Next frontend (:3000) */
  async rewrites() {
    if (!shouldProxyApiToCore()) return [];
    const core = getCoreApiBase();
    return [
      { source: '/api/:path*', destination: `${core}/api/:path*` },
      { source: '/uploads/:path*', destination: `${core}/uploads/:path*` },
    ];
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
