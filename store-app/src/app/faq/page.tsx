import { Metadata } from 'next';
import FAQSection from '@/components/FAQ/FAQSection';

export const metadata: Metadata = {
  title: 'سوالات متداول | راهنمای کامل خرید و پشتیبانی',
  description: 'پاسخ سوالات رایج درباره خرید، ارسال، مرجوعی کالا، روش‌های پرداخت و خدمات پس از فروش. راهنمای کامل مشتریان فروشگاه آنلاین',
  keywords: 'سوالات متداول، راهنمای خرید، پشتیبانی مشتریان، ارسال کالا، مرجوعی، گارانتی، روش پرداخت',
  openGraph: {
    title: 'سوالات متداول | راهنمای کامل خرید',
    description: 'پاسخ کامل سوالات رایج مشتریان درباره خرید، ارسال و خدمات پس از فروش',
    type: 'website',
    locale: 'fa_IR',
    siteName: 'فروشگاه آنلاین',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سوالات متداول | راهنمای کامل خرید',
    description: 'پاسخ کامل سوالات رایج مشتریان درباره خرید، ارسال و خدمات پس از فروش',
  },
  alternates: {
    canonical: '/faq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

async function getFAQs() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/faq`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch FAQs');
    }
    
    const data = await response.json();
    return data.success ? data.faqs.filter((faq: any) => faq.isActive !== false) : [];
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

export default async function FAQPage() {
  const faqs = await getFAQs();
  
  // Generate structured data for FAQs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <FAQSection 
          initialFAQs={faqs}
          title="سوالات متداول"
          subtitle="پاسخ سوالات رایج درباره خرید، ارسال، مرجوعی و خدمات پس از فروش"
        />
      </div>
    </>
  );
}