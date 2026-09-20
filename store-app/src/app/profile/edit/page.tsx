'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationalCode: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching user data with token:', token ? 'exists' : 'missing');
      
      // اگر token نیست، از localStorage بخوان
      if (!token) {
        console.log('⚠️ No token, trying localStorage user data');
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            nationalCode: userData.nationalCode || ''
          });
        }
        setLoading(false);
        return;
      }
      
      console.log('📡 Sending request to /api/user/profile...');
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.success && data.user) {
        console.log('✅ Setting form data:', data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          nationalCode: data.user.nationalCode || ''
        });
      } else {
        console.error('❌ Error in response:', data.error || 'Unknown error');
        setMessage({ type: 'error', text: data.error || 'خطا در دریافت اطلاعات' });
        
        // Fallback به localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          console.log('📦 Using fallback from localStorage');
          const userData = JSON.parse(savedUser);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            nationalCode: userData.nationalCode || ''
          });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
      
      // Fallback به localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        console.log('📦 Using fallback from localStorage after error');
        const userData = JSON.parse(savedUser);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          nationalCode: userData.nationalCode || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'اطلاعات با موفقیت به‌روزرسانی شد' });
        
        // Update localStorage user data
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = formData.name;
        user.email = formData.email;
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'خطا در به‌روزرسانی اطلاعات' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ویرایش پروفایل</h1>
              <p className="text-gray-600 mt-2">ویرایش اطلاعات شخصی حساب کاربری</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="نام کامل خود را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                placeholder="example@email.com"
                disabled
              />
              <p className="text-sm text-gray-500 mt-2">
                برای تغییر ایمیل با پشتیبانی تماس بگیرید
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره موبایل
              </label>
              <input
                type="tel"
                required
                pattern="09[0-9]{9}"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="09123456789"
              />
              <p className="text-sm text-gray-500 mt-2">
                شماره موبایل باید با 09 شروع شود و 11 رقم باشد
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کد ملی
              </label>
              <input
                type="text"
                pattern="[0-9]{10}"
                value={formData.nationalCode}
                onChange={(e) => setFormData({...formData, nationalCode: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0123456789"
              />
              <p className="text-sm text-gray-500 mt-2">
                کد ملی 10 رقمی خود را بدون خط تیره وارد کنید
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ذخیره...
                  </span>
                ) : (
                  'ذخیره تغییرات'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">نکات مهم</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• اطلاعات خود را دقیق و صحیح وارد کنید</li>
                <li>• شماره موبایل برای ارسال پیامک‌های اطلاع‌رسانی استفاده می‌شود</li>
                <li>• کد ملی برای صدور فاکتور رسمی الزامی است</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
