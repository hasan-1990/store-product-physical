'use client';

import { useState, useEffect } from 'react';

interface Province {
  _id: string;
  province: string;
  cities: string[];
  enabled: boolean;
}

interface ShippingAddressProps {
  onAddressChange: (address: {
    province: string;
    city: string;
    address: string;
    postalCode: string;
  }) => void;
  initialAddress?: {
    province?: string;
    city?: string;
    address?: string;
    postalCode?: string;
  };
}

const ShippingAddress = ({ onAddressChange, initialAddress = {} }: ShippingAddressProps) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    province: initialAddress.province || '',
    city: initialAddress.city || '',
    address: initialAddress.address || '',
    postalCode: initialAddress.postalCode || ''
  });

  // Sample data for demo
  const sampleProvinces: Province[] = [
    {
      _id: '1',
      province: 'تهران',
      cities: ['تهران', 'شهرری', 'ورامین', 'پاکدشت', 'دماوند'],
      enabled: true
    },
    {
      _id: '2',
      province: 'اصفهان', 
      cities: ['اصفهان', 'کاشان', 'نجف آباد', 'خمینی شهر', 'شاهین شهر'],
      enabled: true
    },
    {
      _id: '3',
      province: 'فارس',
      cities: ['شیراز', 'مرودشت', 'کازرون', 'جهرم', 'فسا'],
      enabled: true
    },
    {
      _id: '4',
      province: 'خراسان رضوی',
      cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان'],
      enabled: true
    }
  ];

  // دریافت لیست استان‌ها
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        console.log('ShippingAddress: Fetching provinces from API...');
        const response = await fetch('/api/provinces');
        console.log('ShippingAddress: API Response status:', response.status);
        const data = await response.json();
        console.log('ShippingAddress: API Response data:', data);
        
        if (data.success && data.provinces) {
          console.log('ShippingAddress: Provinces count:', data.provinces.length);
          const enabledProvinces = data.provinces.filter((p: Province) => p.enabled);
          console.log('ShippingAddress: Enabled provinces count:', enabledProvinces.length);
          setProvinces(enabledProvinces);
        } else {
          console.log('ShippingAddress: API failed, using sample data');
          setProvinces(sampleProvinces);
        }
      } catch (error) {
        console.error('ShippingAddress: Error fetching provinces:', error);
        setProvinces(sampleProvinces);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // به‌روزرسانی شهرها هنگام تغییر استان
  useEffect(() => {
    if (formData.province) {
      const province = provinces.find(p => p.province === formData.province);
      if (province) {
        setCities(province.cities);
        // اگر شهر انتخاب شده در استان جدید وجود نداشته باشد، آن را پاک کن
        if (formData.city && !province.cities.includes(formData.city)) {
          const newFormData = { ...formData, city: '' };
          setFormData(newFormData);
          onAddressChange(newFormData);
        }
      }
    } else {
      setCities([]);
    }
  }, [formData.province, provinces]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onAddressChange(newFormData);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">آدرس تحویل</h3>
      
      {/* انتخاب استان و شهر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            استان <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.province}
            onChange={(e) => handleInputChange('province', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">انتخاب استان</option>
            {provinces.map((province) => (
              <option key={province._id} value={province.province}>
                {province.province}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شهر <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={!formData.province || cities.length === 0}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">انتخاب شهر</option>
            {cities.map((city, index) => (
              <option key={index} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* آدرس کامل */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          آدرس کامل <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="آدرس کامل خود را وارد کنید..."
          required
        />
      </div>

      {/* کد پستی */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          کد پستی <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.postalCode}
          onChange={(e) => handleInputChange('postalCode', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1234567890"
          maxLength={10}
          pattern="[0-9]{10}"
          required
        />
        <p className="text-xs text-gray-500 mt-1">کد پستی باید 10 رقم باشد</p>
      </div>

      {/* نمایش خلاصه آدرس */}
      {formData.province && formData.city && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>آدرس انتخاب شده:</strong> {formData.province}، {formData.city}
            {formData.address && (
              <>
                <br />
                <strong>آدرس:</strong> {formData.address}
              </>
            )}
            {formData.postalCode && (
              <>
                <br />
                <strong>کد پستی:</strong> {formData.postalCode}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ShippingAddress;