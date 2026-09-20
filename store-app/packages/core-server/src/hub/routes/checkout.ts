import type { Express, Response } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { connectHubDb } from '@core-shared';
import { withHub, withHubUser } from '../middleware';
import {
  createCheckoutOrder,
  completeCheckoutOrder,
  getCheckoutOrder,
} from '../services/checkout-orders';
import {
  validateDiscountCode,
  listProvinces,
  listPaymentGateways,
} from '../services/admin-products';
import {
  zarinpalRequestPayment,
  zarinpalPaymentUrl,
  getSiteUrl,
} from '../services/payment-gateways';

function zodError(res: Response, error: z.ZodError) {
  res.status(400).json({ success: false, error: 'داده نامعتبر', details: error.issues });
}

const createOrderSchema = z.object({
  userId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().min(1),
    productType: z.string().optional(),
    downloadUrl: z.string().optional().nullable(),
    provisioningType: z.string().optional(),
    templateSlug: z.string().optional().nullable(),
    templateId: z.string().optional().nullable(),
    siteDomain: z.string().optional().nullable(),
  })).min(1),
  contactInfo: z.record(z.string(), z.unknown()).optional(),
  shippingAddress: z.record(z.string(), z.unknown()).optional(),
  shippingMethod: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  totalAmount: z.number(),
  discountAmount: z.number().optional(),
  discountCode: z.string().optional().nullable(),
  siteDomain: z.string().optional().nullable(),
});

export function registerHubCheckoutRoutes(app: Express): void {
  app.post(
    '/api/orders/create',
    withHub(async (req, res) => {
      try {
        const data = createOrderSchema.parse(req.body);
        const db = await connectHubDb();
        const result = await createCheckoutOrder(db, data);
        res.json({
          success: true,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          message: 'سفارش با موفقیت ثبت شد',
        });
      } catch (error) {
        if (error instanceof z.ZodError) return zodError(res, error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا در ثبت سفارش',
        });
      }
    }),
  );

  app.get(
    '/api/orders/create',
    withHub(async (req, res) => {
      try {
        const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : '';
        if (!orderId) {
          return res.status(400).json({ success: false, error: 'orderId الزامی است' });
        }
        const db = await connectHubDb();
        const order = await getCheckoutOrder(db, orderId);
        if (!order) return res.status(404).json({ success: false, error: 'سفارش یافت نشد' });
        res.json({ success: true, order });
      } catch {
        res.status(500).json({ success: false, error: 'خطا' });
      }
    }),
  );

  app.post(
    '/api/orders/:id/complete',
    withHub(async (req, res) => {
      try {
        const db = await connectHubDb();
        const result = await completeCheckoutOrder(db, req.params.id);
        res.json({
          success: true,
          order: result.order,
          provisionedInstances: result.provisionedInstances,
          message: 'سفارش با موفقیت تکمیل شد',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'خطا';
        const status = msg === 'NOT_FOUND' ? 404 : msg === 'INVALID_ORDER_ID' ? 400 : 500;
        res.status(status).json({ success: false, error: msg });
      }
    }),
  );

  app.post(
    '/api/payment/initiate',
    withHub(async (req, res) => {
      try {
        const { orderId, amount, email, phone, gatewayId } = req.body ?? {};
        if (!orderId || !amount) {
          return res.status(400).json({ success: false, error: 'orderId و amount الزامی هستند' });
        }
        const db = await connectHubDb();
        const order = await db.collection('orders').findOne({
          _id: ObjectId.isValid(orderId) ? new ObjectId(orderId) : orderId,
        });
        if (!order) return res.status(404).json({ success: false, error: 'سفارش یافت نشد' });

        const gateway = gatewayId
          ? await db.collection('paymentGateways').findOne({ _id: new ObjectId(gatewayId) })
          : await db.collection('paymentGateways').findOne({
              $or: [{ enabled: true }, { active: true }],
            });

        if (!gateway) {
          return res.status(404).json({ success: false, error: 'درگاه پرداخت فعالی یافت نشد' });
        }

        const callbackUrl = `${getSiteUrl()}/api/payment/verify`;
        const amountInRials = Math.round(Math.round(Number(amount)) * 10);

        const paymentResponse = await zarinpalRequestPayment(db, {
          amount: amountInRials,
          description: `پرداخت سفارش ${order.orderNumber}`,
          callback_url: callbackUrl,
          email,
          mobile: phone,
          order_id: String(orderId),
        });

        const authority = paymentResponse.data?.authority;
        if (!authority) {
          return res.status(500).json({
            success: false,
            error: paymentResponse.errors?.[0]?.message || 'خطا در ایجاد درخواست پرداخت',
          });
        }

        const paymentUrl = await zarinpalPaymentUrl(db, authority);
        await db.collection('payments').insertOne({
          orderId,
          authority,
          gateway: 'zarinpal',
          amount: Number(amount),
          status: 'pending',
          createdAt: new Date(),
        });

        res.json({ success: true, paymentUrl, authority });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطا',
        });
      }
    }),
  );

  app.get('/api/provinces', withHub(async (_req, res) => {
    const db = await connectHubDb();
    const provinces = await listProvinces(db);
    res.json({ success: true, provinces });
  }));

  app.post('/api/discounts/validate', withHub(async (req, res) => {
    try {
      const { code, cartTotal } = req.body ?? {};
      if (!code) return res.status(400).json({ success: false, error: 'کد تخفیف الزامی است' });
      const db = await connectHubDb();
      const result = await validateDiscountCode(db, String(code), Number(cartTotal || 0));
      res.json({ success: true, ...result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'خطا';
      const map: Record<string, string> = {
        INVALID_CODE: 'کد تخفیف نامعتبر یا منقضی شده است',
        USAGE_LIMIT: 'این کد به حد مجاز رسیده است',
        MIN_ORDER: 'حداقل مبلغ خرید رعایت نشده است',
      };
      res.status(400).json({ success: false, error: map[msg] || msg });
    }
  }));

  app.get('/api/admin/payment-gateways', withHub(async (_req, res) => {
    const db = await connectHubDb();
    const gateways = await listPaymentGateways(db);
    res.json({ success: true, gateways });
  }));
}
