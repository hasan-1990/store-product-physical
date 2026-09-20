import type { NextConfig } from "next";
import path from "path";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Ensure Next.js treats this folder as the workspace root (helps when multiple lockfiles exist)
  outputFileTracingRoot: path.join(__dirname),
  
  // Output configuration for Docker
  output: 'standalone',
  
  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // ✅ Bundle optimization - بهینه‌سازی برای کاهش TBT
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
    // ✅ Lazy loading for large dependencies
    scrollRestoration: true,
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
  
  // ✅ Webpack optimizations for smaller bundles and lower TBT
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Prevent server-only modules from being bundled in client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        mongodb: false,
      };
      
      // ✅ Aggressive code splitting for better TBT
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        minimize: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 30,
          minSize: 15000,
          maxSize: 200000, // کاهش حجم chunks
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Framework bundle (React + ReactDOM)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|object-assign|prop-types)[\\/]/,
              priority: 60,
              enforce: true,
              reuseExistingChunk: true,
            },
            
            // Next.js chunks
            nextjs: {
              name: 'nextjs',
              test: /[\\/]node_modules[\\/]next[\\/]/,
              priority: 50,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // ✅ Swiper chunk (lazy loaded) - جداسازی برای کاهش TBT
            swiper: {
              name: 'swiper',
              test: /[\\/]node_modules[\\/]swiper[\\/]/,
              priority: 45,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // ✅ Framer Motion chunk (animations)
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 44,
              reuseExistingChunk: true,
              enforce: true,
            },
            
            // React Query chunk
            reactQuery: {
              name: 'react-query',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 42,
              reuseExistingChunk: true,
            },
            
            // Icons chunk
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/](@heroicons|lucide-react)[\\/]/,
              priority: 40,
              reuseExistingChunk: true,
            },
            
            // ✅ UI Libraries (Headless UI, etc.)
            uiLibs: {
              name: 'ui-libs',
              test: /[\\/]node_modules[\\/](@headlessui|react-hot-toast)[\\/]/,
              priority: 38,
              reuseExistingChunk: true,
            },
            
            // Utilities and smaller libs
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](date-fns|clsx|classnames|zod)[\\/]/,
              priority: 35,
              reuseExistingChunk: true,
            },
            
            // Other vendor code
            lib: {
              name(module: any) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return `lib.${packageName?.replace('@', '')}`;
              },
              test: /[\\/]node_modules[\\/]/,
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            
            // Common shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // ✅ Tree shaking for unused code
    // Disabled to avoid conflict with webpack's cacheUnaffected global export effect
    config.optimization.usedExports = false;
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  
  // ✅ Headers for caching and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      // ✅ Static assets caching
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ✅ Images caching
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ✅ Fonts caching
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
