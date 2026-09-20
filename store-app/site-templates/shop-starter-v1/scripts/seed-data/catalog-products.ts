export type CatalogCategory =
  | 'face-makeup'
  | 'eye-makeup'
  | 'lip-makeup'
  | 'skincare';

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive';

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  categoryLabel: string;
  price: number;
  image: string;
  badge?: string;
  skinTypes: SkinType[];
  brand: string;
  href?: string;
};

export const catalogCategories: { id: CatalogCategory; label: string }[] = [
  { id: 'face-makeup', label: 'آرایش صورت' },
  { id: 'eye-makeup', label: 'آرایش چشم' },
  { id: 'lip-makeup', label: 'آرایش لب' },
  { id: 'skincare', label: 'مراقبت پوست' },
];

export const skinTypes: { id: SkinType; label: string }[] = [
  { id: 'oily', label: 'چرب' },
  { id: 'dry', label: 'خشک' },
  { id: 'combination', label: 'مختلط' },
  { id: 'sensitive', label: 'حساس' },
];

export const brands = ['همه برندها', 'MUSE Original', 'Organic Essence', 'Velvet Glow'];

export const catalogProducts: CatalogProduct[] = [
  {
    id: '1',
    slug: 'matte-foundation',
    name: 'کرم پودر مات',
    category: 'face-makeup',
    categoryLabel: 'آرایش صورت',
    price: 1_200_000,
    image: '/images/catalog/foundation.jpg',
    badge: 'New In',
    skinTypes: ['combination', 'oily'],
    brand: 'MUSE Original',
  },
  {
    id: '2',
    slug: 'velvet-lipstick',
    name: 'رژ لب مخملی',
    category: 'lip-makeup',
    categoryLabel: 'آرایش لب',
    price: 450_000,
    image: '/images/catalog/velvet-lipstick.jpg',
    badge: 'New In',
    skinTypes: ['dry', 'sensitive'],
    brand: 'Velvet Glow',
  },
  {
    id: '3',
    slug: 'liquid-eyeliner',
    name: 'خط چشم ماژیکی',
    category: 'eye-makeup',
    categoryLabel: 'آرایش چشم',
    price: 380_000,
    image: '/images/catalog/foundation.jpg',
    badge: 'New In',
    skinTypes: ['sensitive'],
    brand: 'MUSE Original',
  },
  {
    id: '4',
    slug: 'powder-eyeshadow',
    name: 'سایه چشم پودری',
    category: 'eye-makeup',
    categoryLabel: 'آرایش چشم',
    price: 620_000,
    image: '/images/catalog/foundation.jpg',
    badge: 'New In',
    skinTypes: ['combination'],
    brand: 'Velvet Glow',
  },
  {
    id: '5',
    slug: 'volume-mascara',
    name: 'ریمل حجم دهنده',
    category: 'eye-makeup',
    categoryLabel: 'آرایش چشم',
    price: 540_000,
    image: '/images/product-lipstick.jpg',
    badge: 'New In',
    skinTypes: ['sensitive'],
    brand: 'MUSE Original',
  },
  {
    id: '6',
    slug: 'liquid-concealer',
    name: 'کانسیلر مایع',
    category: 'face-makeup',
    categoryLabel: 'آرایش صورت',
    price: 490_000,
    image: '/images/product-cream.jpg',
    badge: 'New In',
    skinTypes: ['dry', 'combination'],
    brand: 'Organic Essence',
  },
  {
    id: '7',
    slug: 'glow-blush',
    name: 'رژ گونه درخشان',
    category: 'face-makeup',
    categoryLabel: 'آرایش صورت',
    price: 420_000,
    image: '/images/catalog/promo-night.jpg',
    badge: 'New In',
    skinTypes: ['dry'],
    brand: 'Velvet Glow',
  },
  {
    id: '8',
    slug: 'powder-highlighter',
    name: 'هایلایتر پودری',
    category: 'face-makeup',
    categoryLabel: 'آرایش صورت',
    price: 580_000,
    image: '/images/products/serum-main.jpg',
    badge: 'New In',
    skinTypes: ['combination'],
    brand: 'MUSE Original',
  },
  {
    id: '9',
    slug: 'setting-powder',
    name: 'پودر تثبیت کننده',
    category: 'face-makeup',
    categoryLabel: 'آرایش صورت',
    price: 750_000,
    image: '/images/product-perfume.jpg',
    badge: 'New In',
    skinTypes: ['oily'],
    brand: 'Organic Essence',
  },
  {
    id: '10',
    slug: 'eyebrow-pencil',
    name: 'مداد ابرو',
    category: 'eye-makeup',
    categoryLabel: 'آرایش چشم',
    price: 290_000,
    image: '/images/category-makeup.jpg',
    badge: 'New In',
    skinTypes: ['sensitive'],
    brand: 'MUSE Original',
  },
  {
    id: '11',
    slug: 'lip-balm',
    name: 'بالم لب',
    category: 'lip-makeup',
    categoryLabel: 'آرایش لب',
    price: 180_000,
    image: '/images/catalog/lip-balm.jpg',
    badge: 'New In',
    skinTypes: ['dry', 'sensitive'],
    brand: 'Organic Essence',
  },
  {
    id: '12',
    slug: 'hydrating-serum',
    name: 'سرم آبرسان',
    category: 'skincare',
    categoryLabel: 'مراقبت پوست',
    price: 950_000,
    image: '/images/catalog/hydrating-serum.jpg',
    badge: 'New In',
    skinTypes: ['dry', 'combination', 'sensitive'],
    brand: 'MUSE Original',
    href: '/products/radiance-serum',
  },
];

export const promoCard = {
  tag: 'پیشنهاد ویژه',
  title: 'مجموعه مراقبت شبانه',
  image: '/images/catalog/promo-night.jpg',
  href: '/products?cat=skincare',
};
