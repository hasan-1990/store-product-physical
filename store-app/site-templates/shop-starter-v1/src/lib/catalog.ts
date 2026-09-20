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
