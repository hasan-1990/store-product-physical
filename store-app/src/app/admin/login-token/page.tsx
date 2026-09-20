'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTokenLogin() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const setAdminToken = () => {
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQwMDVlMzAwOTY0ZjM3MzM1NWM4YmIiLCJyb2xlIjoiQURNSU4iLCJlbWFpbCI6Imhhc2FubWFuc291cmkxOTkwQGdtYWlsLmNvbSIsImlhdCI6MTc1OTM4NTk0NSwiZXhwIjoxNzYxOTc3OTQ1fQ.oGwrQncZ3dNzcW4sY4JYVnECwjyBiAJc_ygn1hlZjVU';
    
    localStorage.setItem('token', adminToken);
    setMessage('✅ Admin token تنظیم شد! در حال هدایت به پنل ادمین...');
    
    setTimeout(() => {
      router.push('/admin/orders');
    }, 1500);
  };

  const checkCurrentToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('❌ هیچ token فعالی وجود ندارد');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setMessage(`
        📊 Token فعلی:
        - User ID: ${decoded.userId}
        - Role: ${decoded.role}
        - Email: ${decoded.email}
        - Expires: ${new Date(decoded.exp * 1000).toLocaleString('fa-IR')}
      `);
    } catch (error) {
      setMessage('❌ Token نامعتبر است');
    }
  };

  useEffect(() => {
    checkCurrentToken();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">تنظیم Admin Token</h1>
          <p className="text-gray-600">برای دسترسی به پنل مدیریت، token ادمین را تنظیم کنید</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : message.includes('📊')
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <pre className="whitespace-pre-wrap text-sm font-mono">{message}</pre>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={setAdminToken}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            🔑 تنظیم Admin Token و ورود به پنل
          </button>

          <button
            onClick={checkCurrentToken}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            🔍 بررسی Token فعلی
          </button>

          <button
            onClick={() => router.push('/admin/orders')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            ➡️ رفتن به پنل ادمین
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ توجه:</strong> این token اعتبار 30 روزه دارد و برای کاربر با ایمیل hasanmansouri1990@gmail.com صادر شده است.
          </p>
        </div>
      </div>
    </div>
  );
}
