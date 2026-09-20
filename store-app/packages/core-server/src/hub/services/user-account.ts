import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId, type Db } from 'mongodb';
import { getHubJwtSecret } from '../auth';

export async function updateUserProfile(
  db: Db,
  userId: string,
  input: { name?: string; phone?: string; nationalCode?: string },
) {
  if (!ObjectId.isValid(userId)) throw new Error('INVALID_USER');
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) update.name = input.name;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.nationalCode !== undefined) update.nationalCode = input.nationalCode;

  const result = await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: update });
  if (result.matchedCount === 0) throw new Error('NOT_FOUND');
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(userId) },
    { projection: { password: 0 } },
  );
  return user;
}

export async function changeUserPassword(
  db: Db,
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!ObjectId.isValid(userId)) throw new Error('INVALID_USER');
  if (!newPassword || newPassword.length < 6) throw new Error('WEAK_PASSWORD');

  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, String(user.password));
  if (!valid) throw new Error('WRONG_PASSWORD');

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { password: hashed, updatedAt: new Date() } },
  );
}

export async function listUserDigitalProducts(db: Db, userId: string) {
  if (!ObjectId.isValid(userId)) return [];

  const paidOrders = await db
    .collection('orders')
    .find({
      userId: new ObjectId(userId),
      $or: [
        { paymentStatus: 'completed' },
        { paymentStatus: 'paid' },
        { paymentStatus: 'PAID' },
        { status: 'completed' },
      ],
    })
    .project({ _id: 1, items: 1, orderNumber: 1, createdAt: 1 })
    .toArray();

  const products: Array<Record<string, unknown>> = [];

  for (const order of paidOrders) {
    const items = (order.items || []) as Array<Record<string, unknown>>;
    for (const item of items) {
      if (item.productType !== 'DIGITAL' && item.provisioningType !== 'download') continue;
      const productId = item.productId;
      const product = productId
        ? await db.collection('products').findOne({
            _id: productId instanceof ObjectId ? productId : new ObjectId(String(productId)),
          })
        : null;
      products.push({
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        purchasedAt: order.createdAt,
        productId: product ? String(product._id) : String(productId),
        name: item.name || product?.name,
        downloadUrl: item.downloadUrl || product?.downloadUrl,
        productType: item.productType || product?.productType,
      });
    }
  }

  return products;
}

export async function generateDownloadToken(
  db: Db,
  userId: string,
  productId: string,
  ipAddress = 'unknown',
) {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(productId)) throw new Error('INVALID_ID');

  const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');
  if (product.productType !== 'DIGITAL') throw new Error('NOT_DIGITAL');

  const paidOrderIds = await db
    .collection('orders')
    .find({
      userId: new ObjectId(userId),
      $or: [{ paymentStatus: 'completed' }, { paymentStatus: 'paid' }, { status: 'completed' }],
    })
    .project({ _id: 1, items: 1 })
    .toArray();

  const owns = paidOrderIds.some((order) =>
    ((order.items || []) as Array<{ productId?: ObjectId }>).some(
      (i) => String(i.productId) === productId,
    ),
  );
  if (!owns) throw new Error('NOT_PURCHASED');

  if (product.downloadLimit) {
    const count = await db.collection('downloads').countDocuments({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
    });
    if (count >= Number(product.downloadLimit)) throw new Error('LIMIT_REACHED');
  }

  await db.collection('downloads').insertOne({
    userId: new ObjectId(userId),
    productId: new ObjectId(productId),
    ipAddress,
    createdAt: new Date(),
  });

  const downloadToken = jwt.sign(
    { userId, productId, downloadUrl: product.downloadUrl },
    getHubJwtSecret(),
    { expiresIn: '1h' },
  );

  return { downloadToken, downloadUrl: product.downloadUrl };
}

export function verifyDownloadToken(token: string) {
  try {
    return jwt.verify(token, getHubJwtSecret()) as {
      userId: string;
      productId: string;
      downloadUrl: string;
    };
  } catch {
    return null;
  }
}
