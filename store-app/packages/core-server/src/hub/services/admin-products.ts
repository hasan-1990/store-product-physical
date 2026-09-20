import { ObjectId, type Db } from 'mongodb';
import { z } from 'zod';

const productMutationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  originalPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  productType: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  downloadUrl: z.string().optional(),
  provisioningType: z.string().optional(),
  templateSlug: z.string().optional(),
  templateId: z.string().optional(),
});

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .slice(0, 80);
}

export async function listAdminProducts(db: Db, limit = 100) {
  const products = await db
    .collection('products')
    .aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $addFields: { category: { $arrayElemAt: ['$category', 0] } } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return products.map((p) => ({
    ...p,
    _id: String(p._id),
    id: String(p._id),
    categoryId: p.categoryId ? String(p.categoryId) : undefined,
    categoryName: p.category?.name,
  }));
}

export async function createAdminProduct(db: Db, body: unknown) {
  const data = productMutationSchema.parse(body);
  const slug = data.slug || slugify(data.name);

  const existing = await db.collection('products').findOne({ slug });
  if (existing) throw new Error('SLUG_EXISTS');

  const now = new Date();
  const doc = {
    ...data,
    slug,
    categoryId: new ObjectId(data.categoryId),
    templateId: data.templateId && ObjectId.isValid(data.templateId) ? new ObjectId(data.templateId) : null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('products').insertOne(doc);
  return { _id: String(result.insertedId), ...doc, categoryId: String(doc.categoryId) };
}

export async function updateAdminProduct(db: Db, id: string, body: Record<string, unknown>) {
  if (!ObjectId.isValid(id)) throw new Error('INVALID_ID');
  const update: Record<string, unknown> = { updatedAt: new Date() };

  for (const key of [
    'name',
    'slug',
    'description',
    'price',
    'originalPrice',
    'stock',
    'imageUrl',
    'active',
    'featured',
    'productType',
    'downloadUrl',
    'provisioningType',
    'templateSlug',
  ]) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (body.categoryId && ObjectId.isValid(String(body.categoryId))) {
    update.categoryId = new ObjectId(String(body.categoryId));
  }

  const result = await db.collection('products').updateOne({ _id: new ObjectId(id) }, { $set: update });
  if (result.matchedCount === 0) throw new Error('NOT_FOUND');
  return db.collection('products').findOne({ _id: new ObjectId(id) });
}

export async function deleteAdminProduct(db: Db, id: string) {
  if (!ObjectId.isValid(id)) throw new Error('INVALID_ID');
  const orderCount = await db.collection('orderItems').countDocuments({ productId: new ObjectId(id) });
  if (orderCount > 0) {
    await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false, updatedAt: new Date() } },
    );
    return { softDeleted: true };
  }
  const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw new Error('NOT_FOUND');
  return { softDeleted: false };
}

export async function validateDiscountCode(
  db: Db,
  code: string,
  cartTotal: number,
) {
  const now = new Date();
  const discount = await db.collection('discountCodes').findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  });

  if (!discount) throw new Error('INVALID_CODE');
  if (discount.usageLimit && Number(discount.usedCount) >= Number(discount.usageLimit)) {
    throw new Error('USAGE_LIMIT');
  }
  if (discount.minOrderAmount && cartTotal < Number(discount.minOrderAmount)) {
    throw new Error('MIN_ORDER');
  }

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (cartTotal * Number(discount.value)) / 100;
    if (discount.maxDiscountAmount && discountAmount > Number(discount.maxDiscountAmount)) {
      discountAmount = Number(discount.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(Number(discount.value), cartTotal);
  }

  return {
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.max(0, cartTotal - discountAmount),
  };
}

export async function listProvinces(db: Db) {
  return db.collection('provinces').find({ enabled: true }).sort({ province: 1 }).toArray();
}

export async function listPaymentGateways(db: Db) {
  return db
    .collection('paymentGateways')
    .find({ $or: [{ enabled: true }, { active: true }] })
    .project({ name: 1, type: 1, enabled: 1, active: 1, testMode: 1 })
    .toArray();
}
