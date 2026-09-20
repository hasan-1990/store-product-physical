import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import emailService from '@/lib/email';
import { connectDB } from '@/lib/mongodb';

// Helper: Check admin authentication
async function checkAdminAuth(request: NextRequest) {
  // Method 1: Check NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.role?.toLowerCase() === 'admin') {
    return { success: true, user: session.user };
  }

  // Method 2: Check Bearer token from localStorage
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const db = await connectDB();
      const user = await db.users.findOne({ 
        authToken: token,
        role: { $regex: /^admin$/i }
      });
      
      if (user) {
        return { success: true, user };
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }
  }

  return { success: false };
}

// POST - ارسال ایمیل تست
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'ایمیل مقصد الزامی است' },
        { status: 400 }
      );
    }

    // ارسال ایمیل تست
    const result = await emailService.send({
      to: email,
      subject: '📧 ایمیل تست - سیستم ایمیل فعال است!',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ایمیل تست</title>
        </head>
        <body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">✅ تست موفق!</h1>
                </div>
                
                <div style="padding: 40px 30px;">
                    <h2 style="color: #2d3748; margin-top: 0;">سیستم ایمیل به درستی کار می‌کند 🎉</h2>
                    
                    <p style="color: #4a5568; line-height: 1.8;">
                        این یک ایمیل تست است که از سیستم ارسال ایمیل شما ارسال شده است.
                    </p>
                    
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #667eea;">
                        <p style="margin: 10px 0;"><strong style="color: #2d3748;">زمان ارسال:</strong> ${new Date().toLocaleString('fa-IR')}</p>
                        <p style="margin: 10px 0;"><strong style="color: #2d3748;">وضعیت:</strong> <span style="color: #10b981;">✅ موفق</span></p>
                    </div>

                    <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h3 style="color: #047857; margin-top: 0;">✨ تنظیمات شما صحیح است!</h3>
                        <p style="color: #065f46; margin: 0;">
                            اکنون می‌توانید از سیستم ایمیل برای ارسال اطلاعیه‌ها، تایید سفارشات و سایر پیام‌ها استفاده کنید.
                        </p>
                    </div>
                    
                    <p style="color: #4a5568; line-height: 1.8;">
                        برای هرگونه سوال یا مشکل، با تیم پشتیبانی تماس بگیرید.
                    </p>
                </div>

                <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px;">
                    <p style="margin: 10px 0; color: #999; font-size: 12px;">
                        این یک ایمیل تست خودکار از پنل مدیریت است.
                    </p>
                    <p style="margin: 10px 0; color: #999; font-size: 12px;">
                        تاریخ و زمان: ${new Date().toLocaleString('fa-IR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `سیستم ایمیل به درستی کار می‌کند!
      
این یک ایمیل تست است که از سیستم ارسال ایمیل شما ارسال شده است.

زمان ارسال: ${new Date().toLocaleString('fa-IR')}
وضعیت: ✅ موفق

تنظیمات شما صحیح است! اکنون می‌توانید از سیستم ایمیل برای ارسال اطلاعیه‌ها، تایید سفارشات و سایر پیام‌ها استفاده کنید.
      `
    });

    if (result.success) {
      console.log('✅ Test email sent successfully to:', email, 'MessageID:', result.messageId);
      
      return NextResponse.json({
        success: true,
        message: 'ایمیل تست با موفقیت ارسال شد',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send test email:', result.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'خطا در ارسال ایمیل' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Exception in test email endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'خطا در ارسال ایمیل تست' 
      },
      { status: 500 }
    );
  }
}
