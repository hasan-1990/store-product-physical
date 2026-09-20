export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  image: string;
  gallery: string[];
  badge: string | null;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: {
    title: string;
    body: string;
    benefits: string[];
  };
  ingredients: string[];
  howToUse: string[];
  highlights: { icon: string; label: string }[];
  reviews: {
    name: string;
    verified: boolean;
    rating: number;
    text: string;
  }[];
  related: {
    slug: string;
    name: string;
    price: number;
    image: string;
  }[];
};

export const productDetails: Record<string, ProductDetail> = {
  'radiance-serum': {
    id: '1',
    slug: 'radiance-serum',
    name: 'سرم جوانساز رادیانس',
    category: 'مراقبت پوست',
    categorySlug: 'skincare',
    price: 4_850_000,
    image: '/images/products/serum-main.jpg',
    gallery: [
      '/images/products/serum-main.jpg',
      '/images/products/serum-thumb-1.jpg',
      '/images/products/serum-thumb-2.jpg',
      '/images/products/serum-thumb-3.jpg',
    ],
    badge: 'جدید',
    rating: 4.8,
    reviewCount: 48,
    shortDescription:
      'تجربه‌ای بی‌نظیر از درخشش و جوانی. سرم رادیانس با بهره‌گیری از تکنولوژی نانو و عصاره‌های گیاهی کمیاب، به لایه‌های عمقی پوست نفوذ کرده و خطوط ریز را از بین می‌برد.',
    description: {
      title: 'جادوی درخشش',
      body: 'سرم جوانساز رادیانس فراتر از یک محصول مراقبتی است؛ این یک سرمایه‌گذاری برای آینده پوست شماست. فرمولاسیون منحصر به فرد ما شامل ویتامین C پایدار، هیالورونیک اسید با وزن‌های مولکولی متفاوت و عصاره گل صدتومانی است که همزمان با آبرسانی، لک‌های تیره را هدف قرار داده و بافتی مخملی به پوست می‌بخشد.',
      benefits: [
        'افزایش خاصیت ارتجاعی پوست تا ۴۰٪ در ۴ هفته',
        'کاهش محسوس عمق چروک‌های پیشانی و دور چشم',
        'روشن‌کننده قوی و یکنواخت‌کننده تناژ پوست',
      ],
    },
    ingredients: [
      'آب خالص‌شده',
      'هیالورونیک اسید (سه وزن مولکولی)',
      'ویتامین C پایدار (Ascorbyl Glucoside)',
      'عصاره گل صدتومانی',
      'نیاسینامید ۵٪',
      'پانتنول',
      'عصاره آلوئه‌ورا',
    ],
    howToUse: [
      'صبح و شب، روی پوست تمیز و خشک، ۲ تا ۳ قطره را روی صورت و گردن بمالید.',
      'با حرکات ملایم به سمت بالا ماساژ دهید تا جذب شود.',
      'سپس مرطوب‌کننده و ضدآفتاب (صبح‌ها) را استفاده کنید.',
      'برای نتیجه بهتر، حداقل ۴ هفته به‌صورت منظم استفاده کنید.',
    ],
    highlights: [
      { icon: 'leaf', label: '۱۰۰٪ ارگانیک' },
      { icon: 'heart', label: 'بدون تست حیوانی' },
    ],
    reviews: [
      {
        name: 'سارا محمدی',
        verified: true,
        rating: 5,
        text: 'واقعاً شگفت‌انگیزه! بعد از دو هفته استفاده، همه متوجه درخشش پوستم شدن. بافتش خیلی سبکه و اصلاً حس چربی به جا نمیذاره.',
      },
      {
        name: 'مریم کریمی',
        verified: true,
        rating: 4,
        text: 'عالیه برای پوست‌های حساس. من همیشه مشکل قرمزی داشتم ولی این سرم خیلی آرومش کرد. بسته‌بندی‌ش هم خیلی شیکه.',
      },
    ],
    related: [
      {
        slug: 'peony-toner',
        name: 'تونر آبرسان پیونی',
        price: 1_950_000,
        image: '/images/products/related-toner.jpg',
      },
      {
        slug: 'night-cream',
        name: 'کرم شب بازسازی‌کننده',
        price: 3_400_000,
        image: '/images/products/related-night-cream.jpg',
      },
      {
        slug: 'face-elixir',
        name: 'روغن صورت الکسیر',
        price: 2_800_000,
        image: '/images/products/related-face-oil.jpg',
      },
      {
        slug: 'eye-cream',
        name: 'کرم دور چشم رادیانس',
        price: 1_600_000,
        image: '/images/products/related-eye-cream.jpg',
      },
    ],
  },
};

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return productDetails[slug];
}

export function getAllProductSlugs(): string[] {
  return Object.keys(productDetails);
}
