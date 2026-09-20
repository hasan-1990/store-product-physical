'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  validateFirstName, 
  validateMobileWithMessage, 
  validateAddress, 
  validateIranianPostalCode 
} from '@/utils';

interface Address {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: string;
}

interface Province {
  _id: string;
  province: string;
  cities: string[];
  enabled: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    isDefault: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // بررسی نام
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    } else {
      const nameResult = validateFirstName(formData.fullName);
      if (!nameResult.isValid) {
        newErrors.fullName = nameResult.error || 'نام نامعتبر است';
      }
    }

    // بررسی موبایل
    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تماس الزامی است';
    } else {
      const phoneResult = validateMobileWithMessage(formData.phone);
      if (!phoneResult.isValid) {
        newErrors.phone = phoneResult.message;
      }
    }

    // بررسی استان و شهر
    if (!formData.province.trim()) {
      newErrors.province = 'استان الزامی است';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'شهر الزامی است';
    }

    // بررسی آدرس
    if (!formData.address.trim()) {
      newErrors.address = 'آدرس الزامی است';
    } else {
      const addrResult = validateAddress(formData.address);
      if (!addrResult.isValid) {
        newErrors.address = addrResult.error || 'آدرس نامعتبر است';
      }
    }

    // بررسی کد پستی
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'کد پستی الزامی است';
    } else {
      const zipResult = validateIranianPostalCode(formData.postalCode);
      if (!zipResult.isValid) {
        newErrors.postalCode = zipResult.error || 'کد پستی نامعتبر است';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAddresses();
    fetchProvinces();
  }, [router]);

  const fetchProvinces = async () => {
    try {
      const response = await fetch('/api/provinces');
      const data = await response.json();
      
      if (data.success && data.provinces) {
        setProvinces(data.provinces);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const handleProvinceChange = (provinceName: string) => {
    const province = provinces.find(p => p.province === provinceName);
    setSelectedProvince(province || null);
    setFormData({...formData, province: provinceName, city: ''});
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ اعتبارسنجی قبل از ارسال
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          fullName: '',
          phone: '',
          province: '',
          city: '',
          address: '',
          postalCode: '',
          isDefault: false
        });
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/addresses/${id}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
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
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
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
                <h1 className="text-3xl font-bold text-gray-900">آدرس‌های من</h1>
                <p className="text-gray-600 mt-2">مدیریت آدرس‌های ارسال سفارشات</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              افزودن آدرس جدید
            </button>
          </div>
        </div>

        {/* Add Address Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">افزودن آدرس جدید</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره تماس
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    استان
                  </label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="">انتخاب استان</option>
                    {provinces
                      .filter(p => p.enabled)
                      .map((province) => (
                        <option key={province._id} value={province.province}>
                          {province.province}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شهر
                  </label>
                  <select
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    disabled={!selectedProvince}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">انتخاب شهر</option>
                    {selectedProvince?.cities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  آدرس کامل
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد پستی (10 رقم بدون خط تیره)
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{10}"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                  به عنوان آدرس پیش‌فرض تنظیم شود
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:shadow-lg transition-all"
                >
                  ذخیره آدرس
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">هیچ آدرسی ثبت نشده</h3>
            <p className="text-gray-600">برای ثبت اولین آدرس خود کلیک کنید</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div key={address._id} className="bg-white rounded-2xl shadow-xl p-6 relative">
                {address.isDefault && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    پیش‌فرض
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{address.fullName}</h3>
                  <p className="text-gray-600 text-sm mt-1">{address.phone}</p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-gray-700">
                    <span className="font-medium">استان:</span> {address.province}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">شهر:</span> {address.city}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">آدرس:</span> {address.address}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">کد پستی:</span> {address.postalCode}
                  </p>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                    >
                      تنظیم به عنوان پیش‌فرض
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
