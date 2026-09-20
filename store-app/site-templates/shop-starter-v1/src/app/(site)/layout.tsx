import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/components/providers/CartProvider';
import { getSiteContent } from '@/lib/db/site-content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();

  return (
    <CartProvider>
      <Header site={content.site} navLinks={content.navLinks} />
      <main>{children}</main>
      <Footer site={content.site} navLinks={content.navLinks} />
    </CartProvider>
  );
}
