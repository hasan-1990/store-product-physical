import { ObjectId, type Db } from 'mongodb';
import { triggerProvisioningForOrder } from './provisioning-bridge';

export type CheckoutOrderInput = {
  userId?: string | null;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    productType?: string;
    downloadUrl?: string | null;
    fileSize?: number | null;
    fileFormat?: string | null;
    provisioningType?: string;
    templateSlug?: string | null;
    templateId?: string | null;
    siteDomain?: string | null;
  }>;
  contactInfo?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  shippingMethod?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string | null;
  siteDomain?: string | null;
};

export async function createCheckoutOrder(db: Db, body: CheckoutOrderInput) {
  const paymentStatus = body.paymentStatus || 'pending';
  const userId = body.userId && ObjectId.isValid(body.userId) ? new ObjectId(body.userId) : null;

  const order = {
    userId,
    items: body.items.map((item) => ({
      productId: new ObjectId(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      productType: item.productType || 'PHYSICAL',
      downloadUrl: item.downloadUrl || null,
      fileSize: item.fileSize || null,
      fileFormat: item.fileFormat || null,
      provisioningType: item.provisioningType || 'download',
      templateSlug: item.templateSlug || null,
      templateId: item.templateId || null,
      siteDomain:
        item.provisioningType === 'managed-site'
          ? item.siteDomain || body.siteDomain || null
          : null,
    })),
    contactInfo: body.contactInfo,
    shippingAddress: body.shippingAddress,
    shippingMethod: body.shippingMethod,
    paymentMethod: body.paymentMethod,
    paymentStatus,
    totalAmount: body.totalAmount,
    discountAmount: body.discountAmount || 0,
    discountCode: body.discountCode || null,
    orderNumber: `ORD-${Date.now()}`,
    status: paymentStatus === 'completed' ? 'completed' : 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('orders').insertOne(order);
  const orderId = result.insertedId.toString();

  if (paymentStatus === 'completed' && userId) {
    await db.collection('cartItems').deleteMany({ userId });
    try {
      await triggerProvisioningForOrder(orderId);
    } catch (error) {
      console.error('[checkout] provisioning after create:', error);
    }
  }

  return { orderId, orderNumber: order.orderNumber };
}

export async function completeCheckoutOrder(db: Db, orderId: string) {
  if (!ObjectId.isValid(orderId)) throw new Error('INVALID_ORDER_ID');

  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  if (!order) throw new Error('NOT_FOUND');

  await db.collection('orders').updateOne(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        paymentStatus: 'completed',
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  if (order.userId) {
    await db.collection('cartItems').deleteMany({ userId: order.userId });
  }

  let provisionedInstances: unknown[] = [];
  try {
    provisionedInstances = await triggerProvisioningForOrder(orderId);
  } catch (error) {
    console.error('[checkout] provisioning after complete:', error);
  }

  const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
  return { order: updatedOrder, provisionedInstances };
}

export async function getCheckoutOrder(db: Db, orderId: string) {
  if (!ObjectId.isValid(orderId)) return null;
  return db.collection('orders').findOne({ _id: new ObjectId(orderId) });
}
