import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { validateEmail } from '@/utils/email-validation';
import { connectDB } from '@/lib/mongodb';

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean;
  private fromName: string;
  private fromAddress: string;
  private useResend: boolean;
  private resendApiKey: string | undefined;
  private settingsLoaded: boolean = false;

  constructor() {
    // Load initial settings from environment
    this.isEnabled = process.env.EMAIL_ENABLED === 'true';
    this.fromName = process.env.EMAIL_FROM_NAME || 'فروشگاه';
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@store.com';
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.useResend = !!this.resendApiKey;
    
    // Initialize transporter asynchronously
    this.initializeAsync();
  }

  /**
   * Load settings from database and initialize transporter
   */
  private async initializeAsync() {
    try {
      await this.loadSettingsFromDB();
      
      if (this.isEnabled) {
        if (this.useResend) {
          console.log('📧 Using Resend API for email delivery');
        } else {
          this.initTransporter();
        }
      } else {
        console.log('⚠️ Email service is disabled. Set EMAIL_ENABLED=true in .env or admin panel to enable.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  /**
   * Load email settings from database
   */
  private async loadSettingsFromDB() {
    try {
      const db = await connectDB();
      const emailSettings = await db.settings?.findOne({ key: 'emailSettings' });
      
      if (emailSettings?.value) {
        const settings = emailSettings.value;
        
        // Override environment settings with database settings
        this.isEnabled = settings.enabled ?? this.isEnabled;
        this.useResend = settings.useResend ?? this.useResend;
        this.resendApiKey = settings.resendApiKey || this.resendApiKey;
        this.fromName = settings.fromName || this.fromName;
        this.fromAddress = settings.fromAddress || this.fromAddress;
        
        this.settingsLoaded = true;
        console.log('✅ Email settings loaded from database');
      } else {
        console.log('ℹ️ No database email settings found, using environment variables');
      }
    } catch (error) {
      console.error('⚠️ Could not load email settings from database, using environment:', error);
    }
  }

  private async initTransporter() {
    try {
      // Load settings from database if not already loaded
      if (!this.settingsLoaded) {
        await this.loadSettingsFromDB();
      }

      // Get SMTP settings from database or environment
      const db = await connectDB();
      const emailSettings = await db.settings?.findOne({ key: 'emailSettings' });
      
      let smtpHost = process.env.SMTP_HOST;
      let smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 25;
      let smtpUser = process.env.SMTP_USER;
      let smtpPass = process.env.SMTP_PASS;
      let smtpSecure = process.env.SMTP_SECURE === 'true';
      
      // Override with database settings if available
      if (emailSettings?.value) {
        const settings = emailSettings.value;
        smtpHost = settings.smtpHost || smtpHost;
        smtpPort = settings.smtpPort || smtpPort;
        smtpUser = settings.smtpUser || smtpUser;
        smtpPass = settings.smtpPass || smtpPass;
        smtpSecure = settings.smtpSecure ?? smtpSecure;
      }

      if (smtpHost && smtpHost !== '172.17.0.1') {
        // استفاده از SMTP خارجی (مثل Gmail)
        console.log(`📧 Using SMTP: ${smtpHost}:${smtpPort}`);
        
        const config: nodemailer.TransportOptions = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: smtpUser && smtpPass ? {
            user: smtpUser,
            pass: smtpPass,
          } : undefined,
        } as any;
        
        this.transporter = nodemailer.createTransport(config);
      } else {
        // استفاده از Postfix محلی یا streamTransport
        console.log(`📧 Using local SMTP: ${smtpHost || 'localhost'}:${smtpPort}`);
        
        const config: nodemailer.TransportOptions = {
          host: smtpHost || 'localhost',
          port: smtpPort,
          secure: false,
          tls: {
            rejectUnauthorized: false
          }
        } as any;
        
        this.transporter = nodemailer.createTransport(config);
      }
      
      console.log('✅ Email transport initialized');
      
      if (this.transporter) {
        this.transporter.verify((error: Error | null) => {
          if (error) {
            console.error('❌ Email transporter verification failed:', error.message);
            this.isEnabled = false;
          } else {
            console.log('✅ Email service initialized and ready to send emails');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      this.isEnabled = false;
    }
  }

  /**
   * اعتبارسنجی آدرس‌های ایمیل
   */
  private validateRecipients(recipients: string | string[]): { valid: string[]; invalid: string[] } {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach(email => {
      const result = validateEmail(email.trim());
      if (result.isValid) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
        console.warn(`⚠️ Invalid email address: ${email} - ${result.error}`);
      }
    });

    return { valid, invalid };
  }

  /**
   * ارسال ایمیل
   */
  async send(config: EmailConfig): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isEnabled) {
      console.warn('⚠️ Email service is disabled');
      return { 
        success: false, 
        error: 'سرویس ایمیل غیرفعال است' 
      };
    }

    // اعتبارسنجی گیرندگان
    const { valid: validTo, invalid: invalidTo } = this.validateRecipients(config.to);
    
    if (validTo.length === 0) {
      return {
        success: false,
        error: 'هیچ آدرس ایمیل معتبری وجود ندارد'
      };
    }

    if (invalidTo.length > 0) {
      console.warn(`⚠️ Skipping invalid recipients: ${invalidTo.join(', ')}`);
    }

    // استفاده از Resend API
    if (this.useResend && this.resendApiKey) {
      return this.sendWithResend(config, validTo);
    }

    // استفاده از SMTP/Nodemailer
    if (!this.transporter) {
      return { 
        success: false, 
        error: 'سرویس ایمیل پیکربندی نشده است' 
      };
    }

    try {
      // اعتبارسنجی CC
      let validCc: string[] = [];
      if (config.cc) {
        const { valid } = this.validateRecipients(config.cc);
        validCc = valid;
      }

      // اعتبارسنجی BCC
      let validBcc: string[] = [];
      if (config.bcc) {
        const { valid } = this.validateRecipients(config.bcc);
        validBcc = valid;
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: validTo.join(', '),
        cc: validCc.length > 0 ? validCc.join(', ') : undefined,
        bcc: validBcc.length > 0 ? validBcc.join(', ') : undefined,
        subject: config.subject,
        html: config.html,
        text: config.text || this.htmlToText(config.html),
        attachments: config.attachments,
      };

      console.log('📧 Attempting to send email via SMTP:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const sendStartTime = Date.now();
      const info = await this.transporter.sendMail(mailOptions);
      const sendDuration = Date.now() - sendStartTime;
      
      console.log('✅ Email sent successfully via SMTP:', {
        messageId: info.messageId,
        to: validTo.join(', '),
        subject: config.subject,
        duration: `${sendDuration}ms`,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error: any) {
      console.error('❌ Failed to send email via SMTP:', {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack?.split('\n')[0]
      });
      
      return {
        success: false,
        error: error.message || 'خطا در ارسال ایمیل'
      };
    }
  }

  /**
   * ارسال ایمیل با Resend API
   */
  private async sendWithResend(config: EmailConfig, validTo: string[]): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.resendApiKey) {
        throw new Error('Resend API Key is not configured');
      }

      console.log('📧 Attempting to send email via Resend API:', {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: validTo.join(', '),
        subject: config.subject
      });

      const sendStartTime = Date.now();
      
      // Initialize Resend client
      const resend = new Resend(this.resendApiKey);
      
      // Send email using Resend SDK
      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromAddress}>`,
        to: validTo,
        subject: config.subject,
        html: config.html,
        text: config.text || this.htmlToText(config.html),
      });

      const sendDuration = Date.now() - sendStartTime;

      if (error) {
        throw new Error(error.message || 'Resend API error');
      }

      console.log('✅ Email sent successfully via Resend:', {
        messageId: data?.id,
        to: validTo.join(', '),
        subject: config.subject,
        duration: `${sendDuration}ms`
      });

      return {
        success: true,
        messageId: data?.id
      };

    } catch (error: any) {
      console.error('❌ Failed to send email via Resend:', {
        error: error.message,
        stack: error.stack?.split('\n')[0]
      });
      
      return {
        success: false,
        error: error.message || 'خطا در ارسال ایمیل با Resend'
      };
    }
  }

  /**
   * تبدیل HTML به متن ساده
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * ارسال ایمیل تأیید سفارش
   */
  async sendOrderConfirmation(order: any): Promise<boolean> {
    try {
      const html = this.generateOrderConfirmationHTML(order);

      const result = await this.send({
        to: order.contactInfo?.email || order.email,
        subject: `✅ تأیید سفارش - شماره ${order.orderNumber}`,
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error);
      return false;
    }
  }

  /**
   * ارسال لینک دانلود محصول دیجیتال
   */
  async sendDigitalProductEmail(order: any, downloadLinks: any[]): Promise<boolean> {
    try {
      const html = this.generateDigitalProductHTML(order, downloadLinks);

      const result = await this.send({
        to: order.contactInfo?.email || order.email,
        subject: `💾 محصولات دیجیتال شما آماده دانلود است - ${order.orderNumber}`,
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send digital product email:', error);
      return false;
    }
  }

  /**
   * ارسال ایمیل خوش‌آمدگویی
   */
  async sendWelcomeEmail(user: { email: string; name?: string }): Promise<boolean> {
    try {
      const html = this.generateWelcomeHTML(user);

      const result = await this.send({
        to: user.email,
        subject: '🎉 خوش آمدید! ثبت‌نام شما با موفقیت انجام شد',
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * ارسال لینک بازیابی رمز عبور
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">بازیابی رمز عبور</h2>
            <p style="color: #666; line-height: 1.8;">سلام،</p>
            <p style="color: #666; line-height: 1.8;">درخواستی برای بازیابی رمز عبور حساب کاربری شما دریافت شده است.</p>
            <p style="color: #666; line-height: 1.8;">برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">بازیابی رمز عبور</a>
            </div>
            <p style="color: #999; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              اگر درخواست بازیابی رمز عبور را ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.<br>
              این لینک تا 1 ساعت معتبر است.
            </p>
            <p style="color: #999; font-size: 14px;">با تشکر،<br>تیم فاتمز</p>
          </div>
        </body>
        </html>
      `;

      const result = await this.send({
        to: email,
        subject: '🔐 بازیابی رمز عبور',
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * ارسال اطلاع تغییر وضعیت سفارش
   */
  async sendOrderStatusUpdate(order: any, newStatus: string, trackingCode?: string): Promise<boolean> {
    try {
      const html = this.generateOrderStatusHTML(order, newStatus, trackingCode);

      const result = await this.send({
        to: order.contactInfo?.email || order.email,
        subject: `📦 بروزرسانی سفارش ${order.orderNumber}`,
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send order status update email:', error);
      return false;
    }
  }

  /**
   * ارسال پاسخ تیکت
   */
  async sendTicketReplyEmail(ticket: any, reply: string, adminName?: string): Promise<boolean> {
    try {
      const html = this.generateTicketReplyHTML(ticket, reply, adminName);

      const result = await this.send({
        to: ticket.userEmail,
        subject: `💬 پاسخ تیکت ${ticket.ticketNumber}`,
        html,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send ticket reply email:', error);
      return false;
    }
  }

  /**
   * ارسال فاکتور
   */
  async sendInvoice(order: any, invoicePDF?: Buffer): Promise<boolean> {
    try {
      const html = this.generateInvoiceHTML(order);

      const attachments: EmailAttachment[] = [];
      if (invoicePDF) {
        attachments.push({
          filename: `invoice-${order.orderNumber}.pdf`,
          content: invoicePDF,
          contentType: 'application/pdf'
        });
      }

      const result = await this.send({
        to: order.contactInfo?.email || order.email,
        subject: `📄 فاکتور سفارش ${order.orderNumber}`,
        html,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      return result.success;
    } catch (error) {
      console.error('❌ Failed to send invoice email:', error);
      return false;
    }
  }

  // ===== تمپلیت‌های HTML =====

  private getEmailHeader(): string {
    const logoUrl = process.env.EMAIL_LOGO_URL || '';
    const storeName = process.env.EMAIL_FROM_NAME || 'فروشگاه';

    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-width: 150px; margin-bottom: 20px;">` : ''}
        <h1 style="margin: 0; font-size: 28px;">${storeName}</h1>
      </div>
    `;
  }

  private getEmailFooter(): string {
    const supportEmail = process.env.EMAIL_SUPPORT_EMAIL || 'support@store.com';
    const supportPhone = process.env.EMAIL_SUPPORT_PHONE || '021-12345678';
    const websiteUrl = process.env.NEXTAUTH_URL || 'https://store.com';

    return `
      <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; margin-top: 30px;">
        <p style="margin: 10px 0;">📞 پشتیبانی: <strong>${supportPhone}</strong></p>
        <p style="margin: 10px 0;">📧 ایمیل: <a href="mailto:${supportEmail}" style="color: #667eea; text-decoration: none;">${supportEmail}</a></p>
        <p style="margin: 10px 0;">🌐 وبسایت: <a href="${websiteUrl}" style="color: #667eea; text-decoration: none;">${websiteUrl}</a></p>
        <p style="margin: 20px 0 10px; color: #999; font-size: 12px;">
          این ایمیل به صورت خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.
        </p>
      </div>
    `;
  }

  private generateOrderConfirmationHTML(order: any): string {
    const items = order.items || [];
    const totalAmount = order.totalAmount || 0;
    const orderNumber = order.orderNumber || '';
    const createdAt = new Date(order.createdAt || Date.now());

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تأیید سفارش</title>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ${this.getEmailHeader()}
        
        <div style="padding: 40px 30px;">
            <h2 style="color: #2d3748; margin-top: 0;">🎉 سفارش شما با موفقیت ثبت شد!</h2>
            <p style="color: #4a5568; line-height: 1.8;">از خرید شما متشکریم. سفارش شما در حال آماده‌سازی است و به زودی ارسال خواهد شد.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #667eea;">
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">شماره سفارش:</strong> <span style="color: #667eea; font-weight: bold;">${orderNumber}</span></p>
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">تاریخ:</strong> ${createdAt.toLocaleDateString('fa-IR')}</p>
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">وضعیت:</strong> ${order.paymentStatus === 'completed' ? '✅ پرداخت شده' : '⏳ در انتظار پرداخت'}</p>
            </div>

            <h3 style="color: #2d3748; margin-top: 30px;">📦 محصولات سفارش</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 12px; text-align: right; border-radius: 5px 0 0 0;">محصول</th>
                        <th style="padding: 12px; text-align: center;">تعداد</th>
                        <th style="padding: 12px; text-align: center;">قیمت</th>
                        <th style="padding: 12px; text-align: left; border-radius: 0 5px 0 0;">جمع</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: any, index: number) => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 15px 12px; color: #2d3748;">${item.name}</td>
                            <td style="padding: 15px 12px; text-align: center; color: #4a5568;">${item.quantity}</td>
                            <td style="padding: 15px 12px; text-align: center; color: #4a5568;">${item.price.toLocaleString('fa-IR')} تومان</td>
                            <td style="padding: 15px 12px; text-align: left; color: #2d3748; font-weight: bold;">${(item.price * item.quantity).toLocaleString('fa-IR')} تومان</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: left; font-size: 20px; font-weight: bold; color: #667eea; margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                جمع کل: ${totalAmount.toLocaleString('fa-IR')} تومان
            </div>

            ${order.shippingAddress ? `
                <h3 style="color: #2d3748; margin-top: 30px;">📍 آدرس ارسال</h3>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 8px 0; color: #4a5568;"><strong>گیرنده:</strong> ${order.contactInfo?.firstName || ''} ${order.contactInfo?.lastName || ''}</p>
                    <p style="margin: 8px 0; color: #4a5568;"><strong>آدرس:</strong> ${order.shippingAddress.address || ''}</p>
                    <p style="margin: 8px 0; color: #4a5568;"><strong>شهر:</strong> ${order.shippingAddress.city || ''}</p>
                    <p style="margin: 8px 0; color: #4a5568;"><strong>کد پستی:</strong> ${order.shippingAddress.zipCode || ''}</p>
                    <p style="margin: 8px 0; color: #4a5568;"><strong>تلفن:</strong> ${order.contactInfo?.phone || ''}</p>
                </div>
            ` : ''}

            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXTAUTH_URL}/profile/orders/${order._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    مشاهده جزئیات سفارش
                </a>
            </div>

            <div style="background: #ebf8ff; border: 1px solid #bee3f8; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; color: #2c5282; font-size: 14px;">
                    💡 <strong>نکته:</strong> می‌توانید از طریق پروفایل کاربری خود، وضعیت سفارش را به صورت لحظه‌ای پیگیری کنید.
                </p>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generateDigitalProductHTML(order: any, downloadLinks: any[]): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💾 محصولات دیجیتال شما آماده است!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">شماره سفارش: ${order.orderNumber}</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #2d3748; line-height: 1.8;">با سلام،</p>
            <p style="color: #4a5568; line-height: 1.8;">محصولات دیجیتال خریداری شده شما آماده دانلود است. روی دکمه دانلود کلیک کنید:</p>

            ${downloadLinks.map(link => `
                <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #e2e8f0;">
                    <h3 style="margin: 0 0 15px 0; color: #2d3748;">📦 ${link.productName}</h3>
                    <p style="margin: 8px 0; color: #4a5568; font-size: 14px;">
                        حجم: <strong>${link.fileSize || 'نامشخص'}</strong> | 
                        فرمت: <strong>${link.fileFormat || 'نامشخص'}</strong>
                    </p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${link.downloadUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                            ⬇️ دانلود محصول
                        </a>
                    </div>
                </div>
            `).join('')}

            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #856404; font-weight: bold;">⚠️ نکات مهم:</p>
                <ul style="margin: 0; padding-right: 20px; color: #856404;">
                    <li style="margin: 8px 0;">لینک دانلود تا <strong>${downloadLinks[0]?.expiresIn || '7 روز'}</strong> معتبر است</li>
                    <li style="margin: 8px 0;">هر لینک حداکثر <strong>${downloadLinks[0]?.maxDownloads || '5'} بار</strong> قابل دانلود است</li>
                    <li style="margin: 8px 0;">در صورت مشکل در دانلود، با پشتیبانی تماس بگیرید</li>
                    <li style="margin: 8px 0;">فایل دانلود شده را در مکان امنی ذخیره کنید</li>
                </ul>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generateWelcomeHTML(user: { name?: string; email: string }): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 36px;">🎉</h1>
            <h1 style="margin: 20px 0 10px; font-size: 32px;">خوش آمدید!</h1>
            <p style="margin: 0; opacity: 0.95; font-size: 16px;">به جمع مشتریان ما خوش آمدید</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #2d3748; font-size: 18px; line-height: 1.8;">
                سلام ${user.name || 'کاربر گرامی'} عزیز! 👋
            </p>
            <p style="color: #4a5568; line-height: 1.8;">
                با تشکر از ثبت‌نام شما در فروشگاه ما! ما خوشحالیم که شما را در جمع خود داریم.
            </p>

            <div style="background: linear-gradient(to bottom, #f7fafc, #edf2f7); padding: 25px; border-radius: 10px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #2d3748;">✨ حالا می‌توانید:</h3>
                <ul style="margin: 0; padding-right: 20px; color: #4a5568; line-height: 2;">
                    <li>🛍️ خرید آسان و سریع محصولات</li>
                    <li>📦 پیگیری سفارش‌های خود</li>
                    <li>⭐ ثبت نظرات و امتیازدهی</li>
                    <li>🎁 دریافت تخفیف‌های ویژه</li>
                    <li>💾 دسترسی به محصولات دیجیتال</li>
                    <li>🎫 ارسال تیکت پشتیبانی</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXTAUTH_URL}/profile" 
                   style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                    مشاهده پروفایل
                </a>
            </div>

            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXTAUTH_URL}/products" 
                   style="display: inline-block; background: white; color: #f5576c; border: 2px solid #f5576c; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    شروع خرید
                </a>
            </div>

            <div style="background: #ebf8ff; border-right: 4px solid #3182ce; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <p style="margin: 0; color: #2c5282; line-height: 1.8;">
                    💡 <strong>نکته:</strong> برای دریافت اطلاعات جدیدترین محصولات و تخفیف‌های ویژه، حتماً ایمیل‌های ما را دنبال کنید!
                </p>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generatePasswordResetHTML(email: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🔐</div>
            <h1 style="margin: 0; font-size: 28px;">بازیابی رمز عبور</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #2d3748; line-height: 1.8;">سلام،</p>
            <p style="color: #4a5568; line-height: 1.8;">
                درخواست بازیابی رمز عبور برای حساب کاربری <strong>${email}</strong> دریافت شد.
            </p>
            <p style="color: #4a5568; line-height: 1.8;">
                برای تغییر رمز عبور خود، روی دکمه زیر کلیک کنید:
            </p>

            <div style="text-align: center; margin: 35px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    تغییر رمز عبور
                </a>
            </div>

            <div style="background: #fff5f5; border: 2px solid #fc8181; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #c53030; font-weight: bold;">⚠️ نکات امنیتی:</p>
                <ul style="margin: 0; padding-right: 20px; color: #742a2a;">
                    <li style="margin: 8px 0;">این لینک تا <strong>30 دقیقه</strong> معتبر است</li>
                    <li style="margin: 8px 0;">اگر شما درخواست نکرده‌اید، این ایمیل را نادیده بگیرید</li>
                    <li style="margin: 8px 0;">رمز عبور خود را با کسی به اشتراک نگذارید</li>
                    <li style="margin: 8px 0;">از رمزهای قوی و منحصر به فرد استفاده کنید</li>
                </ul>
            </div>

            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                    <strong>مشکل در کلیک روی دکمه؟</strong><br>
                    لینک زیر را کپی کرده و در مرورگر خود باز کنید:<br>
                    <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
                </p>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generateOrderStatusHTML(order: any, newStatus: string, trackingCode?: string): string {
    const statusMessages: Record<string, { title: string; icon: string; color: string; message: string }> = {
      'CONFIRMED': {
        title: 'سفارش تأیید شد',
        icon: '✅',
        color: '#48bb78',
        message: 'سفارش شما توسط فروشگاه تأیید و در حال آماده‌سازی است.'
      },
      'PROCESSING': {
        title: 'در حال آماده‌سازی',
        icon: '⚙️',
        color: '#ed8936',
        message: 'سفارش شما در حال آماده‌سازی برای ارسال است.'
      },
      'SHIPPED': {
        title: 'سفارش ارسال شد',
        icon: '🚚',
        color: '#4299e1',
        message: 'سفارش شما به پست تحویل داده شد و در مسیر ارسال است.'
      },
      'DELIVERED': {
        title: 'تحویل داده شد',
        icon: '🎉',
        color: '#38b2ac',
        message: 'سفارش شما با موفقیت تحویل داده شد. از خرید شما متشکریم!'
      },
      'CANCELLED': {
        title: 'سفارش لغو شد',
        icon: '❌',
        color: '#f56565',
        message: 'سفارش شما لغو شد. در صورت کسر مبلغ، طی 72 ساعت بازگردانده می‌شود.'
      }
    };

    const statusInfo = statusMessages[newStatus] || {
      title: 'بروزرسانی سفارش',
      icon: '📦',
      color: '#667eea',
      message: 'وضعیت سفارش شما تغییر کرد.'
    };

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 40px 20px; text-align: center;">
            <div style="font-size: 56px; margin-bottom: 15px;">${statusInfo.icon}</div>
            <h1 style="margin: 0; font-size: 28px;">${statusInfo.title}</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">شماره سفارش: ${order.orderNumber}</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="color: #2d3748; font-size: 18px; line-height: 1.8;">
                ${statusInfo.message}
            </p>

            ${trackingCode ? `
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid ${statusInfo.color};">
                    <p style="margin: 0; color: #2d3748;">
                        <strong>کد رهگیری پستی:</strong><br>
                        <span style="font-size: 24px; color: ${statusInfo.color}; font-weight: bold; letter-spacing: 2px;">${trackingCode}</span>
                    </p>
                </div>
            ` : ''}

            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXTAUTH_URL}/profile/orders/${order._id}" 
                   style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px ${statusInfo.color}66;">
                    مشاهده جزئیات سفارش
                </a>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generateTicketReplyHTML(ticket: any, reply: string, adminName?: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">💬</div>
            <h1 style="margin: 0; font-size: 28px;">پاسخ تیکت پشتیبانی</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">شماره: ${ticket.ticketNumber}</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-right: 4px solid #667eea;">
                <p style="margin: 0 0 5px; color: #718096; font-size: 14px;"><strong>موضوع تیکت:</strong></p>
                <p style="margin: 0; color: #2d3748; font-size: 16px;">${ticket.subject}</p>
            </div>

            <div style="background: white; border: 2px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; margin-left: 12px;">
                        👤
                    </div>
                    <div>
                        <p style="margin: 0; color: #2d3748; font-weight: bold;">${adminName || 'تیم پشتیبانی'}</p>
                        <p style="margin: 0; color: #718096; font-size: 12px;">${new Date().toLocaleDateString('fa-IR')}</p>
                    </div>
                </div>
                <p style="color: #2d3748; line-height: 1.8; white-space: pre-wrap;">${reply}</p>
            </div>

            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXTAUTH_URL}/profile/tickets/${ticket._id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                    مشاهده تیکت و پاسخ
                </a>
            </div>

            <div style="background: #ebf8ff; border-right: 4px solid #3182ce; padding: 20px; border-radius: 8px; margin-top: 25px;">
                <p style="margin: 0; color: #2c5282; line-height: 1.8;">
                    💡 <strong>نکته:</strong> برای ادامه گفتگو، می‌توانید از طریق پروفایل کاربری خود به تیکت پاسخ دهید.
                </p>
            </div>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }

  private generateInvoiceHTML(order: any): string {
    const items = order.items || [];
    const totalAmount = order.totalAmount || 0;

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
        ${this.getEmailHeader()}
        
        <div style="padding: 40px 30px;">
            <h2 style="color: #2d3748; margin-top: 0;">📄 فاکتور رسمی</h2>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 10px 0;"><strong>شماره فاکتور:</strong> ${order.orderNumber}</p>
                <p style="margin: 10px 0;"><strong>تاریخ:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString('fa-IR')}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 12px; text-align: right;">محصول</th>
                        <th style="padding: 12px; text-align: center;">تعداد</th>
                        <th style="padding: 12px; text-align: left;">مبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item: any) => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">${item.name}</td>
                            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                            <td style="padding: 12px; text-align: left;">${(item.price * item.quantity).toLocaleString('fa-IR')} تومان</td>
                        </tr>
                    `).join('')}
                    <tr style="background: #f7fafc; font-weight: bold;">
                        <td colspan="2" style="padding: 15px; text-align: right;">جمع کل:</td>
                        <td style="padding: 15px; text-align: left; color: #667eea; font-size: 18px;">${totalAmount.toLocaleString('fa-IR')} تومان</td>
                    </tr>
                </tbody>
            </table>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                💡 فایل PDF فاکتور به این ایمیل ضمیمه شده است.
            </p>
        </div>

        ${this.getEmailFooter()}
    </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
