import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { serializeDoc } from '@/lib/serialize';
import type { PaymentMethod } from '@/lib/cart';

export type OrderStatus = 'processing' | 'shipped' | 'cancelled' | 'delivered';

export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type OrderDocument = {
  orderNumber: string;
  sessionId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatOrderTotal(total: number): string {
  return `${total.toLocaleString('fa-IR')} تومان`;
}

export async function createOrder(input: {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
}) {
  const db = await connectDB();
  const now = new Date();
  const count = await db.orders.countDocuments();
  const orderNumber = `MUSE-${String(count + 1).padStart(5, '0')}`;

  const result = await db.orders.insertOne({
    orderNumber,
    sessionId: input.sessionId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    address: input.address,
    paymentMethod: input.paymentMethod,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    shippingCost: input.shippingCost,
    total: input.total,
    status: 'processing',
    createdAt: now,
    updatedAt: now,
  });

  await db.cartItems.deleteMany({ sessionId: input.sessionId });

  const { upsertUserProfileFromOrder } = await import('@/lib/db/content');
  await upsertUserProfileFromOrder(input.sessionId, {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
  });

  return { id: result.insertedId.toString(), orderNumber };
}

export async function listOrders(limit = 20) {
  const db = await connectDB();
  const docs = await db.orders.find().sort({ createdAt: -1 }).limit(limit).toArray();

  return docs.map((doc) => {
    const order = serializeDoc(doc as unknown as OrderDocument);
    return {
      id: order.orderNumber,
      customer: order.customerName,
      date: formatOrderDate(order.createdAt),
      total: formatOrderTotal(order.total),
      status: order.status,
      rawTotal: order.total,
      createdAt: order.createdAt,
    };
  });
}

export async function listOrdersBySession(sessionId: string, limit = 10) {
  const db = await connectDB();
  const docs = await db.orders
    .find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => {
    const order = serializeDoc(doc as unknown as OrderDocument);
    return {
      id: order.orderNumber,
      date: formatOrderDate(order.createdAt),
      total: formatOrderTotal(order.total),
      status: order.status,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      rawTotal: order.total,
    };
  });
}

export async function getOrderStats() {
  const db = await connectDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyOrders, monthlyRevenue, totalCustomers, recentOrders] = await Promise.all([
    db.orders.countDocuments({ createdAt: { $gte: monthStart } }),
    db.orders
      .aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ])
      .toArray(),
    db.orders.distinct('customerPhone'),
    db.orders.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  const revenue = (monthlyRevenue[0] as { total?: number } | undefined)?.total ?? 0;

  return {
    monthlyRevenue: revenue,
    monthlyOrders,
    totalCustomers: totalCustomers.length,
    weeklyOrders: recentOrders,
  };
}

export async function getSalesChartData() {
  const db = await connectDB();
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const results = await db.orders
    .aggregate([
      { $match: { createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: '$total' },
        },
      },
    ])
    .toArray();

  const map = new Map(results.map((row) => [String((row as { _id: string })._id), (row as { total: number }).total]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const value = Math.round((map.get(key) ?? 0) / 1_000_000);
    return {
      day: days[index],
      value,
      label: `${value}م`,
      highlight: index === 6,
    };
  });
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus) {
  const db = await connectDB();
  await db.orders.updateOne(
    { orderNumber },
    { $set: { status, updatedAt: new Date() } },
  );
}

export async function getCartItemsForSession(sessionId: string) {
  const db = await connectDB();
  const items = await db.cartItems.find({ sessionId }).toArray();

  const enriched = await Promise.all(
    items.map(async (item) => {
      const rawItem = item as unknown as { _id: ObjectId; productId: ObjectId; quantity: number };
      const product = await db.products.findOne({ _id: rawItem.productId });
      if (!product) return null;

      const p = product as unknown as {
        slug: string;
        name: string;
        price: number;
        image: string;
        brand: string;
      };

      return {
        id: rawItem._id.toString(),
        productId: rawItem.productId.toString(),
        slug: p.slug,
        name: p.name,
        variant: p.brand,
        price: p.price,
        quantity: rawItem.quantity,
        image: p.image,
      };
    }),
  );

  return enriched.filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function addToCart(sessionId: string, productId: string, quantity: number) {
  const db = await connectDB();
  if (!ObjectId.isValid(productId)) {
    throw new Error('شناسه محصول نامعتبر است');
  }

  const product = await db.products.findOne({ _id: new ObjectId(productId), active: true });
  if (!product) throw new Error('محصول یافت نشد');

  const stock = (product as unknown as { stock: number }).stock ?? 0;
  const existing = await db.cartItems.findOne({
    sessionId,
    productId: new ObjectId(productId),
  });

  const existingQty = existing
    ? (existing as unknown as { quantity: number }).quantity
    : 0;
  const newQty = existingQty + quantity;
  if (newQty > stock) throw new Error('موجودی کافی نیست');

  const now = new Date();
  if (existing) {
    await db.cartItems.updateOne(
      { _id: (existing as unknown as { _id: ObjectId })._id },
      { $set: { quantity: newQty, updatedAt: now } },
    );
    return String((existing as unknown as { _id: ObjectId })._id);
  }

  const result = await db.cartItems.insertOne({
    sessionId,
    productId: new ObjectId(productId),
    quantity,
    createdAt: now,
    updatedAt: now,
  });

  return result.insertedId.toString();
}

export async function updateCartItemQuantity(sessionId: string, itemId: string, quantity: number) {
  const db = await connectDB();
  if (!ObjectId.isValid(itemId)) throw new Error('آیتم سبد نامعتبر است');

  const item = await db.cartItems.findOne({
    _id: new ObjectId(itemId),
    sessionId,
  });
  if (!item) throw new Error('آیتم یافت نشد');

  const product = await db.products.findOne({ _id: (item as unknown as { productId: ObjectId }).productId });
  const stock = (product as unknown as { stock?: number } | null)?.stock ?? 0;
  if (quantity > stock) throw new Error('موجودی کافی نیست');

  await db.cartItems.updateOne(
    { _id: new ObjectId(itemId) },
    { $set: { quantity, updatedAt: new Date() } },
  );
}

export async function removeCartItem(sessionId: string, itemId: string) {
  const db = await connectDB();
  await db.cartItems.deleteOne({
    _id: new ObjectId(itemId),
    sessionId,
  });
}

export async function clearCart(sessionId: string) {
  const db = await connectDB();
  await db.cartItems.deleteMany({ sessionId });
}
