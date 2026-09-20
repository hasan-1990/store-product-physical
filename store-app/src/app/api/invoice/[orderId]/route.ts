import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { isAdminRole, resolveRequestAuth } from '@/lib/resolve-request-auth';
import { isOrderPaidForInvoice } from '@/lib/order-status';

export const dynamic = 'force-dynamic';

// GET - دریافت فاکتور به صورت HTML
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { orderId } = await params;
    
    const auth = await resolveRequestAuth(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

  const db = await connectDB();
  const { ObjectId } = require('mongodb');
    
    // دریافت سفارش - سعی کن با ObjectId و اگر نشد با orderNumber
    let order;
    try {
      order = await db.orders.findOne({ _id: new ObjectId(orderId) });
    } catch (e) {
      // اگر orderId یک ObjectId معتبر نیست، با orderNumber جستجو کن
      order = await db.orders.findOne({ orderNumber: orderId });
    }
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'سفارش یافت نشد' },
        { status: 404 }
      );
    }

    if (!isOrderPaidForInvoice(order.paymentStatus)) {
      return NextResponse.json(
        { success: false, error: 'فاکتور فقط برای سفارش‌های پرداخت‌شده صادر می‌شود' },
        { status: 400 }
      );
    }

    // بررسی اینکه سفارش متعلق به کاربر است
    const orderUserId = typeof order.userId === 'object' ? order.userId.toString() : String(order.userId);
    if (!isAdminRole(auth.role) && orderUserId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // دریافت اطلاعات محصولات برای گرفتن عکس‌ها
    const productIds = order.items.map((item: any) => {
      try {
        return new ObjectId(item.productId);
      } catch {
        return null;
      }
    }).filter((id: any) => id !== null);

    const products = await db.products.find({
      _id: { $in: productIds }
    }).toArray();

    // اضافه کردن عکس محصولات به items
    order.items = order.items.map((item: any) => {
      const productIdStr = typeof item.productId === 'object' ? item.productId.toString() : item.productId;
      const product = products.find((p: any) => {
        const pIdStr = typeof p._id === 'object' ? p._id.toString() : String(p._id);
        return pIdStr === productIdStr;
      });
      
      return {
        ...item,
        image: product?.imageUrl || product?.gallery?.[0] || product?.images?.[0] || product?.image || null
      };
    });

    // دریافت تنظیمات فاکتور
    const invoiceSettings = await db.invoiceSettings.findOne({});
    
    const settings = invoiceSettings || {
      companyName: 'فروشگاه آنلاین',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      companyWebsite: '',
      taxId: '',
      logoUrl: '',
      showLogo: true,
      showTax: false,
      taxRate: 9,
      invoicePrefix: 'INV',
      invoiceNotes: 'از خرید شما متشکریم',
      footerText: 'این فاکتور به صورت الکترونیکی تولید شده است'
    };

    // محاسبه جزئیات
    const subtotal = order.totalAmount + (order.discountAmount || 0);
    const taxAmount = settings.showTax ? (subtotal * settings.taxRate / 100) : 0;
    const finalTotal = order.totalAmount + taxAmount;

    // ایجاد HTML فاکتور
    const invoiceHTML = generateInvoiceHTML(order, settings, subtotal, taxAmount, finalTotal);

    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در تولید فاکتور' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(order: any, settings: any, subtotal: number, taxAmount: number, finalTotal: number): string {
  const orderDate = new Date(order.createdAt).toLocaleDateString('fa-IR');
  const invoiceNumber = `${settings.invoicePrefix}-${order.orderNumber}`;

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Tahoma', 'Arial', sans-serif;
      background: #f5f5f5;
      padding: 20px;
      direction: rtl;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .company-logo {
      width: 120px;
      height: 120px;
      margin: 0 auto 20px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    
    .invoice-header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .invoice-number {
      font-size: 18px;
      opacity: 0.9;
      margin-top: 10px;
      font-family: monospace;
    }
    
    .invoice-body {
      padding: 40px;
    }
    
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-box h3 {
      color: #667eea;
      font-size: 14px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .info-box p {
      color: #374151;
      line-height: 1.8;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background: #f9fafb;
    }
    
    .items-table th {
      padding: 15px;
      text-align: right;
      font-size: 13px;
      color: #6b7280;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .items-table td {
      padding: 15px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      font-size: 14px;
    }
    
    .items-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .product-image {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
    }
    
    .product-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .totals-section {
      margin-right: auto;
      width: 400px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .total-row:last-child {
      border-bottom: none;
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #667eea;
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
    }
    
    .discount-row {
      color: #10b981;
      font-weight: 600;
    }
    
    .notes-section {
      margin-top: 40px;
      padding: 20px;
      background: #fffbeb;
      border-right: 4px solid #f59e0b;
      border-radius: 4px;
    }
    
    .notes-section h4 {
      color: #b45309;
      margin-bottom: 10px;
      font-size: 14px;
    }
    
    .notes-section p {
      color: #92400e;
      line-height: 1.6;
      font-size: 13px;
    }
    
    .invoice-footer {
      background: #f9fafb;
      padding: 30px 40px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 2px solid #e5e7eb;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      left: 20px;
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    
    .print-button:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0,0,0,0.15);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .print-button {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      .info-section {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .totals-section {
        width: 100%;
      }
      
      .invoice-body {
        padding: 20px;
      }
      
      .invoice-header {
        padding: 20px;
      }
      
      .print-button {
        position: static;
        width: 100%;
        margin-bottom: 20px;
      }
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ چاپ فاکتور</button>
  
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      ${settings.showLogo && settings.logoUrl ? `
        <img src="${settings.logoUrl}" alt="لوگو" class="company-logo" />
      ` : `
        <div class="company-logo">🏪</div>
      `}
      <h1>${settings.companyName}</h1>
      <div class="invoice-number">فاکتور شماره: ${invoiceNumber}</div>
      <div style="margin-top: 10px; opacity: 0.9;">تاریخ: ${orderDate}</div>
    </div>
    
    <!-- Body -->
    <div class="invoice-body">
      <!-- Info Section -->
      <div class="info-section">
        <div class="info-box">
          <h3>📍 اطلاعات فروشنده</h3>
          <p><strong>${settings.companyName}</strong></p>
          ${settings.companyAddress ? `<p>آدرس: ${settings.companyAddress}</p>` : ''}
          ${settings.companyPhone ? `<p>تلفن: ${settings.companyPhone}</p>` : ''}
          ${settings.companyEmail ? `<p>ایمیل: ${settings.companyEmail}</p>` : ''}
          ${settings.taxId ? `<p>شناسه ملی: ${settings.taxId}</p>` : ''}
        </div>
        
        <div class="info-box">
          <h3>👤 اطلاعات خریدار</h3>
          <p><strong>${order.userName || (order.contactInfo ? `${order.contactInfo.firstName} ${order.contactInfo.lastName}` : 'کاربر')}</strong></p>
          <p>تلفن: ${order.userPhone || (order.contactInfo ? order.contactInfo.phone : 'نامشخص')}</p>
          <p>ایمیل: ${order.userEmail || (order.contactInfo ? order.contactInfo.email : 'نامشخص')}</p>
          ${order.shippingAddress ? `
            <p>آدرس: ${order.shippingAddress.address}</p>
            ${order.shippingAddress.zipCode ? `<p>کد پستی: ${order.shippingAddress.zipCode}</p>` : ''}
          ` : ''}
        </div>
      </div>
      
      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>ردیف</th>
            <th>شرح کالا/خدمات</th>
            <th>نوع</th>
            <th>تعداد</th>
            <th>قیمت واحد</th>
            <th>مبلغ کل</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>
                <div class="product-name-cell">
                  ${item.image ? `
                    <img src="${item.image}" alt="${item.name}" class="product-image" />
                  ` : `
                    <div class="product-image" style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #9ca3af; font-size: 24px;">
                      ${item.productType === 'DIGITAL' ? '📥' : '📦'}
                    </div>
                  `}
                  <span>${item.name}</span>
                </div>
              </td>
              <td>${item.productType === 'DIGITAL' ? '📥 دیجیتال' : '📦 فیزیکی'}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toLocaleString('fa-IR')} تومان</td>
              <td>${(item.price * item.quantity).toLocaleString('fa-IR')} تومان</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Totals -->
      <div class="totals-section">
        <div class="total-row">
          <span>جمع کل:</span>
          <span>${subtotal.toLocaleString('fa-IR')} تومان</span>
        </div>
        
        ${order.discountAmount > 0 ? `
          <div class="total-row discount-row">
            <span>تخفیف:</span>
            <span>-${order.discountAmount.toLocaleString('fa-IR')} تومان</span>
          </div>
        ` : ''}
        
        ${settings.showTax && taxAmount > 0 ? `
          <div class="total-row">
            <span>مالیات (${settings.taxRate}%):</span>
            <span>${taxAmount.toLocaleString('fa-IR')} تومان</span>
          </div>
        ` : ''}
        
        <div class="total-row">
          <span>مبلغ قابل پرداخت:</span>
          <span>${finalTotal.toLocaleString('fa-IR')} تومان</span>
        </div>
      </div>
      
      <!-- Notes -->
      ${settings.invoiceNotes ? `
        <div class="notes-section">
          <h4>📝 یادداشت‌ها:</h4>
          <p>${settings.invoiceNotes}</p>
        </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <p>${settings.footerText}</p>
      ${settings.companyWebsite ? `<p style="margin-top: 10px;">🌐 ${settings.companyWebsite}</p>` : ''}
    </div>
  </div>
  
  <script>
    // Auto-print functionality
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('print') === 'true') {
      window.onload = () => {
        setTimeout(() => window.print(), 500);
      };
    }
  </script>
</body>
</html>
  `;
}
