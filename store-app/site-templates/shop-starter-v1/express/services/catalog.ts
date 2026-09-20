import type { Db } from 'mongodb';
import { getShopDb } from '../shop-db';
import { serializeDoc } from '../serialize';

type ProductDoc = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  categorySlug: string;
  price: number;
  image: string;
  badge?: string | null;
  skinTypes: string[];
  brand: string;
  stock: number;
  active: boolean;
  featured: boolean;
  gallery: string[];
  rating: number;
  reviewCount: number;
  shortDescription: string;
  description: { title: string; body: string; benefits: string[] };
  ingredients: string[];
  howToUse: string[];
  highlights: unknown[];
  reviews: unknown[];
  related: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

function toCatalogProduct(doc: ProductDoc & { id: string }) {
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

function toProductDetail(doc: ProductDoc & { id: string }) {
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

export async function listProducts(
  db: Db,
  options?: { category?: string; activeOnly?: boolean },
) {
  const shop = getShopDb(db);
  const filter: Record<string, unknown> = {};
  if (options?.category) filter.category = options.category;
  if (options?.activeOnly !== false) filter.active = true;

  const docs = await shop.products.find(filter).sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => toCatalogProduct(serializeDoc(doc as ProductDoc)));
}

export async function getProductBySlug(db: Db, slug: string) {
  const shop = getShopDb(db);
  const doc = await shop.products.findOne({ slug, active: true });
  if (!doc) return null;
  return toProductDetail(serializeDoc(doc as ProductDoc));
}

export async function createProduct(
  db: Db,
  input: Omit<ProductDoc, 'createdAt' | 'updatedAt'>,
) {
  const shop = getShopDb(db);
  const now = new Date();
  const result = await shop.products.insertOne({
    ...input,
    createdAt: now,
    updatedAt: now,
  } as Record<string, unknown>);
  return result.insertedId.toString();
}

export async function countProducts(db: Db): Promise<number> {
  const shop = getShopDb(db);
  return shop.products.countDocuments({ active: true });
}

export async function getLowStockProducts(db: Db, limit = 5) {
  const shop = getShopDb(db);
  const docs = await shop.products
    .find({ active: true, stock: { $lte: 5 } })
    .sort({ stock: 1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => {
    const product = serializeDoc(doc as ProductDoc);
    return { id: product.id, name: product.name, stock: product.stock, image: product.image };
  });
}

export async function getSiteContent(db: Db) {
  const shop = getShopDb(db);
  const doc = await shop.siteContent.findOne({ key: 'main' });
  if (!doc) return null;
  const { _id, ...content } = doc;
  return content;
}
