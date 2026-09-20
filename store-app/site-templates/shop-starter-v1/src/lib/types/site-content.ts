import type { CatalogCategory, SkinType } from '@/lib/catalog';

export type SiteInfo = {
  name: string;
  tagline: string;
  description: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

export type FeatureItem = {
  icon: 'leaf' | 'heart' | 'truck';
  title: string;
  description: string;
};

export type HomeCategory = {
  slug: string;
  title: string;
  image: string;
};

export type TestimonialItem = {
  name: string;
  text: string;
  rating: number;
};

export type ArticleItem = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
};

export type PromoCardContent = {
  tag: string;
  title: string;
  image: string;
  href: string;
};

export type ProductFilterConfig = {
  categories: { id: CatalogCategory; label: string }[];
  skinTypes: { id: SkinType; label: string }[];
  brands: string[];
};

export type SiteContentDocument = {
  key: 'main';
  site: SiteInfo;
  navLinks: NavLink[];
  hero: HeroContent;
  features: FeatureItem[];
  homeCategories: HomeCategory[];
  testimonials: TestimonialItem[];
  articles: ArticleItem[];
  promoCard: PromoCardContent;
  productFilters: ProductFilterConfig;
  updatedAt: Date;
};

export const DEFAULT_SITE_CONTENT: Omit<SiteContentDocument, 'updatedAt'> = {
  key: 'main',
  site: {
    name: 'MUSE',
    tagline: 'زیبایی بازتعریف شد',
    description:
      'الهام‌بخش زیبایی شما با بهترین مواد اولیه و پیشرفته‌ترین تکنولوژی‌های روز دنیا.',
  },
  navLinks: [
    { label: 'مراقبت پوست', href: '/products?cat=skincare' },
    { label: 'آرایشی', href: '/products?cat=makeup' },
    { label: 'مراقبت مو', href: '/products?cat=hair' },
    { label: 'عطر و رایحه', href: '/products?cat=fragrance' },
  ],
  hero: {
    eyebrow: 'محصولات جدید',
    title: 'زیبایی بازتعریف شد',
    description:
      'ترکیبی از علم و هنر برای درخشش طبیعی شما. با مجموعه‌ی جدید میوز، هر روز فرصتی برای تجلی زیبایی است.',
    ctaLabel: 'خرید مجموعه',
    ctaHref: '/products',
    image: '/images/hero.jpg',
  },
  features: [
    {
      icon: 'leaf',
      title: 'کاملاً ارگانیک',
      description: 'استفاده از خالص‌ترین مواد طبیعی برای سلامت پوست شما.',
    },
    {
      icon: 'heart',
      title: 'بدون تست حیوانی',
      description: 'ما به طبیعت و تمام موجودات زنده احترام می‌گذاریم.',
    },
    {
      icon: 'truck',
      title: 'ارسال سریع',
      description: 'تحویل محصولات محبوب شما در کوتاه‌ترین زمان ممکن.',
    },
  ],
  homeCategories: [
    { slug: 'makeup', title: 'آرایشی', image: '/images/category-makeup.jpg' },
    { slug: 'skincare', title: 'مراقبت پوست', image: '/images/category-skincare.jpg' },
    { slug: 'hair', title: 'مراقبت مو', image: '/images/category-hair.jpg' },
    { slug: 'fragrance', title: 'عطر و رایحه', image: '/images/category-fragrance.jpg' },
  ],
  testimonials: [
    {
      name: 'سارا رضایی',
      text: 'بهترین تجربه‌ای که از یک برند آرایشی داشتم. کیفیت محصولات فوق‌العاده است و بسته‌بندی آن حس لوکس بودن را کاملاً منتقل می‌کند.',
      rating: 5,
    },
    {
      name: 'مریم سعادت',
      text: 'سرم‌های پوستی میوز واقعاً معجزه می‌کنند. بعد از دو هفته استفاده، شفافیت و طراوت پوستم کاملاً مشهود است.',
      rating: 5,
    },
    {
      name: 'نسترن امیری',
      text: 'رایحه‌های عطر میوز بی‌نظیر هستند. ماندگاری بالا و بوی بسیار خاص که همیشه دیگران را مشتاق به پرسیدن نام عطر می‌کند.',
      rating: 5,
    },
  ],
  articles: [
    {
      slug: 'spring-glow',
      tag: 'آموزش',
      title: 'رازهای درخشش پوست در فصل بهار',
      excerpt:
        'چگونه با تغییر فصل، روتین پوستی خود را برای حفظ شادابی و طراوت تنظیم کنیم...',
      image: '/images/blog-spring.jpg',
    },
    {
      slug: 'herbal-oils',
      tag: 'ترکیبات',
      title: 'جادوی روغن‌های گیاهی در سلامت مو',
      excerpt: 'بررسی عمیق خواص آرگان و آلوئه‌ورا برای بازسازی موهای آسیب‌دیده و کدر...',
      image: '/images/blog-oils.jpg',
    },
  ],
  promoCard: {
    tag: 'پیشنهاد ویژه',
    title: 'مجموعه مراقبت شبانه',
    image: '/images/catalog/promo-night.jpg',
    href: '/products?cat=skincare',
  },
  productFilters: {
    categories: [
      { id: 'face-makeup', label: 'آرایش صورت' },
      { id: 'eye-makeup', label: 'آرایش چشم' },
      { id: 'lip-makeup', label: 'آرایش لب' },
      { id: 'skincare', label: 'مراقبت پوست' },
    ],
    skinTypes: [
      { id: 'oily', label: 'چرب' },
      { id: 'dry', label: 'خشک' },
      { id: 'combination', label: 'مختلط' },
      { id: 'sensitive', label: 'حساس' },
    ],
    brands: ['همه برندها', 'MUSE Original', 'Organic Essence', 'Velvet Glow'],
  },
};
