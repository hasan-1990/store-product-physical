import type { CatalogCategory, CatalogProduct, SkinType } from '@/lib/catalog';
import type { ProductDetail } from '@/lib/products';
import { connectDB } from '@/lib/mongodb';
import { serializeDoc } from '@/lib/serialize';

export type ProductDocument = {
  slug: string;
  name: string;
  category: CatalogCategory;
  categoryLabel: string;
  categorySlug: string;
  price: number;
  image: string;
  badge?: string | null;
  skinTypes: SkinType[];
  brand: string;
  stock: number;
  active: boolean;
  featured: boolean;
  gallery: string[];
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: ProductDetail['description'];
  ingredients: string[];
  howToUse: string[];
  highlights: ProductDetail['highlights'];
  reviews: ProductDetail['reviews'];
  related: ProductDetail['related'];
  createdAt: Date;
  updatedAt: Date;
};

function toCatalogProduct(doc: ProductDocument & { id: string }): CatalogProduct {
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    categoryLabel: doc.categoryLabel,
    price: doc.price,
    image: doc.image,
    badge: doc.badge ?? undefined,
    skinTypes: doc.skinTypes,
    brand: doc.brand,
  };
}

function toProductDetail(doc: ProductDocument & { id: string }): ProductDetail {
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    category: doc.categoryLabel,
    categorySlug: doc.categorySlug,
    price: doc.price,
    image: doc.image,
    gallery: doc.gallery.length > 0 ? doc.gallery : [doc.image],
    badge: doc.badge ?? null,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    shortDescription: doc.shortDescription,
    description: doc.description,
    ingredients: doc.ingredients,
    howToUse: doc.howToUse,
    highlights: doc.highlights,
    reviews: doc.reviews,
    related: doc.related,
  };
}

export async function listProducts(options?: {
  category?: string;
  activeOnly?: boolean;
}): Promise<CatalogProduct[]> {
  const db = await connectDB();
  const filter: Record<string, unknown> = {};
  if (options?.category) filter.category = options.category;
  if (options?.activeOnly !== false) filter.active = true;

  const docs = await db.products
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) => toCatalogProduct(serializeDoc(doc as unknown as ProductDocument)));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const db = await connectDB();
  const doc = await db.products.findOne({ slug, active: true });
  if (!doc) return null;
  return toProductDetail(serializeDoc(doc as unknown as ProductDocument));
}

export async function getProductDocBySlug(slug: string) {
  const db = await connectDB();
  const doc = await db.products.findOne({ slug });
  if (!doc) return null;
  return serializeDoc(doc as unknown as ProductDocument);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const db = await connectDB();
  const docs = await db.products.find({ active: true }, { projection: { slug: 1 } }).toArray();
  return docs.map((doc) => String((doc as unknown as { slug: string }).slug));
}

export async function createProduct(input: Omit<ProductDocument, 'createdAt' | 'updatedAt'>) {
  const db = await connectDB();
  const now = new Date();
  const result = await db.products.insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
  } as Record<string, unknown>);
  return result.insertedId.toString();
}

export async function listFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  const db = await connectDB();
  const docs = await db.products
    .find({ active: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (docs.length >= limit) {
    return docs.map((doc) => toCatalogProduct(serializeDoc(doc as unknown as ProductDocument)));
  }

  const fallback = await db.products
    .find({ active: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return fallback.map((doc) => toCatalogProduct(serializeDoc(doc as unknown as ProductDocument)));
}

export async function countProducts(): Promise<number> {
  const db = await connectDB();
  return db.products.countDocuments({ active: true });
}

export async function getLowStockProducts(limit = 5) {
  const db = await connectDB();
  const docs = await db.products
    .find({ active: true, stock: { $lte: 5 } })
    .sort({ stock: 1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => {
    const product = serializeDoc(doc as unknown as ProductDocument);
    return {
      id: product.id,
      name: product.name,
      stock: product.stock,
      image: product.image,
    };
  });
}
