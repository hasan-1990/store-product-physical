'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import type { License } from '@/types';

interface LicenseWithProduct extends License {
  product?: {
    id: string;
    name: string;
    slug?: string;
    image?: string;
    downloadUrl?: string;
  } | null;
}

export default function LicensesPage() {
  const { data: session } = useSession();
  const [licenses, setLicenses] = useState<LicenseWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingDomain, setActivatingDomain] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session?.user?.id) {
      fetchLicenses();
    }
  }, [session]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/licenses/list?userId=${session?.user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setLicenses(data.licenses);
      } else {
        toast.error('خطا در دریافت لایسنس‌ها');
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateLicense = async (licenseKey: string, productId: string) => {
    const domain = domainInput[licenseKey];
    
    if (!domain || domain.trim() === '') {
      toast.error('لطفاً دامنه وب‌سایت خود را وارد کنید');
      return;
    }

    try {
      setActivatingDomain(licenseKey);
      
      const response = await fetch('/api/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          domain: domain.trim(),
          productId,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        toast.success('لایسنس با موفقیت فعال شد!');
        fetchLicenses(); // رفرش لیست
      } else {
        toast.error(data.message || 'خطا در فعال‌سازی لایسنس');
      }
    } catch (error) {
      console.error('Error activating license:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setActivatingDomain(null);
    }
  };

  const handleDeactivateLicense = async (licenseKey: string) => {
    if (!confirm('آیا از غیرفعال‌سازی این لایسنس مطمئن هستید؟')) {
      return;
    }

    try {
      const response = await fetch('/api/licenses/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          reason: 'غیرفعال شده توسط کاربر',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('لایسنس غیرفعال شد');
        fetchLicenses();
      } else {
        toast.error('خطا در غیرفعال‌سازی لایسنس');
      }
    } catch (error) {
      console.error('Error deactivating license:', error);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('کپی شد!');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      revoked: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      active: 'فعال',
      inactive: 'غیرفعال',
      suspended: 'تعلیق شده',
      expired: 'منقضی شده',
      revoked: 'لغو شده',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">مدیریت لایسنس‌ها</h1>

      {licenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">شما هنوز هیچ محصول دیجیتالی خریداری نکرده‌اید.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {licenses.map((license) => (
            <div key={license._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {/* هدر */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {license.product?.image && (
                      <img
                        src={license.product.image}
                        alt={license.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{license.productName}</h3>
                      <p className="text-sm text-gray-500">
                        تاریخ خرید: {new Date(license.createdAt).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(license.status)}
                </div>

                {/* کلید لایسنس */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    کلید لایسنس
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={license.licenseKey}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(license.licenseKey)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      کپی
                    </button>
                  </div>
                </div>

                {/* دامنه */}
                {license.isActivated ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      دامنه فعال شده
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={license.domain}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      {license.status === 'active' && (
                        <button
                          onClick={() => handleDeactivateLicense(license.licenseKey)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          غیرفعال‌سازی
                        </button>
                      )}
                    </div>
                    {license.activatedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        فعال شده در: {new Date(license.activatedAt).toLocaleString('fa-IR')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      دامنه وب‌سایت خود را وارد کنید
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="example.com"
                        value={domainInput[license.licenseKey] || ''}
                        onChange={(e) =>
                          setDomainInput({
                            ...domainInput,
                            [license.licenseKey]: e.target.value,
                          })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleActivateLicense(license.licenseKey, license.productId)}
                        disabled={activatingDomain === license.licenseKey}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {activatingDomain === license.licenseKey ? 'در حال فعال‌سازی...' : 'فعال‌سازی'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      مثال: yoursite.com یا www.yoursite.com
                    </p>
                  </div>
                )}

                {/* دکمه دانلود */}
                {license.product?.downloadUrl && license.isActivated && license.status === 'active' && (
                  <div className="mt-4">
                    <a
                      href={license.product.downloadUrl}
                      download
                      className="inline-block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      دانلود فایل
                    </a>
                  </div>
                )}

                {/* اطلاعات اضافی */}
                {license.expiresAt && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      تاریخ انقضا: {new Date(license.expiresAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
