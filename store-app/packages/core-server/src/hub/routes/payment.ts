import type { Express } from 'express';
import { ObjectId } from 'mongodb';
import { connectHubDb } from '@core-shared';
import { withHub } from '../middleware';
import {
  zarinpalRequestPayment,
  zarinpalVerifyPayment,
  zarinpalPaymentUrl,
  zibalRequestPayment,
  zibalVerifyPayment,
  zibalPaymentUrl,
  getSiteUrl,
} from '../services/payment-gateways';

import { completeCheckoutOrder } from '../services/checkout-orders';

async function markOrderPaid(db: Awaited<ReturnType<typeof connectHubDb>>, orderId: unknown, refId: unknown) {
  try {
    await completeCheckoutOrder(db, String(orderId));
  } catch (error) {
    console.error('[payment] complete after verify:', error);
  }
  const filter = ObjectId.isValid(String(orderId))
    ? { _id: new ObjectId(String(orderId)) }
    : { _id: orderId };
  await db.collection('orders').updateOne(filter, {
    $set: { refId, paidAt: new Date(), updatedAt: new Date() },
  });
}

export function registerHubPaymentRoutes(app: Express): void {
  app.post(
    '/api/payment/request',
    withHub(async (req, res) => {
      try {
        const { orderId, amount, description, mobile, email, gateway } = req.body ?? {};
        if (!orderId || !amount) {
          return res.status(400).json({ success: false, error: 'شماره سفارش و مبلغ الزامی است' });
        }
        if (Number(amount) < 1000) {
          return res.status(400).json({ success: false, error: 'حداقل مبلغ پرداخت 1,000 ریال است' });
        }

        const db = await connectHubDb();
        let selectedGateway = gateway as string | undefined;
        if (!selectedGateway) {
          const active = await db.collection('paymentGateways').findOne({ active: true });
          if (!active) {
            return res.status(500).json({ success: false, error: 'هیچ درگاه پرداخت فعالی یافت نشد' });
          }
          selectedGateway = String(active.type);
        }

        const callbackUrl = `${getSiteUrl()}/api/payment/verify`;

        let authority: string;
        let paymentUrl: string;
        let trackId: number | undefined;

        if (selectedGateway === 'zibal') {
          const zibalConfig = await db.collection('paymentGateways').findOne({ type: 'zibal', active: true });
          const paymentResponse = await zibalRequestPayment(db, {
            merchant: String(zibalConfig?.merchant || zibalConfig?.merchantId || 'zibal'),
            amount: Number(amount),
            callbackUrl,
            description: description || `پرداخت سفارش #${orderId}`,
            orderId: String(orderId),
            mobile,
          });

          if (!paymentResponse.trackId) {
            return res.status(500).json({
              success: false,
              error: paymentResponse.message || 'خطا در ایجاد درخواست پرداخت Zibal',
            });
          }

          trackId = paymentResponse.trackId;
          authority = String(trackId);
          paymentUrl = zibalPaymentUrl(trackId);
        } else {
          const paymentResponse = await zarinpalRequestPayment(db, {
            amount: Number(amount),
            description: description || `پرداخت سفارش #${orderId}`,
            callback_url: callbackUrl,
            mobile,
            email,
            order_id: String(orderId),
          });

          if (!paymentResponse.data?.authority) {
            return res.status(500).json({
              success: false,
              error: paymentResponse.errors?.[0]?.message || 'خطا در ایجاد درخواست پرداخت ZarinPal',
            });
          }

          authority = paymentResponse.data.authority;
          paymentUrl = await zarinpalPaymentUrl(db, authority);
        }

        await db.collection('payments').insertOne({
          orderId,
          authority,
          trackId,
          gateway: selectedGateway,
          amount: Number(amount),
          status: 'pending',
          mobile,
          email,
          createdAt: new Date(),
        });

        res.json({
          success: true,
          data: { authority, trackId, gateway: selectedGateway, paymentUrl },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'خطای سرور',
        });
      }
    }),
  );

  app.get(
    '/api/payment/verify',
    withHub(async (req, res) => {
      const baseUrl = getSiteUrl();
      try {
        const authority = typeof req.query.Authority === 'string' ? req.query.Authority : null;
        const status = typeof req.query.Status === 'string' ? req.query.Status : null;
        const trackIdStr = typeof req.query.trackId === 'string' ? req.query.trackId : null;
        const success = typeof req.query.success === 'string' ? req.query.success : null;

        const db = await connectHubDb();

        if (trackIdStr) {
          const trackId = parseInt(trackIdStr, 10);
          const payment = await db.collection('payments').findOne({ trackId });
          if (!payment) return res.redirect(`${baseUrl}/payment/failed?error=payment_not_found`);

          if (success !== '1') {
            await db.collection('payments').updateOne(
              { trackId },
              { $set: { status: 'cancelled', updatedAt: new Date() } },
            );
            return res.redirect(`${baseUrl}/payment/cancelled`);
          }

          const zibalConfig = await db.collection('paymentGateways').findOne({ type: 'zibal', active: true });
          const verifyResponse = await zibalVerifyPayment(
            db,
            trackId,
            String(zibalConfig?.merchant || zibalConfig?.merchantId),
          );

          if (verifyResponse.result !== 100 && verifyResponse.result !== 1) {
            await db.collection('payments').updateOne(
              { trackId },
              {
                $set: {
                  status: 'failed',
                  errorCode: verifyResponse.result,
                  updatedAt: new Date(),
                },
              },
            );
            return res.redirect(`${baseUrl}/payment/failed?error=${verifyResponse.result}`);
          }

          const refId = verifyResponse.refNumber;
          await db.collection('payments').updateOne(
            { trackId },
            {
              $set: {
                status: 'success',
                refId,
                cardPan: verifyResponse.cardNumber,
                verifiedAt: new Date(),
                updatedAt: new Date(),
              },
            },
          );
          await markOrderPaid(db, payment.orderId, refId);
          return res.redirect(`${baseUrl}/payment/success?refId=${refId}&orderId=${payment.orderId}`);
        }

        if (authority) {
          if (status !== 'OK') {
            await db.collection('payments').updateOne(
              { authority },
              { $set: { status: 'cancelled', updatedAt: new Date() } },
            );
            return res.redirect(`${baseUrl}/payment/cancelled`);
          }

          const payment = await db.collection('payments').findOne({ authority });
          if (!payment) return res.redirect(`${baseUrl}/payment/failed?error=payment_not_found`);

          const verifyResponse = await zarinpalVerifyPayment(db, authority, Number(payment.amount));
          const code = verifyResponse.data?.code;
          if (!verifyResponse.data || (code !== 100 && code !== 101)) {
            await db.collection('payments').updateOne(
              { authority },
              {
                $set: {
                  status: 'failed',
                  errorCode: code,
                  updatedAt: new Date(),
                },
              },
            );
            return res.redirect(`${baseUrl}/payment/failed?error=${code || 'unknown'}`);
          }

          const refId = verifyResponse.data.ref_id;
          await db.collection('payments').updateOne(
            { authority },
            {
              $set: {
                status: 'success',
                refId,
                cardPan: verifyResponse.data.card_pan,
                verifiedAt: new Date(),
                updatedAt: new Date(),
              },
            },
          );
          await markOrderPaid(db, payment.orderId, refId);
          return res.redirect(`${baseUrl}/payment/success?refId=${refId}&orderId=${payment.orderId}`);
        }

        return res.redirect(`${baseUrl}/payment/failed?error=invalid_parameters`);
      } catch {
        return res.redirect(`${baseUrl}/payment/failed?error=server_error`);
      }
    }),
  );
}
