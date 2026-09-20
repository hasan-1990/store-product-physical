'use client';

import { useRef } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  orderNumber?: string;
  date: Date | string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  settings: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite: string;
    taxId: string;
    logoUrl: string;
    showLogo: boolean;
    showTax: boolean;
    invoiceNotes: string;
    footerText: string;
  };
}

interface InvoiceGeneratorProps {
  data: InvoiceData;
  onDownload?: () => void;
}

export default function InvoiceGenerator({ data, onDownload }: InvoiceGeneratorProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'در انتظار پرداخت',
      paid: 'پرداخت شده',
      processing: 'در حال پردازش',
      shipped: 'ارسال شده',
      delivered: 'تحویل داده شده',
      cancelled: 'لغو شده'
    };
    return statusMap[status] || status;
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${data.invoiceNumber}.pdf`);

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* دکمه‌های عملیات */}
      <div className="mb-4 flex gap-2 print:hidden">
        <button
          onClick={handleDownloadPDF}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          دانلود PDF
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          چاپ
        </button>
      </div>

      {/* فاکتور */}
      <div ref={invoiceRef} className="bg-white p-8 shadow-lg" dir="rtl">
        {/* هدر */}
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              {data.settings.showLogo && data.settings.logoUrl && (
                <div className="mb-4 relative w-32 h-16">
                  <Image
                    src={data.settings.logoUrl}
                    alt="لوگو"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-800">{data.settings.companyName}</h1>
              {data.settings.companyAddress && (
                <p className="text-sm text-gray-600 mt-1">{data.settings.companyAddress}</p>
              )}
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                {data.settings.companyPhone && <p>تلفن: {data.settings.companyPhone}</p>}
                {data.settings.companyEmail && <p>ایمیل: {data.settings.companyEmail}</p>}
                {data.settings.companyWebsite && <p>وبسایت: {data.settings.companyWebsite}</p>}
                {data.settings.taxId && <p>شناسه مالیاتی: {data.settings.taxId}</p>}
              </div>
            </div>

            <div className="text-left">
              <h2 className="text-3xl font-bold text-blue-600 mb-2">فاکتور</h2>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">شماره فاکتور:</span> {data.invoiceNumber}</p>
                <p><span className="font-semibold">تاریخ:</span> {formatDate(data.date)}</p>
                <p><span className="font-semibold">وضعیت:</span> <span className="text-green-600">{getStatusLabel(data.status)}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* اطلاعات مشتری */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">اطلاعات مشتری</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">نام:</p>
              <p>{data.customer.name}</p>
            </div>
            {data.customer.email && (
              <div>
                <p className="font-semibold">ایمیل:</p>
                <p>{data.customer.email}</p>
              </div>
            )}
            {data.customer.phone && (
              <div>
                <p className="font-semibold">تلفن:</p>
                <p>{data.customer.phone}</p>
              </div>
            )}
            {data.customer.address && (
              <div className="col-span-2">
                <p className="font-semibold">آدرس:</p>
                <p>{data.customer.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* جدول محصولات */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="py-3 px-4 text-right">ردیف</th>
                <th className="py-3 px-4 text-right">نام محصول</th>
                <th className="py-3 px-4 text-center">تعداد</th>
                <th className="py-3 px-4 text-left">قیمت واحد</th>
                <th className="py-3 px-4 text-left">جمع</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={item.productId} className="border-b border-gray-200">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-left">{formatPrice(item.price)} تومان</td>
                  <td className="py-3 px-4 text-left font-semibold">{formatPrice(item.total)} تومان</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* جمع کل */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span>جمع جزء:</span>
              <span>{formatPrice(data.subtotal)} تومان</span>
            </div>

            {data.discount > 0 && (
              <div className="flex justify-between py-2 border-b text-red-600">
                <span>تخفیف:</span>
                <span>-{formatPrice(data.discount)} تومان</span>
              </div>
            )}

            {data.settings.showTax && data.taxAmount > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span>مالیات ({data.taxRate}%):</span>
                <span>{formatPrice(data.taxAmount)} تومان</span>
              </div>
            )}

            {data.shippingCost > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span>هزینه ارسال:</span>
                <span>{formatPrice(data.shippingCost)} تومان</span>
              </div>
            )}

            <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold">
              <span>جمع کل:</span>
              <span className="text-blue-600">{formatPrice(data.total)} تومان</span>
            </div>

            <div className="text-xs text-gray-600 pt-2">
              <span>روش پرداخت: {data.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* یادداشت */}
        {data.settings.invoiceNotes && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">{data.settings.invoiceNotes}</p>
          </div>
        )}

        {/* پاورقی */}
        {data.settings.footerText && (
          <div className="border-t pt-4 mt-8">
            <p className="text-xs text-center text-gray-500">{data.settings.footerText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
