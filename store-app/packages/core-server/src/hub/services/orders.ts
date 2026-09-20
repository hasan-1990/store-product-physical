import { ObjectId, type Db } from 'mongodb';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ORD${timestamp}${random}`;
}

export async function listHubOrdersForUser(
  db: Db,
  userId: string,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;
  const match = ObjectId.isValid(userId) ? { userId: new ObjectId(userId) } : { userId };

  const [orders, total] = await Promise.all([
    db.collection('orders').find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection('orders').countDocuments(match),
  ]);

  return {
    success: true,
    data: orders.map((o) => ({
      ...o,
      _id: String(o._id),
      id: String(o._id),
      userId: o.userId ? String(o.userId) : undefined,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createHubOrder(
  db: Db,
  userId: string,
  input: {
    items: Array<{ productId: string; quantity: number; price: number }>;
    shippingAddress: Record<string, string>;
    shippingAmount?: number;
    paymentMethod?: string;
    notes?: string;
  },
) {
  if (!ObjectId.isValid(userId)) throw new Error('شناسه کاربر نامعتبر است');

  let totalAmount = 0;
  for (const item of input.items) {
    const product = await db.collection('products').findOne({ _id: new ObjectId(item.productId) });
    if (!product) throw new Error(`محصول ${item.productId} یافت نشد`);
    if (Number(product.stock) < item.quantity) throw new Error(`موجودی ${product.name} کافی نیست`);
    totalAmount += item.price * item.quantity;
  }

  totalAmount += input.shippingAmount ?? 0;
  const now = new Date();
  const orderResult = await db.collection('orders').insertOne({
    orderNumber: generateOrderNumber(),
    userId: new ObjectId(userId),
    items: input.items,
    totalAmount,
    shippingAmount: input.shippingAmount ?? 0,
    shippingAddress: input.shippingAddress,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  const orderId = orderResult.insertedId;
  for (const item of input.items) {
    await db.collection('orderItems').insertOne({
      orderId,
      productId: new ObjectId(item.productId),
      quantity: item.quantity,
      price: item.price,
      createdAt: now,
    });
    await db.collection('products').updateOne(
      { _id: new ObjectId(item.productId) },
      { $inc: { stock: -item.quantity, soldCount: item.quantity, salesCount: item.quantity } },
    );
  }

  await db.collection('cartItems').deleteMany({ userId: new ObjectId(userId) });
  const order = await db.collection('orders').findOne({ _id: orderId });
  return { orderId: orderId.toString(), order };
}
