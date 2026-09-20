import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import nodemailer from 'nodemailer';

// Authentication helper
async function checkAdminAuth(request: NextRequest) {
  // First try NextAuth session
  const session = await getServerSession(authOptions);
  console.log('Session:', session);
  
  if (session?.user?.role?.toLowerCase() === 'admin') {
    return { authenticated: true, source: 'session' };
  }

  // Fallback to Bearer token
  const authHeader = request.headers.get('authorization');
  console.log('Authorization header:', authHeader);

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Token found:', token.substring(0, 20) + '...');
    
    try {
      // Decode base64 JWT payload
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('Token payload:', payload);
        
        if (payload.role?.toLowerCase() === 'admin') {
          return { authenticated: true, source: 'token' };
        }
      }
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }

  return { authenticated: false };
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    
    if (!authCheck.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { subject, body, recipients } = await request.json();

    if (!subject || !body || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'موضوع، متن و گیرندگان الزامی است' },
        { status: 400 }
      );
    }

    // Get email settings
    const db = await connectDB();
    const settingsCollection = db.getCollection('settings');
    const settingsDoc = await settingsCollection.findOne({ key: 'email' });

    if (!settingsDoc || !settingsDoc.value.enabled) {
      return NextResponse.json(
        { success: false, error: 'سیستم ایمیل غیرفعال است' },
        { status: 400 }
      );
    }

    const settings = settingsDoc.value;

    // Send emails
    let successCount = 0;
    let failedEmails: string[] = [];

    if (settings.useResend && settings.resendApiKey) {
      // Use Resend API
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: `${settings.fromName} <${settings.fromAddress}>`,
            to: recipients,
            subject: subject,
            html: body
          })
        });

        if (resendResponse.ok) {
          successCount = recipients.length;
        } else {
          failedEmails = recipients;
        }
      } catch (error) {
        console.error('Resend error:', error);
        failedEmails = recipients;
      }
    } else {
      // Use SMTP
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        auth: settings.smtpUser && settings.smtpPass ? {
          user: settings.smtpUser,
          pass: settings.smtpPass
        } : undefined
      });

      // Send to each recipient
      for (const email of recipients) {
        try {
          await transporter.sendMail({
            from: `${settings.fromName} <${settings.fromAddress}>`,
            to: email,
            subject: subject,
            html: body
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
          failedEmails.push(email);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSent: successCount,
        totalFailed: failedEmails.length,
        failedEmails
      }
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال ایمیل گروهی' },
      { status: 500 }
    );
  }
}
