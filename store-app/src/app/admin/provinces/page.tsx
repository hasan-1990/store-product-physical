'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { seedProvinces } from '@/utils/seedProvinces';

interface Province {
  _id: string;
  province: string;
  cities: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProvincesManagementPage = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [showCitiesModal, setShowCitiesModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // دریافت لیست استان‌ها
  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/provinces');
      const data = await response.json();
      
      if (data.success) {
        setProvinces(data.provinces);
      } else {
        toast.error('خطا در دریافت لیست استان‌ها');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // بارگذاری داده‌های اولیه
  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const result = await seedProvinces();
      
      if (result.success) {
        toast.success(`${result.insertedCount} استان با موفقیت بارگذاری شد`);
        await fetchProvinces();
      } else {
        toast.error(result.error || 'خطا در بارگذاری داده‌ها');
      }
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
    } finally {
      setSeeding(false);
    }
  };

  // فیلتر استان‌ها بر اساس جستجو
  const filteredProvinces = provinces.filter(province =>
    province.province.includes(searchTerm) ||
    province.cities.some(city => city.includes(searchTerm))
  );

  // نمایش شهرهای استان
  const showCities = (province: Province) => {
    setSelectedProvince(province);
    setShowCitiesModal(true);
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-white text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت استان‌ها و شهرها</h1>
            <p className="text-gray-300">مدیریت لیست استان‌ها و شهرهای کشور برای سیستم حمل و نقل</p>
          </div>
          
          <div className="flex items-center gap-4">
            {provinces.length === 0 && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    در حال بارگذاری...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    بارگذاری داده‌های اولیه
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={fetchProvinces}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              بروزرسانی
            </button>
          </div>
        </div>
        
        {/* جستجو */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی استان یا شهر..."
              className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute right-3 top-3 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">کل استان‌ها</p>
              <p className="text-2xl font-bold text-white">{provinces.length}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">کل شهرها</p>
              <p className="text-2xl font-bold text-white">
                {provinces.reduce((total, province) => total + province.cities.length, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">میانگین شهر در استان</p>
              <p className="text-2xl font-bold text-white">
                {provinces.length > 0 ? Math.round(provinces.reduce((total, province) => total + province.cities.length, 0) / provinces.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* لیست استان‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProvinces.map((province) => (
          <div
            key={province._id}
            className="p-6 bg-white/5 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{province.province}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                province.enabled
                  ? 'bg-green-500/30 text-green-200 border border-green-400/50'
                  : 'bg-red-500/30 text-red-200 border border-red-400/50'
              }`}>
                {province.enabled ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">تعداد شهرها: {province.cities.length}</p>
              <div className="flex flex-wrap gap-1">
                {province.cities.slice(0, 3).map((city, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                  >
                    {city}
                  </span>
                ))}
                {province.cities.length > 3 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">
                    +{province.cities.length - 3} شهر دیگر
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => showCities(province)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              مشاهده همه شهرها
            </button>
          </div>
        ))}
      </div>

      {/* نمایش خالی بودن لیست */}
      {filteredProvinces.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-400 text-lg">
            {provinces.length === 0 ? 'هیچ استانی ثبت نشده است' : 'نتیجه‌ای یافت نشد'}
          </p>
          {provinces.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">
              برای شروع، داده‌های اولیه را بارگذاری کنید
            </p>
          )}
        </div>
      )}

      {/* مودال نمایش شهرها */}
      {showCitiesModal && selectedProvince && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                شهرهای استان {selectedProvince.province}
              </h3>
              <button
                onClick={() => setShowCitiesModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300">
                تعداد کل: <span className="text-white font-bold">{selectedProvince.cities.length}</span> شهر
              </p>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedProvince.cities.map((city, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 text-center"
                  >
                    <span className="text-white text-sm">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvincesManagementPage;