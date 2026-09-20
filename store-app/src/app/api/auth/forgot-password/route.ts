import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SMSService } from '@/lib/sms-service';
import { validateMobileWithMessage } from '@/utils/mobile-validation';
import { z } from 'zod';
import crypto from 'crypto';
import { emailService } from '@/lib/email';

const forgotPasswordSchema = z.object({
  phone: z.string()
    .min(10, 'شماره موبایل کوتاه است')
    .max(15, 'شماره موبایل بلند است')
    .refine((phone) => {
      const validation = validateMobileWithMessage(phone);
      return validation.isValid;
    }, {
      message: 'شماره موبایل ایرانی معتبر وارد کنید'
    })
    .optional(),
  email: z.string().email('ایمیل معتبر وارد کنید').optional(),
});

function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Simulate SMS service
async function sendSMS(phone: string, code: string): Promise<boolean> {
  // استفاده از سرویس واقعی SMS
  return await SMSService.sendVerificationCode(phone, code);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is email-based or phone-based
    if (body.email) {
      // تشخیص اینکه کاربر عادی است یا ادمین
      // اگر isAdmin=true باشه یا اگر کاربر ادمین باشه، از روش لینک استفاده میکنیم
      // در غیر این صورت، کد تایید ارسال میکنیم
      return await handleEmailReset(body.email, body.isAdmin);
    } else if (body.phone) {
      return await handlePhoneReset(body.phone, body.isAdmin);
    } else {
      return NextResponse.json(
        { success: false, error: 'ایمیل یا شماره موبایل الزامی است' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// Handle email-based password reset
async function handleEmailReset(email: string, isAdmin?: boolean) {
  try {
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.users;

    // Check if user exists
    const query: any = { email: email.toLowerCase() };

    // اگر isAdmin=true باشه، فقط ادمین‌ها رو چک کن
    if (isAdmin) {
      query.role = { $regex: /^admin$/i }; // Support both 'admin' and 'ADMIN'
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: isAdmin
          ? 'اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی ارسال خواهد شد.'
          : 'اگر این ایمیل در سیستم وجود داشته باشد، کد تایید ارسال خواهد شد.'
      });
    }

    // برای ادمین‌ها از روش لینک استفاده میکنیم
    // برای کاربران عادی از روش کد تایید استفاده میکنیم
    const isUserAdmin = user.role && user.role.toLowerCase() === 'admin';

    if (isUserAdmin || isAdmin) {
      // روش لینک بازیابی (برای ادمین‌ها)
      return await sendResetLinkToEmail(email, usersCollection);
    } else {
      // روش کد تایید (برای کاربران عادی)
      return await sendVerificationCodeToEmail(email, db);
    }
  } catch (error) {
    console.error('❌ Error in email-based password reset:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// ارسال لینک بازیابی به ایمیل (برای ادمین‌ها)
async function sendResetLinkToEmail(email: string, usersCollection: any) {
  try {
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetToken: resetTokenHash,
          resetTokenExpiry: resetTokenExpiry,
        },
      }
    );

    // Create reset URL
    const baseUrl = process.env.NEXTAUTH_URL ||
                    (process.env.NODE_ENV === 'production'
                      ? 'https://fathemes.com'
                      : 'http://localhost:3000');
    const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    // Send email with reset link
    console.log('🔐 Password Reset Request:');
    console.log('Email:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Token expires:', resetTokenExpiry);

    let emailResult;
    try {
      emailResult = await emailService.send({
        to: email,
        subject: '🔐 بازیابی رمز عبور - پنل مدیریت',
        html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333; line-height: 1.8; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .warning { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 بازیابی رمز عبور</h1>
            </div>
            <div class="content">
              <p>سلام عزیز،</p>
              <p>درخواست بازیابی رمز عبور برای حساب مدیریت شما دریافت شد.</p>
              <p>برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
              <center>
                <a href="${resetUrl}" class="button">بازیابی رمز عبور</a>
              </center>
              <p>یا می‌توانید این لینک را در مرورگر خود کپی کنید:</p>
              <p style="background: #f3f4f6; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 13px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ توجه:</strong>
                <ul style="margin: 10px 0; padding-right: 20px;">
                  <li>این لینک فقط <strong>۱ ساعت</strong> اعتبار دارد.</li>
                  <li>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</li>
                  <li>هرگز رمز عبور خود را با دیگران به اشتراک نگذارید.</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>این ایمیل به صورت خودکار ارسال شده است.</p>
              <p>© 2025 فروشگاه هاب - تمامی حقوق محفوظ است</p>
            </div>
          </div>
        </body>
        </html>

        `
      });
    } catch (err) {
      console.error('❌ Exception thrown during emailService.send:', {
        error: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
        email,
        resetUrl,
        resetToken,
        resetTokenExpiry
      });
      return NextResponse.json({ error: 'خطا در ارسال ایمیل (exception)' }, { status: 500 });
    }

    if (!emailResult || !emailResult.success) {
      console.error('❌ Failed to send reset email:', {
        error: emailResult?.error,
        email,
        resetUrl,
        resetToken,
        resetTokenExpiry
      });
      // Don't reveal to user that email failed for security
    }

    return NextResponse.json({
      success: true,
      message: 'لینک بازیابی ارسال شد',
      // Only include resetUrl in development
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('❌ Error sending reset link:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// ارسال کد تایید به ایمیل (برای کاربران عادی)
async function sendVerificationCodeToEmail(email: string, db: any) {
  try {
    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await db.verificationCodes.deleteMany({ email: email.toLowerCase() }); // Remove old codes
    await db.verificationCodes.insertOne({
      email: email.toLowerCase(),
      code: verificationCode,
      type: 'password_reset',
      expiresAt,
      createdAt: new Date(),
      used: false
    });

    console.log('📧 Sending verification code to email:', email);
    console.log('📧 Code:', verificationCode);

    // ارسال ایمیل با کد تایید
    let emailResult;
    try {
      emailResult = await emailService.send({
        to: email,
        subject: '🔐 کد تایید بازیابی رمز عبور',
        html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333; line-height: 1.8; margin: 15px 0; }
            .code-box { background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .code { font-size: 42px; font-weight: bold; color: #9333ea; letter-spacing: 8px; margin: 0; }
            .warning { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 بازیابی رمز عبور</h1>
            </div>
            <div class="content">
              <p>سلام عزیز،</p>
              <p>درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.</p>
              <p>کد تایید شما:</p>
              <div class="code-box">
                <p class="code">${verificationCode}</p>
              </div>
              <p>این کد را در صفحه بازیابی رمز عبور وارد کنید.</p>
              <div class="warning">
                <strong>⚠️ توجه:</strong>
                <ul style="margin: 10px 0; padding-right: 20px;">
                  <li>این کد فقط <strong>۱۰ دقیقه</strong> اعتبار دارد.</li>
                  <li>اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</li>
                  <li>هرگز کد تایید خود را با دیگران به اشتراک نگذارید.</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>این ایمیل به صورت خودکار ارسال شده است.</p>
              <p>© 2025 فروشگاه هاب - تمامی حقوق محفوظ است</p>
            </div>
          </div>
        </body>
        </html>
        `
      });
    } catch (err) {
      console.error('❌ Exception during email send:', err);
      return NextResponse.json({ error: 'خطا در ارسال ایمیل' }, { status: 500 });
    }

    if (!emailResult || !emailResult.success) {
      console.error('❌ Failed to send verification email:', emailResult?.error);
      return NextResponse.json({
        success: false,
        error: 'خطا در ارسال ایمیل'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به ایمیل شما ارسال شد',
    });

  } catch (error) {
    console.error('❌ Error sending verification code:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
}

// Handle phone-based password reset (for regular users and admins)
async function handlePhoneReset(phone: string, isAdmin?: boolean) {
  try {
    const validation = validateMobileWithMessage(phone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Check if user exists with this phone number
    const query: any = { phone };
    if (isAdmin) {
      // Support both 'admin' and 'ADMIN' (case-insensitive)
      query.role = { $regex: /^admin$/i };
    }
    
    const user = await db.users.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: isAdmin ? 'مدیری با این شماره موبایل یافت نشد' : 'کاربری با این شماره موبایل یافت نشد' },
        { status: 404 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await db.verificationCodes.deleteMany({ phone }); // Remove old codes
    await db.verificationCodes.insertOne({
      phone,
      code: verificationCode,
      type: 'password_reset',
      expiresAt,
      createdAt: new Date(),
      used: false
    });

    // Send SMS
    const smsSent = await sendSMS(phone, verificationCode);

    if (!smsSent) {
      return NextResponse.json(
        { success: false, error: 'خطا در ارسال پیامک' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'کد تأیید به شماره موبایل شما ارسال شد',
      phone: phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') // Mask phone number
    });

  } catch (error) {
    console.error('Phone reset error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
}