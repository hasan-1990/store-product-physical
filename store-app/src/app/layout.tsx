import type { Metadata } from "next";
import "./globals.css";
import "../styles/hidden-seo.css";
import "../styles/megamenu.css";
import ConditionalNavFooter from '@/components/ConditionalNavFooter';
import FooterServer from '@/components/Footer';
import { Suspense } from 'react';
import Script from 'next/script';
import { getSiteSettings, getDynamicContent } from '@/lib/dynamicContent';
import JsonLdScript from "@/components/JsonLdScript";
import CombinedProviders from "@/components/CombinedProviders";
import Toaster from '@/components/ToasterClient';
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import VisitTracker from "@/components/VisitTracker";
import SmoothScroll from "@/components/SmoothScroll";
import URLSettingsLoader from "@/components/URLSettingsLoader";
import PublicChatbot from "@/components/PublicChatbot";

async function loadJsonSiteSettings() {
  const fs = await import('fs/promises');
  const path = await import('path');
  const settingsPath = path.join(process.cwd(), 'data', 'site-settings.json');
  const fileContent = await fs.readFile(settingsPath, 'utf-8');
  return JSON.parse(fileContent);
}

// تابع دریافت تنظیمات سایت از محتوای داینامیک
// بدون cache تا همیشه از دیتابیس بخواند
async function getSettings() {
  'use server';
  try {
    const [settings, dbContent] = await Promise.all([
      getSiteSettings(),
      getDynamicContent(),
    ]);

    const hasDbContent = Object.keys(dbContent).length > 0;
    if (hasDbContent) {
      return settings;
    }

    // collection خالی است — fallback به JSON (رفتار عادی در dev قبل از seed)
    if (process.env.NODE_ENV === 'development') {
      console.info(
        'ℹ️ dynamicContent در MongoDB خالی است — از data/site-settings.json استفاده می‌شود. برای پر کردن: npm run db:seed'
      );
    }

    const jsonSettings = await loadJsonSiteSettings();
    return { ...jsonSettings, ...settings };
  } catch (error) {
    console.error('⚠️ خطا در خواندن تنظیمات سایت:', error);
    
    // در صورت خطا، تنظیمات پیش‌فرض برگردانیم
    return {
      site_name: 'فروشگاه آنلاین',
      site_description: 'بهترین محصولات با قیمت مناسب',
      seo_description: 'خرید آنلاین محصولات',
      seo_keywords: 'فروشگاه, آنلاین, خرید'
    };
  }
}

// Generate metadata dynamically from JSON file
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  
  return {
    title: settings.seo_title || `${settings.site_name} - ${settings.site_description}`,
    description: settings.seo_description,
    keywords: settings.seo_keywords.split(',').map((k: string) => k.trim()),
    // ✅ Open Graph Tags (برای شبکه‌های اجتماعی)
    openGraph: {
      title: settings.og_title || settings.seo_title || settings.site_name,
      description: settings.og_description || settings.seo_description,
      type: 'website',
      locale: 'fa_IR',
      siteName: settings.site_name,
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
    },
    // ✅ Twitter Card Tags
    twitter: {
      card: 'summary_large_image',
      title: settings.og_title || settings.seo_title || settings.site_name,
      description: settings.og_description || settings.seo_description,
      creator: '@yourtwitterhandle',
    },
    // ✅ SEO و Canonical
    alternates: {
      canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com',
    },
    // ✅ Google و Bing
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}

// Generate viewport separately (Next.js 14+ requirement)
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5KKPXRW3');`
        }} />
        {/* End Google Tag Manager */}
        
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Critical Font Preload */}
        <link
          rel="preload"
          href="/api/fonts/dynamic.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="/api/fonts/dynamic.css"
        />
        
        {/* Google Search Console Verification */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}

        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Google Tag Manager - با afterInteractive برای کاهش TBT */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script 
            id="gtm-bootstrap" 
            strategy="afterInteractive"
          >
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
            `}
          </Script>
        )}

        {/* GA4 direct (fallback if not routed through GTM) - با afterInteractive برای کاهش TBT */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
            strategy="afterInteractive"
          />
        )}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <Script
            id="ga4-init"
            strategy="afterInteractive"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}', { anonymize_ip: true, send_page_view: false });
            `}
          </Script>
        )}

        {/* ✅ JSON-LD Structured Data (Schema.org) - برای Google Rich Snippets */}
        <Suspense fallback={null}>
          <JsonLdScript />
        </Suspense>

        {/* Inline critical CSS (above-the-fold basics) */}
        <style
          dangerouslySetInnerHTML={{ __html: `
          html,body{margin:0;padding:0;overflow-x:hidden;}
          @font-face{font-family:'Yekan';src:url('/fonts/Yekan_400_normal_1758132753132.woff2') format('woff2');font-display:swap;font-weight:400;font-style:normal;}
          body{font-family:'Yekan','system-ui',sans-serif;overflow-y:auto;overscroll-behavior:auto;-webkit-font-smoothing:antialiased;}
          .hero-slider{position:relative;min-height:60vh;height:60vh;}
          img[loading=lazy]{color:transparent;}
          ` }}
        />

        {/* Non-blocking font stylesheet (fallback if dynamic API still needed) */}
        <link rel="preload" as="style" href="/api/fonts/dynamic.css" />
        {/* In Server Components we cannot attach onLoad; load stylesheet normally with rel=stylesheet */}
        <link rel="stylesheet" href="/api/fonts/dynamic.css" />
        <noscript><link rel="stylesheet" href="/api/fonts/dynamic.css" /></noscript>
      </head>
      <body 
        className="antialiased min-h-screen flex flex-col bg-white"
        suppressHydrationWarning={true}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5KKPXRW3"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        {/* GTM NoScript (old - با متغیر محیطی) */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <CombinedProviders>
          {/* Critical Content First */}
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-gray-500">در حال بارگذاری...</div>
          </div>}>
            <ConditionalNavFooter footer={<FooterServer />}>
              {children}
            </ConditionalNavFooter>
          </Suspense>
          
          {/* Non-Critical Components - Lazy Loaded */}
          <Suspense fallback={null}>
            <SmoothScroll />
            <PerformanceOptimizer />
            <URLSettingsLoader />
            <VisitTracker />
            <PublicChatbot />
          </Suspense>
          
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
              },
              error: {
                duration: 5000,
              },
            }}
          />
        </CombinedProviders>
      </body>
    </html>
  );
}
