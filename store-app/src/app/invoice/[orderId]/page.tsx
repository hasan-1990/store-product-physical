'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import Link from 'next/link';

export default function InvoicePage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [orderId]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${orderId}`);
      const data = await response.json();

      if (data.success) {
        setInvoiceData(data.data);
      } else {
        setError(data.error || 'خطا در دریافت فاکتور');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('خطا در دریافت فاکتور');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری فاکتور...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/user"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            بازگشت به پنل کاربری
          </Link>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center print:hidden">
          <h1 className="text-2xl font-bold text-gray-800">فاکتور خرید</h1>
          <Link
            href="/user"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            بازگشت به پنل کاربری
          </Link>
        </div>

        <InvoiceGenerator data={invoiceData} />

        {/* پیام موفقیت */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg print:hidden">
          <div className="flex items-start gap-3">
            <div className="text-green-500 text-2xl">✓</div>
            <div>
              <h3 className="font-semibold text-green-800 mb-1">پرداخت موفق</h3>
              <p className="text-sm text-green-700">
                سفارش شما با موفقیت ثبت شد. می‌توانید فاکتور خود را دانلود کرده یا چاپ نمایید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
