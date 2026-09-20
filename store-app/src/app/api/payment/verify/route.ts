import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment as zarinpalVerify } from '@/lib/zarinpal';
import { verifyPayment as zibalVerify } from '@/lib/zibal';
import { getStatusMessage as getZarinpalMessage } from '@/utils/zarinpal-messages';
import { getStatusMessage as getZibalMessage } from '@/utils/zibal-messages';
import { connectDB } from '@/lib/mongodb';

/**
 * API تایید پرداخت
 * GET /api/payment/verify
 * پشتیبانی از ZarinPal و Zibal
 */
export async function GET(request: NextRequest) {
  // استفاده از دامنه اصلی برای redirect به جای request.url
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fathemes.com';
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // پارامترهای ZarinPal
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');
    
    // پارامترهای Zibal (Callback Format: ?trackId=xxx&success=1&status=2&orderId=xxx)
    const trackId = searchParams.get('trackId');
    const success = searchParams.get('success');
    const zibalStatus = searchParams.get('status'); // وضعیت پرداخت Zibal
    const orderId = searchParams.get('orderId'); // شناسه سفارش

    console.log('========================================');
    console.log('🔍 Payment Verification Started');
    console.log('Authority (ZarinPal):', authority);
    console.log('Status (ZarinPal):', status);
    console.log('trackId (Zibal):', trackId);
    console.log('success (Zibal):', success);
    console.log('zibalStatus (Zibal):', zibalStatus);
    console.log('orderId:', orderId);
    console.log('Full URL:', request.url);
    console.log('Base URL for redirect:', baseUrl);
    console.log('========================================');

    const db = await connectDB();
    let payment;

    // تشخیص درگاه
    if (trackId) {
      // Zibal callback
      payment = await db.payments.findOne({ trackId: parseInt(trackId) });
      
      if (!payment) {
        console.error('❌ Payment record not found for trackId:', trackId);
        return NextResponse.redirect(
          new URL('/payment/failed?error=payment_not_found', baseUrl)
        );
      }

      // بررسی وضعیت
      if (success !== '1') {
        // پرداخت لغو شده یا ناموفق
        await db.payments.updateOne(
          { trackId: parseInt(trackId) },
          { 
            $set: { 
              status: 'cancelled',
              updatedAt: new Date(),
            } 
          }
        );

        return NextResponse.redirect(
          new URL('/payment/cancelled', baseUrl)
        );
      }

      console.log('💰 Payment amount from DB:', payment.amount, 'Rials');

      // تایید پرداخت از Zibal
      try {
        const zibalConfig = await db.paymentGateways.findOne({ type: 'zibal', active: true });
        
        const verifyResponse = await zibalVerify({
          merchant: zibalConfig?.merchant || zibalConfig?.merchantId || 'zibal',
          trackId: parseInt(trackId),
        });

        // بررسی وضعیت تایید (100 یا 1 برای موفقیت)
        if (verifyResponse.result !== 100 && verifyResponse.result !== 1) {
          console.error('❌ Zibal verification failed:', verifyResponse.result, verifyResponse.message);
          
          await db.payments.updateOne(
            { trackId: parseInt(trackId) },
            { 
              $set: { 
                status: 'failed',
                errorCode: verifyResponse.result,
                errorMessage: getZibalMessage(verifyResponse.result).message,
                updatedAt: new Date(),
              } 
            }
          );

          return NextResponse.redirect(
            new URL(`/payment/failed?error=${verifyResponse.result}`, baseUrl)
          );
        }

        // پرداخت موفق
        const refId = verifyResponse.refNumber;
        const cardPan = verifyResponse.cardNumber;

        await db.payments.updateOne(
          { trackId: parseInt(trackId) },
          { 
            $set: { 
              status: 'success',
              refId,
              cardPan,
              verifiedAt: new Date(),
              updatedAt: new Date(),
            } 
          }
        );

        // به‌روزرسانی وضعیت سفارش
        await db.orders.updateOne(
          { _id: payment.orderId },
          { 
            $set: { 
              paymentStatus: 'paid',
              status: 'processing',
              refId,
              paidAt: new Date(),
            } 
          }
        );

        // هدایت به صفحه موفقیت
        return NextResponse.redirect(
          new URL(`/payment/success?refId=${refId}&orderId=${payment.orderId}`, baseUrl)
        );

      } catch (error) {
        console.error('❌ Zibal Verification Error:', error);
        return NextResponse.redirect(
          new URL('/payment/failed?error=verification_error', baseUrl)
        );
      }

    } else if (authority) {
      // ZarinPal callback

      // بررسی وضعیت
      if (status !== 'OK') {
        // پرداخت لغو شده
        await db.payments.updateOne(
          { authority },
          { 
            $set: { 
              status: 'cancelled',
              updatedAt: new Date(),
            } 
          }
        );

        return NextResponse.redirect(
          new URL('/payment/cancelled', baseUrl)
        );
      }

      // دریافت اطلاعات پرداخت از دیتابیس
      payment = await db.payments.findOne({ authority });

      if (!payment) {
        console.error('❌ Payment record not found for authority:', authority);
        return NextResponse.redirect(
          new URL('/payment/failed?error=payment_not_found', baseUrl)
        );
      }

      console.log('💰 Payment amount from DB:', payment.amount, 'Rials');

      // تایید پرداخت از زرین‌پال (مبلغ باید به ریال باشه)
      const verifyResponse = await zarinpalVerify({
        authority,
        amount: payment.amount, // این مبلغ به ریال است
      });

      // کدهای 100 و 101 برای پرداخت موفق هستند
      if (!verifyResponse.data || (verifyResponse.data.code !== 100 && verifyResponse.data.code !== 101)) {
        // پرداخت ناموفق
        console.error('❌ Payment verification failed:', verifyResponse.data?.code, verifyResponse.data?.message);
        
        await db.payments.updateOne(
          { authority },
          { 
            $set: { 
              status: 'failed',
              errorCode: verifyResponse.data?.code,
              errorMessage: getZarinpalMessage(verifyResponse.data?.code || -52),
              updatedAt: new Date(),
            } 
          }
        );

        return NextResponse.redirect(
          new URL(
            `/payment/failed?error=${verifyResponse.data?.code || 'unknown'}`,
            baseUrl
          )
        );
      }

      // پرداخت موفق
      const refId = verifyResponse.data.ref_id;
      const cardPan = verifyResponse.data.card_pan;

      await db.payments.updateOne(
        { authority },
        { 
          $set: { 
            status: 'success',
            refId,
            cardPan,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          } 
        }
      );

      // به‌روزرسانی وضعیت سفارش
      await db.orders.updateOne(
        { _id: payment.orderId },
        { 
          $set: { 
            paymentStatus: 'paid',
            status: 'processing',
            refId,
            paidAt: new Date(),
          } 
        }
      );

      // هدایت به صفحه موفقیت
      return NextResponse.redirect(
        new URL(`/payment/success?refId=${refId}&orderId=${payment.orderId}`, baseUrl)
      );
      
    } else {
      // پارامترهای نامعتبر
      return NextResponse.redirect(
        new URL('/payment/failed?error=invalid_parameters', baseUrl)
      );
    }

  } catch (error) {
    console.error('❌ Payment Verification Error:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=server_error', baseUrl)
    );
  }
}
