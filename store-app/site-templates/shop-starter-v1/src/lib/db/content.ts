import { ObjectId } from 'mongodb';
import { connectDB } from '@/lib/mongodb';
import { serializeDoc } from '@/lib/serialize';

export type PromoCodeDocument = {
  code: string;
  discount: number;
  active: boolean;
};

export async function getPromoDiscount(code: string): Promise<number> {
  const db = await connectDB();
  const doc = await db.promoCodes.findOne({
    code: code.trim().toUpperCase(),
    active: true,
  });
  if (!doc) return 0;
  return (doc as unknown as PromoCodeDocument).discount;
}

export async function seedPromoCodes(
  codes: { code: string; discount: number }[],
): Promise<void> {
  const db = await connectDB();
  for (const item of codes) {
    await db.promoCodes.updateOne(
      { code: item.code.toUpperCase() },
      { $set: { code: item.code.toUpperCase(), discount: item.discount, active: true } },
      { upsert: true },
    );
  }
}

export type AddressDocument = {
  sessionId: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function listAddresses(sessionId: string) {
  const db = await connectDB();
  const docs = await db.addresses.find({ sessionId }).sort({ isDefault: -1 }).toArray();
  return docs.map((doc) => {
    const a = serializeDoc(doc as AddressDocument & { _id: unknown });
    return {
      id: a.id,
      title: a.title,
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      postalCode: a.postalCode,
      isDefault: a.isDefault,
    };
  });
}

export type FavoriteDocument = {
  sessionId: string;
  productId: ObjectId;
  createdAt: Date;
};

export async function listFavorites(sessionId: string) {
  const db = await connectDB();
  const items = await db.favorites.find({ sessionId }).toArray();

  const result = await Promise.all(
    items.map(async (item) => {
      const productId = (item as unknown as FavoriteDocument).productId;
      const product = await db.products.findOne({ _id: productId, active: true });
      if (!product) return null;
      const p = product as unknown as { slug: string; name: string; price: number; image: string };
      return {
        id: productId.toString(),
        name: p.name,
        price: p.price,
        image: p.image,
        href: `/products/${p.slug}`,
      };
    }),
  );

  return result.filter(Boolean);
}

export async function countFavorites(sessionId: string): Promise<number> {
  const db = await connectDB();
  return db.favorites.countDocuments({ sessionId });
}

export type CampaignDocument = {
  title: string;
  status: 'فعال' | 'پایان‌یافته';
  reach: string;
  conversion: string;
  active: boolean;
  createdAt: Date;
};

export async function listCampaigns() {
  const db = await connectDB();
  const docs = await db.campaigns.find().sort({ createdAt: -1 }).toArray();
  return docs.map((doc) => {
    const c = doc as unknown as CampaignDocument;
    return {
      title: c.title,
      status: c.status,
      reach: c.reach,
      conversion: c.conversion,
    };
  });
}

export async function seedCampaigns(
  items: Omit<CampaignDocument, 'createdAt'>[],
): Promise<void> {
  const db = await connectDB();
  const count = await db.campaigns.countDocuments();
  if (count > 0) return;

  const now = new Date();
  await db.campaigns.insertMany(
    items.map((item) => ({ ...item, createdAt: now })) as Record<string, unknown>[],
  );
}

export async function listCustomers() {
  const db = await connectDB();
  const rows = await db.orders
    .aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$customerPhone',
          name: { $last: '$customerName' },
          email: { $last: '$customerEmail' },
          orders: { $sum: 1 },
          spent: { $sum: '$total' },
        },
      },
      { $sort: { spent: -1 } },
      { $limit: 50 },
    ])
    .toArray();

  return rows.map((row) => {
    const r = row as { _id: string; name: string; email?: string; orders: number; spent: number };
    return {
      name: r.name,
      email: r.email || '—',
      orders: r.orders,
      spent: `${r.spent.toLocaleString('fa-IR')} تومان`,
    };
  });
}

export type UserProfileDocument = {
  sessionId: string;
  name: string;
  email?: string;
  phone?: string;
  tier: string;
  avatar: string;
  points: number;
  updatedAt: Date;
};

export async function getUserProfile(sessionId: string) {
  const db = await connectDB();
  const doc = await db.userProfiles.findOne({ sessionId });
  if (doc) {
    const p = doc as unknown as UserProfileDocument;
    return {
      name: p.name,
      tier: p.tier,
      avatar: p.avatar,
      points: p.points,
      email: p.email,
      phone: p.phone,
    };
  }

  const latestOrder = await db.orders.findOne(
    { sessionId },
    { sort: { createdAt: -1 } },
  );

  if (latestOrder) {
    const o = latestOrder as unknown as { customerName: string; customerPhone: string; customerEmail?: string };
    const orderCount = await db.orders.countDocuments({ sessionId });
    return {
      name: o.customerName,
      tier: 'عضو میوز',
      avatar: '/images/account/avatar.jpg',
      points: orderCount * 200,
      email: o.customerEmail,
      phone: o.customerPhone,
    };
  }

  return {
    name: 'مهمان',
    tier: 'عضو جدید',
    avatar: '/images/account/avatar.jpg',
    points: 0,
    email: undefined,
    phone: undefined,
  };
}

export async function upsertUserProfileFromOrder(
  sessionId: string,
  data: { customerName: string; customerPhone: string; customerEmail?: string },
) {
  const db = await connectDB();
  const orderCount = await db.orders.countDocuments({ sessionId });
  await db.userProfiles.updateOne(
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
