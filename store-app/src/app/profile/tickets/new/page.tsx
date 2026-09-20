'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateUserContent } from '@/utils';

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{ _id: string; ticketNumber: string } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    { value: 'technical', label: '🔧 مشکل فنی' },
    { value: 'sales', label: '💰 سوال فروش' },
    { value: 'payment', label: '💳 مشکل پرداخت' },
    { value: 'shipping', label: '📦 مشکل ارسال' },
    { value: 'other', label: '📋 سایر موارد' }
  ];

  const priorities = [
    { value: 'low', label: '🟢 کم', description: 'سوال عمومی' },
    { value: 'medium', label: '🟡 متوسط', description: 'نیاز به پیگیری' },
    { value: 'high', label: '🟠 زیاد', description: 'مشکل مهم' },
    { value: 'urgent', label: '🔴 فوری', description: 'نیاز به رسیدگی سریع' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // اعتبارسنجی عنوان با content filter
    const subjectResult = validateUserContent(formData.subject, {
      minLength: 10,
      maxLength: 200,
      allowLinks: false,
      allowEmails: false
    });
    if (!subjectResult.isValid) {
      newErrors.subject = subjectResult.error || 'عنوان تیکت نامعتبر است';
    }

    // اعتبارسنجی متن با content filter
    const messageResult = validateUserContent(formData.message, {
      minLength: 20,
      maxLength: 2000,
      allowLinks: false,
      allowEmails: true
    });
    if (!messageResult.isValid) {
      newErrors.message = messageResult.error || 'متن پیام نامعتبر است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setCreatedTicket({
          _id: data.ticket._id,
          ticketNumber: data.ticket.ticketNumber
        });
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.error || 'خطا در ارسال تیکت');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('خطا در ارسال تیکت:', error);
      setErrorMessage('خطا در برقراری ارتباط با سرور');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/profile/tickets"
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              ← بازگشت
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-purple-700 mb-2">ارسال تیکت جدید</h1>
          <p className="text-gray-600">
            لطفاً مشکل یا سوال خود را با جزئیات کامل شرح دهید تا تیم پشتیبانی بتواند در کوتاه‌ترین زمان به شما پاسخ دهد.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              عنوان تیکت <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-purple-400`}
              placeholder="مثال: مشکل در پرداخت سفارش"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">⚠️ {errors.subject}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              دسته‌بندی <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    formData.category === cat.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              اولویت <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {priorities.map((pri) => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: pri.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-right ${
                    formData.priority === pri.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium mb-1">{pri.label}</div>
                  <div className="text-sm text-gray-500">{pri.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              توضیحات کامل <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (errors.message) setErrors({ ...errors, message: '' });
              }}
              rows={8}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-purple-400`}
              placeholder="لطفاً مشکل یا سوال خود را با جزئیات کامل توضیح دهید..."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">⚠️ {errors.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              تعداد کاراکترها: {formData.message.length}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">نکات مهم:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• هرچه توضیحات دقیق‌تری ارائه دهید، پاسخ سریع‌تری دریافت می‌کنید</li>
                  <li>• در صورت وجود، شماره سفارش یا کد پیگیری را ذکر کنید</li>
                  <li>• تیم پشتیبانی معمولاً ظرف 24 ساعت پاسخ می‌دهد</li>
                  <li>• می‌توانید از طریق صفحه تیکت‌ها، پیام‌های جدید دریافت کنید</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-bold transition-all duration-300 ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  در حال ارسال...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>📤</span>
                  ارسال تیکت
                </span>
              )}
            </button>
            <Link
              href="/profile/tickets"
              className="px-6 py-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              انصراف
            </Link>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-green-500/30 animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">تیکت ایجاد شد! 🎉</h3>
              <p className="text-green-100 text-sm">تیکت شما با موفقیت ثبت شد</p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">شماره تیکت:</span>
                    <span className="font-mono font-bold text-purple-600 text-lg">{createdTicket.ticketNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">موضوع:</span>
                    <span className="text-sm text-gray-800 font-medium text-right max-w-[200px]">{formData.subject}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-2">چه اتفاقی می‌افتد؟</p>
                      <ul className="space-y-1">
                        <li>✓ تیکت شما در صف پاسخگویی قرار گرفت</li>
                        <li>✓ تیم پشتیبانی ظرف 24 ساعت پاسخ می‌دهد</li>
                        <li>✓ از پاسخ جدید با ایمیل مطلع می‌شوید</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/profile/tickets/${createdTicket._id}`)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    مشاهده تیکت
                  </span>
                </button>
                <button
                  onClick={() => router.push('/profile/tickets')}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                >
                  بازگشت به لیست تیکت‌ها
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500/30 animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-6 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">خطا در ارسال</h3>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-center">{errorMessage}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">راهکارهای پیشنهادی:</p>
                      <ul className="space-y-1">
                        <li>• اتصال اینترنت خود را بررسی کنید</li>
                        <li>• مطمئن شوید تمام فیلدها پر شده‌اند</li>
                        <li>• صفحه را رفرش کرده و دوباره امتحان کنید</li>
                        <li>• در صورت تکرار مشکل با پشتیبانی تماس بگیرید</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold transition-all"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
