import { ObjectId, type Db, type Document } from 'mongodb';
import { z } from 'zod';

function categoryIdFilter(id: string | ObjectId): any {
  const str = id instanceof ObjectId ? id.toString() : String(id);
  if (!ObjectId.isValid(str)) return { _id: str };
  const oid = new ObjectId(str);
  return { $or: [{ _id: oid }, { _id: str }] };
}

function categoryRefFilter(field: string, id: string | ObjectId): any {
  const str = id instanceof ObjectId ? id.toString() : String(id);
  if (!ObjectId.isValid(str)) return { [field]: str };
  const oid = new ObjectId(str);
  return { [field]: { $in: [oid, str] } };
}

async function findCategoryById(db: Db, categoryId: string) {
  return db.collection('categories').findOne(categoryIdFilter(categoryId));
}

function transformCategory(cat: Document & { _id: ObjectId; sequentialId?: number }) {
  const { _id, ...rest } = cat;
  return {
    id: cat.sequentialId || _id.toString(),
    _id: _id.toString(),
    ...rest,
    parentId: rest.parentId ? String(rest.parentId) : null,
  };
}

export async function listHubCategories(
  db: Db,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    level?: number;
    parentId?: string;
  },
) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 10, 1000);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }

  if (options.active !== undefined) {
    filter.active = options.active;
  }

  if (options.level !== undefined) {
    filter.level = options.level;
  }

  if (options.parentId && ObjectId.isValid(options.parentId)) {
    filter.parentId = new ObjectId(options.parentId);
  }

  const categories = await db
    .collection('categories')
    .aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      { $addFields: { productCount: { $size: '$products' } } },
      {
        $project: {
          id: { $ifNull: ['$sequentialId', '$_id'] },
          _id: 1,
          sequentialId: 1,
          name: 1,
          slug: 1,
          description: 1,
          imageUrl: 1,
          imageAlt: 1,
          parentId: 1,
          level: 1,
          active: 1,
          order: 1,
          createdAt: 1,
          updatedAt: 1,
          productCount: 1,
        },
      },
      { $sort: { level: 1, order: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray();

  const total = await db.collection('categories').countDocuments(filter);

  return {
    success: true,
    data: categories.map((cat) => transformCategory(cat as Document & { _id: ObjectId })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getHubCategoryBySlug(db: Db, slug: string) {
  const category = await db.collection('categories').findOne({ slug, active: true });
  if (!category) return null;

  return {
    _id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.imageUrl || category.image,
    imageUrl: category.imageUrl || category.image,
    imageAlt: category.imageAlt,
    parentId: category.parentId ? String(category.parentId) : null,
    level: category.level,
    active: category.active,
    order: category.order,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export async function getHubCategoryById(db: Db, id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error('INVALID_ID');
  }
  return db.collection('categories').findOne({ _id: new ObjectId(id) });
}

export async function listHubHomepageCategories(
  db: Db,
  options: { limit?: number; sortBy?: string; selectedIds?: string },
) {
  const limit = Math.min(options.limit ?? 8, 50);
  const sortBy = options.sortBy ?? 'order';

  let filter: Record<string, unknown> = { active: true };
  let sort: Record<string, 1 | -1> = { order: 1 };

  if (options.selectedIds) {
    const ids = options.selectedIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      filter._id = { $in: ids.map((id) => new ObjectId(id)) };
    }
  }

  switch (sortBy) {
    case 'name':
      sort = { name: 1 };
      break;
    case 'product_count':
      sort = { order: 1 };
      break;
    default:
      sort = { order: 1 };
  }

  const pipeline: Document[] = [
    { $match: filter },
    {
      $lookup: {
        from: 'products',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$categoryId', '$$categoryId'] }, { $eq: ['$active', true] }],
              },
            },
          },
        ],
        as: 'products',
      },
    },
    { $addFields: { productCount: { $size: '$products' } } },
    {
      $project: {
        _id: 1,
        name: 1,
        slug: 1,
        description: 1,
        imageUrl: 1,
        order: 1,
        productCount: 1,
      },
    },
  ];

  if (sortBy === 'random') {
    pipeline.push({ $sample: { size: limit } });
  } else {
    if (sortBy === 'product_count') {
      pipeline.push({ $sort: { productCount: -1 } });
    } else {
      pipeline.push({ $sort: sort });
    }
    pipeline.push({ $limit: limit });
  }

  const categories = await db.collection('categories').aggregate(pipeline).toArray();

  return {
    success: true,
    categories: categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.imageUrl || '/images/products/placeholder.svg',
      imageAlt: category.name,
      href: `/products/${category.slug}`,
      order: category.order,
      active: true,
      productCount: category.productCount,
    })),
  };
}

export async function listHubAdminCategories(db: Db) {
  const categories = await db
    .collection('categories')
    .aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
          pipeline: [{ $match: { active: true } }],
        },
      },
      { $addFields: { productCount: { $size: '$products' } } },
      { $sort: { order: 1 } },
      {
        $project: {
          name: 1,
          slug: 1,
          active: 1,
          order: 1,
          productCount: 1,
          parentId: 1,
        },
      },
    ])
    .toArray();

  return categories.map((cat) => ({
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    active: cat.active,
    order: cat.order,
    productCount: cat.productCount,
    parentId: cat.parentId ? cat.parentId.toString() : null,
  }));
}

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  imageAlt: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  level: z.number().int().min(0).max(10).default(0),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function createHubCategory(db: Db, body: unknown) {
  const input = createCategorySchema.parse(body);
  let parentObjectId: ObjectId | null = null;
  let level = 0;

  if (input.parentId) {
    if (!ObjectId.isValid(input.parentId)) {
      throw new Error('INVALID_PARENT');
    }
    const parentCategory = await findCategoryById(db, input.parentId);
    if (!parentCategory) throw new Error('PARENT_NOT_FOUND');
    if ((parentCategory.level as number) >= 2) throw new Error('MAX_LEVEL');
    parentObjectId = new ObjectId(String(parentCategory._id));
    level = (parentCategory.level as number) + 1;
  }

  const existing = await db.collection('categories').findOne({ slug: input.slug });
  if (existing) throw new Error('SLUG_EXISTS');

  const lastCategory = await db
    .collection('categories')
    .findOne({}, { sort: { sequentialId: -1 } });
  const sequentialId = ((lastCategory?.sequentialId as number) || 0) + 1;

  const now = new Date();
  const insertResult = await db.collection('categories').insertOne({
    ...input,
    level,
    sequentialId,
    parentId: parentObjectId,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db
    .collection('categories')
    .aggregate([
      { $match: { _id: insertResult.insertedId } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      { $addFields: { productCount: { $size: '$products' } } },
    ])
    .toArray();

  return transformCategory(created[0] as Document & { _id: ObjectId });
}

export async function updateHubCategory(db: Db, id: string, body: Record<string, unknown>) {
  if (!ObjectId.isValid(id)) throw new Error('INVALID_ID');

  const { name, slug, description, imageUrl, active, order, parentId } = body;
  if (!name || !slug) throw new Error('NAME_SLUG_REQUIRED');

  const existing = await db.collection('categories').findOne({
    slug: String(slug),
    _id: { $ne: new ObjectId(id) },
  });
  if (existing) throw new Error('SLUG_EXISTS');

  const updateData: Record<string, unknown> = {
    name,
    slug,
    description: description || '',
    imageUrl: imageUrl || '',
    active: active !== undefined ? active : true,
    order: order || 0,
    updatedAt: new Date(),
  };

  if (parentId && ObjectId.isValid(String(parentId))) {
    updateData.parentId = new ObjectId(String(parentId));
  } else {
    updateData.parentId = null;
  }

  const result = await db
    .collection('categories')
    .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

  if (result.matchedCount === 0) throw new Error('NOT_FOUND');
  return db.collection('categories').findOne({ _id: new ObjectId(id) });
}

export async function deleteHubCategory(db: Db, id: string) {
  if (!ObjectId.isValid(id)) throw new Error('INVALID_ID');

  const childCount = await db.collection('categories').countDocuments(categoryRefFilter('parentId', id));
  if (childCount > 0) throw new Error('HAS_CHILDREN');

  const productsCount = await db.collection('products').countDocuments(categoryRefFilter('categoryId', id));
  if (productsCount > 0) throw new Error('HAS_PRODUCTS');

  const result = await db.collection('categories').deleteOne(categoryIdFilter(id));
  if (result.deletedCount === 0) throw new Error('NOT_FOUND');
}
