import type { Metadata } from 'next';
import { Vazirmatn, Playfair_Display } from 'next/font/google';
import { getSiteContent } from '@/lib/db/site-content';
import { buildCanonicalPath, buildDefaultMetadata, getSiteUrl } from '@/lib/seo';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-body',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const meta = buildDefaultMetadata(content.site);
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: meta.title,
      template: `%s | ${content.site.name}`,
    },
    description: meta.description,
    openGraph: {
      type: 'website',
      locale: meta.locale,
      url: siteUrl,
      siteName: content.site.name,
      title: meta.title,
      description: meta.description,
      images: [{ url: content.hero.image, width: 1200, height: 630, alt: content.site.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [content.hero.image],
    },
    alternates: { canonical: buildCanonicalPath('/') },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
