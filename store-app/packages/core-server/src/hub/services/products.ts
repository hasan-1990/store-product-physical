import { ObjectId, type Db } from 'mongodb';

function formatProduct(raw: Record<string, unknown>) {
  return {
    _id: String(raw._id),
    id: String(raw._id),
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: raw.price,
    originalPrice: raw.originalPrice,
    stock: raw.stock,
    imageUrl: raw.imageUrl,
    gallery: raw.gallery || [],
    categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
    active: raw.active,
    featured: raw.featured,
    productType: raw.productType,
    views: raw.views,
    rating: raw.rating,
    provisioningType: raw.provisioningType,
    templateSlug: raw.templateSlug,
  };
}

export async function listHubProducts(
  db: Db,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    active?: boolean;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 10, 100);
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }
  if (options.categoryId && ObjectId.isValid(options.categoryId)) {
    filter.categoryId = new ObjectId(options.categoryId);
  }
  if (options.active !== undefined) filter.active = options.active;
  if (options.featured !== undefined) filter.featured = options.featured;

  const sortField = options.sortBy || 'createdAt';
  const sortDir = options.sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    db.collection('products').find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit).toArray(),
    db.collection('products').countDocuments(filter),
  ]);

  return {
    success: true,
    data: products.map((p) => formatProduct(p as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getHubProductById(db: Db, id: string) {
  if (!ObjectId.isValid(id)) return null;
  await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } });
  const rows = await db
    .collection('products')
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
      { $addFields: { category: { $arrayElemAt: ['$category', 0] } } },
    ])
    .toArray();
  if (!rows.length) return null;
  return formatProduct(rows[0] as Record<string, unknown>);
}
