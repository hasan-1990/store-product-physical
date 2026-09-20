'use client';

import { useState, useEffect } from 'react';

interface User {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
}

interface Product {
  _id: string;
  name: string;
  productType?: 'PHYSICAL' | 'DIGITAL';
  isDigital?: boolean;
}

interface License {
  _id: string;
  licenseKey: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  domain: string;
  licenseType: string;
  status: string;
  activationDate: string;
  expirationDate?: string;
  activationCount: number;
  maxActivations: number;
  createdAt: string;
}

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/admin/licenses');
      const result = await response.json();
      if (result.success) {
        setLicenses(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('خطا در دریافت لایسنس‌ها:', error);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setMessageModal({ isOpen: true, type, title, message });
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm('آیا از حذف این لایسنس اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/admin/licenses/manage?id=${licenseId}`, {
        method: 'DELETE',
        credentials: 'include' // برای ارسال session cookie
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage('success', 'موفق', 'لایسنس با موفقیت حذف شد');
        fetchLicenses();
      } else {
        showMessage('error', 'خطا', result.error || 'خطا در حذف لایسنس');
      }
    } catch (error) {
      showMessage('error', 'خطا', 'خطا در حذف لایسنس');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">🔐 مدیریت لایسنس‌ها</h1>
                <p className="text-purple-200">تولید و مدیریت کلیدهای لایسنس محصولات دیجیتال</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-white">
                  {Array.isArray(licenses) ? licenses.filter(l => l.status === 'active').length : 0}
                </div>
                <div className="text-sm text-green-400">لایسنس فعال</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-white">
                  {Array.isArray(licenses) ? licenses.filter(l => l.status === 'expired').length : 0}
                </div>
                <div className="text-sm text-red-400">منقضی شده</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-white">{Array.isArray(licenses) ? licenses.length : 0}</div>
                <div className="text-sm text-blue-400">کل لایسنس‌ها</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <div className="text-2xl font-bold text-white">
                  {Array.isArray(licenses) ? licenses.filter(l => l.licenseType === 'single').length : 0}
                </div>
                <div className="text-sm text-purple-400">تک دامنه</div>
              </div>
            </div>
          </div>
        </div>

        {/* Licenses Table */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">لیست لایسنس‌ها</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-right">
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">کلید لایسنس</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">محصول</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">کاربر</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">دامنه</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">نوع</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">وضعیت</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">فعال‌سازی</th>
                  <th className="px-6 py-4 text-sm font-semibold text-purple-200 whitespace-nowrap">اقدامات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Array.isArray(licenses) && licenses.length > 0 ? (
                  licenses.map((license) => (
                    <tr key={license._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-gray-800/50 rounded-lg text-xs text-purple-300 font-mono whitespace-nowrap">
                            {license.licenseKey.substring(0, 20)}...
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white whitespace-nowrap">{license.productName}</td>
                      <td className="px-6 py-4 text-sm text-white whitespace-nowrap">{license.userName}</td>
                      <td className="px-6 py-4 text-sm text-purple-300 whitespace-nowrap">{license.domain}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          license.licenseType === 'single' 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {license.licenseType === 'single' ? 'تک دامنه' : 'نامحدود'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          (license.status === 'active' || !license.status)
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {(license.status === 'active' || !license.status) ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                        {license.activationCount} / {license.maxActivations === -1 ? '∞' : license.maxActivations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteLicense(license._id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      هیچ لایسنسی یافت نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message Modal */}
        {messageModal.isOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
              <div className={`p-6 ${
                messageModal.type === 'success' ? 'bg-green-50' :
                messageModal.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <div className="flex items-center gap-3">
                  {messageModal.type === 'success' && (
                    <div className="p-2 bg-green-500 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {messageModal.type === 'error' && (
                    <div className="p-2 bg-red-500 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{messageModal.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{messageModal.message}</p>
              </div>
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setMessageModal({ ...messageModal, isOpen: false })}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  متوجه شدم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
