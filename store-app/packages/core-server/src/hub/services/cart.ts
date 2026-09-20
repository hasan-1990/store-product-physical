import { ObjectId, type Db } from 'mongodb';

function cartQuery(userId?: string | null, sessionId?: string | null) {
  if (userId && ObjectId.isValid(userId)) {
    return { userId: new ObjectId(userId) };
  }
  if (sessionId) return { sessionId };
  return null;
}

export async function getHubCartItems(db: Db, userId?: string | null, sessionId?: string | null) {
  const query = cartQuery(userId, sessionId);
  if (!query) return [];

  const cartItems = await db
    .collection('cartItems')
    .aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ])
    .toArray();

  return cartItems.map((item) => {
    const row = item as {
      _id: ObjectId;
      productId: ObjectId;
      quantity: number;
      size?: string;
      color?: string;
      product: Record<string, unknown>;
    };
    const p = row.product;
    return {
      id: row._id.toString(),
      productId: row.productId.toString(),
      name: p.name,
      price: (p.discountPrice as number) || (p.price as number),
      originalPrice: p.discountPrice ? p.price : undefined,
      quantity: row.quantity,
      image: (p.images as string[])?.[0] || p.imageUrl || p.image || null,
      color: row.color,
      size: row.size,
      stock: p.stock,
      productType: p.productType || p.type || 'PHYSICAL',
      provisioningType: p.provisioningType || 'download',
      templateSlug: p.templateSlug,
    };
  });
}

export async function addHubCartItem(
  db: Db,
  input: {
    productId: string;
    quantity: number;
    userId?: string | null;
    sessionId?: string | null;
    size?: string | null;
    color?: string | null;
  },
) {
  if (!ObjectId.isValid(input.productId)) {
    throw new Error('Product ID فرمت نامعتبر دارد');
  }
  const query = cartQuery(input.userId, input.sessionId);
  if (!query) throw new Error('userId یا sessionId الزامی است');

  const product = await db.collection('products').findOne({ _id: new ObjectId(input.productId) });
  if (!product) throw new Error('محصول یافت نشد');

  const stock = Number(product.stock ?? 0);
  const matchQuery = {
    ...query,
    productId: new ObjectId(input.productId),
    size: input.size || null,
    color: input.color || null,
  };

  const existing = await db.collection('cartItems').findOne(matchQuery);
  const newQty = (existing ? Number(existing.quantity) : 0) + input.quantity;
  if (newQty > stock) throw new Error('موجودی کافی نیست');

  if (existing) {
    await db.collection('cartItems').updateOne(
      { _id: existing._id },
      { $set: { quantity: newQty, updatedAt: new Date() } },
    );
  } else {
    await db.collection('cartItems').insertOne({
      ...matchQuery,
      quantity: input.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function clearHubCart(db: Db, userId?: string | null, sessionId?: string | null) {
  const query = cartQuery(userId, sessionId);
  if (!query) throw new Error('userId یا sessionId الزامی است');
  await db.collection('cartItems').deleteMany(query);
}
