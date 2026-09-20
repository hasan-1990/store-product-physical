'use client';

import { useState, useEffect } from 'react';

interface Province {
  _id: string;
  province: string;
  cities: string[];
  enabled: boolean;
}

interface ProvinceSelectProps {
  selectedProvince?: string;
  selectedCity?: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: {
    province?: string;
    city?: string;
  };
}

const ProvinceSelect = ({
  selectedProvince = '',
  selectedCity = '',
  onProvinceChange,
  onCityChange,
  disabled = false,
  className = '',
  placeholder = {}
}: ProvinceSelectProps) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample data for demo (can be removed when API is working)
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
    }
  ];

  // دریافت لیست استان‌ها
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        console.log('Fetching provinces from API...');
        const response = await fetch('/api/provinces');
        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success && data.provinces) {
          console.log('Provinces count:', data.provinces.length);
          const enabledProvinces = data.provinces.filter((p: Province) => p.enabled);
          console.log('Enabled provinces count:', enabledProvinces.length);
          setProvinces(enabledProvinces);
        } else {
          console.log('API failed, using sample data');
          // Use sample data if API fails
          setProvinces(sampleProvinces);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
        // Use sample data if API fails
        setProvinces(sampleProvinces);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // به‌روزرسانی لیست شهرها هنگام تغییر استان
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find(p => p.province === selectedProvince);
      if (province) {
        setCities(province.cities);
        // اگر شهر انتخاب شده در استان جدید وجود نداشته باشد، آن را پاک کن
        if (selectedCity && !province.cities.includes(selectedCity)) {
          onCityChange('');
        }
      } else {
        setCities([]);
        onCityChange('');
      }
    } else {
      setCities([]);
      onCityChange('');
    }
  }, [selectedProvince, provinces, selectedCity, onCityChange]);

  const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onProvinceChange(value);
    onCityChange(''); // پاک کردن شهر انتخاب شده
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onCityChange(event.target.value);
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            استان
          </label>
          <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            شهر
          </label>
          <div className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* انتخاب استان */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          استان <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          disabled={disabled}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder.province || 'انتخاب استان'}</option>
          {provinces.map((province) => (
            <option 
              key={province._id} 
              value={province.province}
              className="bg-gray-800 text-white"
            >
              {province.province}
            </option>
          ))}
        </select>
      </div>

      {/* انتخاب شهر */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          شهر <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={disabled || !selectedProvince || cities.length === 0}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder.city || 'انتخاب شهر'}</option>
          {cities.map((city, index) => (
            <option 
              key={index} 
              value={city}
              className="bg-gray-800 text-white"
            >
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProvinceSelect;