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
