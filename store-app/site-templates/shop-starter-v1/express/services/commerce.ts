import { ObjectId, type Db } from 'mongodb';
import { getShopDb } from '../shop-db';
import { serializeDoc } from '../serialize';

export type OrderStatus = 'processing' | 'shipped' | 'cancelled' | 'delivered';
export type PaymentMethod = 'online' | 'cod';

type OrderDoc = {
  orderNumber: string;
  sessionId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: Array<{
    productId: string;
    slug: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
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

export function getCartSubtotal(
  items: Array<{ price: number; quantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function getPromoDiscount(db: Db, code: string): Promise<number> {
  const shop = getShopDb(db);
  const doc = await shop.promoCodes.findOne({
    code: code.trim().toUpperCase(),
    active: true,
  });
  if (!doc) return 0;
  return Number((doc as { discount: number }).discount);
}

export async function getCartItemsForSession(db: Db, sessionId: string) {
  const shop = getShopDb(db);
  const items = await shop.cartItems.find({ sessionId }).toArray();

  const enriched = await Promise.all(
    items.map(async (item) => {
      const raw = item as { _id: ObjectId; productId: ObjectId; quantity: number };
      const product = await shop.products.findOne({ _id: raw.productId });
      if (!product) return null;
      const p = product as { slug: string; name: string; price: number; image: string; brand: string };
      return {
        id: raw._id.toString(),
        productId: raw.productId.toString(),
        slug: p.slug,
        name: p.name,
        variant: p.brand,
        price: p.price,
        quantity: raw.quantity,
        image: p.image,
      };
    }),
  );

  return enriched.filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function addToCart(db: Db, sessionId: string, productId: string, quantity: number) {
  const shop = getShopDb(db);
  if (!ObjectId.isValid(productId)) throw new Error('شناسه محصول نامعتبر است');

  const product = await shop.products.findOne({ _id: new ObjectId(productId), active: true });
  if (!product) throw new Error('محصول یافت نشد');

  const stock = (product as { stock: number }).stock ?? 0;
  const existing = await shop.cartItems.findOne({ sessionId, productId: new ObjectId(productId) });
  const existingQty = existing ? (existing as { quantity: number }).quantity : 0;
  const newQty = existingQty + quantity;
  if (newQty > stock) throw new Error('موجودی کافی نیست');

  const now = new Date();
  if (existing) {
    await shop.cartItems.updateOne(
      { _id: (existing as { _id: ObjectId })._id },
      { $set: { quantity: newQty, updatedAt: now } },
    );
    return String((existing as { _id: ObjectId })._id);
  }

  const result = await shop.cartItems.insertOne({
    sessionId,
    productId: new ObjectId(productId),
    quantity,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toString();
}

export async function updateCartItemQuantity(
  db: Db,
  sessionId: string,
  itemId: string,
  quantity: number,
) {
  const shop = getShopDb(db);
  if (!ObjectId.isValid(itemId)) throw new Error('آیتم سبد نامعتبر است');

  const item = await shop.cartItems.findOne({ _id: new ObjectId(itemId), sessionId });
  if (!item) throw new Error('آیتم یافت نشد');

  const product = await shop.products.findOne({
    _id: (item as { productId: ObjectId }).productId,
  });
  const stock = (product as { stock?: number } | null)?.stock ?? 0;
  if (quantity > stock) throw new Error('موجودی کافی نیست');

  await shop.cartItems.updateOne(
    { _id: new ObjectId(itemId) },
    { $set: { quantity, updatedAt: new Date() } },
  );
}

export async function removeCartItem(db: Db, sessionId: string, itemId: string) {
  const shop = getShopDb(db);
  await shop.cartItems.deleteOne({ _id: new ObjectId(itemId), sessionId });
}

export async function clearCart(db: Db, sessionId: string) {
  const shop = getShopDb(db);
  await shop.cartItems.deleteMany({ sessionId });
}

async function upsertUserProfileFromOrder(
  db: Db,
  sessionId: string,
  data: { customerName: string; customerPhone: string; customerEmail?: string },
) {
  const shop = getShopDb(db);
  const orderCount = await shop.orders.countDocuments({ sessionId });
  await shop.userProfiles.updateOne(
    { sessionId },
    {
      $set: {
        sessionId,
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail,
        tier: orderCount > 5 ? 'عضو طلایی' : 'عضو میوز',
        avatar: '/images/account/avatar.jpg',
        points: orderCount * 200,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function createOrder(
  db: Db,
  input: {
    sessionId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: string;
    paymentMethod: PaymentMethod;
    items: OrderDoc['items'];
    subtotal: number;
    discount: number;
    shippingCost: number;
    total: number;
  },
) {
  const shop = getShopDb(db);
  const now = new Date();
  const count = await shop.orders.countDocuments();
  const orderNumber = `MUSE-${String(count + 1).padStart(5, '0')}`;

  const result = await shop.orders.insertOne({
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

  await shop.cartItems.deleteMany({ sessionId: input.sessionId });
  await upsertUserProfileFromOrder(db, input.sessionId, {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
  });

  return { id: result.insertedId.toString(), orderNumber };
}

export async function listOrders(db: Db, limit = 20) {
  const shop = getShopDb(db);
  const docs = await shop.orders.find().sort({ createdAt: -1 }).limit(limit).toArray();

  return docs.map((doc) => {
    const order = serializeDoc(doc as OrderDoc);
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

export async function listOrdersBySession(db: Db, sessionId: string, limit = 10) {
  const shop = getShopDb(db);
  const docs = await shop.orders.find({ sessionId }).sort({ createdAt: -1 }).limit(limit).toArray();

  return docs.map((doc) => {
    const order = serializeDoc(doc as OrderDoc);
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

export async function updateOrderStatus(db: Db, orderNumber: string, status: OrderStatus) {
  const shop = getShopDb(db);
  await shop.orders.updateOne({ orderNumber }, { $set: { status, updatedAt: new Date() } });
}

export async function getOrderStats(db: Db) {
  const shop = getShopDb(db);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyOrders, monthlyRevenue, totalCustomers, recentOrders] = await Promise.all([
    shop.orders.countDocuments({ createdAt: { $gte: monthStart } }),
    shop.orders
      .aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ])
      .toArray(),
    shop.orders.distinct('customerPhone'),
    shop.orders.countDocuments({
      createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const revenue = (monthlyRevenue[0] as { total?: number } | undefined)?.total ?? 0;
  return {
    monthlyRevenue: revenue,
    monthlyOrders,
    totalCustomers: totalCustomers.length,
    weeklyOrders: recentOrders,
  };
}

export async function getSalesChartData(db: Db) {
  const shop = getShopDb(db);
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const results = await shop.orders
    .aggregate([
      { $match: { createdAt: { $gte: start }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
    ])
    .toArray();

  const map = new Map(
    results.map((row) => [String((row as { _id: string })._id), (row as { total: number }).total]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const value = Math.round((map.get(key) ?? 0) / 1_000_000);
    return { day: days[index], value, label: `${value}م`, highlight: index === 6 };
  });
}

export async function findAdminByEmail(db: Db, email: string) {
  const shop = getShopDb(db);
  return shop.admins.findOne({ email: email.toLowerCase() });
}
