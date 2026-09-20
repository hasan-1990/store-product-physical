'use client';

import { useState, useEffect, Suspense } from 'react';
import ProvinceSelect from '@/components/ProvinceSelect';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  freeThreshold: number;
  estimatedDays: string;
  active: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  cities: string[];
  provinces: string[];
  multiplier: number;
  pricePerKg: number;
}

const ShippingPageContent = () => {
  const [activeTab, setActiveTab] = useState('zones');
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  
  // Settings state
  const [packagingCost, setPackagingCost] = useState(5000);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [smsNotification, setSmsNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    {
      id: '1',
      name: 'ارسال عادی',
      description: 'ارسال با پست معمولی',
      basePrice: 25000,
      freeThreshold: 500000,
      estimatedDays: '3-5 روز',
      active: true
    },
    {
      id: '2',
      name: 'ارسال سریع',
      description: 'ارسال با پیک موتوری',
      basePrice: 45000,
      freeThreshold: 1000000,
      estimatedDays: '1-2 روز',
      active: true
    },
    {
      id: '3',
      name: 'ارسال فوری',
      description: 'ارسال در همان روز',
      basePrice: 85000,
      freeThreshold: 2000000,
      estimatedDays: 'همان روز',
      active: false
    }
  ]);

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await fetch('/api/admin/shipping-zones');
        const result = await response.json();
        if (result.success) {
          const zones = result.data.map((z: any) => ({
            id: z._id,
            name: z.name,
            cities: z.cities,
            provinces: z.provinces,
            multiplier: z.multiplier,
            pricePerKg: z.pricePerKg || 0
          }));
          setShippingZones(zones);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    };
    fetchZones();
  }, []);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/shipping-settings');
        const result = await response.json();
        if (result.success && result.data) {
          setPackagingCost(result.data.packagingCost || 5000);
          setTrackingEnabled(result.data.trackingEnabled !== undefined ? result.data.trackingEnabled : true);
          setSmsNotification(result.data.smsNotification !== undefined ? result.data.smsNotification : true);
          setEmailNotification(result.data.emailNotification !== undefined ? result.data.emailNotification : true);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const openMethodModal = (method?: ShippingMethod) => {
    setEditingMethod(method || {
      id: '',
      name: '',
      description: '',
      basePrice: 0,
      freeThreshold: 0,
      estimatedDays: '',
      active: true
    });
    setShowMethodModal(true);
  };

  const openZoneModal = (zone?: ShippingZone) => {
    setEditingZone(zone || {
      id: '',
      name: '',
      cities: [],
      provinces: [],
      multiplier: 1,
      pricePerKg: 0
    });
    setShowZoneModal(true);
  };

  const saveMethod = () => {
    if (!editingMethod) return;

    if (editingMethod.id) {
      setShippingMethods(shippingMethods.map(m => m.id === editingMethod.id ? editingMethod : m));
    } else {
      const newMethod = { ...editingMethod, id: Date.now().toString() };
      setShippingMethods([...shippingMethods, newMethod]);
    }
    setShowMethodModal(false);
    setEditingMethod(null);
  };

  const saveZone = async () => {
    if (!editingZone) return;

    try {
      const method = editingZone.id ? 'PUT' : 'POST';
      // Remove ID for POST, keep it for PUT
      const body = editingZone.id ? editingZone : { 
        name: editingZone.name,
        cities: editingZone.cities,
        provinces: editingZone.provinces,
        multiplier: editingZone.multiplier,
        pricePerKg: editingZone.pricePerKg
      };

      const response = await fetch('/api/admin/shipping-zones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        const savedZone = {
          ...result.data,
          id: result.data._id || result.data.id
        };

        if (editingZone.id) {
          setShippingZones(shippingZones.map(z => z.id === editingZone.id ? savedZone : z));
        } else {
          setShippingZones([...shippingZones, savedZone]);
        }
        setShowZoneModal(false);
        setEditingZone(null);
      } else {
        alert('خطا در ذخیره منطقه');
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      alert('خطا در ذخیره منطقه');
    }
  };

  const deleteMethod = (id: string) => {
    setShippingMethods(shippingMethods.filter(m => m.id !== id));
  };

  const deleteZone = async (id: string) => {
    if (!confirm('آیا از حذف این منطقه اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/admin/shipping-zones?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setShippingZones(shippingZones.filter(z => z.id !== id));
      } else {
        alert('خطا در حذف منطقه');
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('خطا در حذف منطقه');
    }
  };

  const toggleMethodActive = (id: string) => {
    setShippingMethods(shippingMethods.map(m => 
      m.id === id ? { ...m, active: !m.active } : m
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">مدیریت حمل و نقل</h1>
        <p className="text-gray-300">تنظیمات روش‌های ارسال و مناطق تحت پوشش</p>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'zones'
                ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            مناطق ارسال
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            تنظیمات عمومی
          </button>
        </div>

        <div className="p-6">
          {/* Shipping Zones Tab */}
          {activeTab === 'zones' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">مناطق ارسال</h2>
                <button
                  onClick={() => openZoneModal()}
                  className="btn-primary"
                >
                  افزودن منطقه جدید
                </button>
              </div>

              <div className="grid gap-4">
                {shippingZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => openZoneModal(zone)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => deleteZone(zone.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="col-span-3 md:col-span-1">
                        <span className="text-gray-400">شهرها:</span>
                        <p className="text-white truncate" title={zone.cities.join('، ')}>{zone.cities.join('، ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">ضریب قیمت:</span>
                        <p className="text-white font-medium">×{zone.multiplier}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">هزینه هر کیلوگرم:</span>
                        <p className="text-white font-medium">{zone.pricePerKg.toLocaleString('fa-IR')} تومان</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">تنظیمات عمومی حمل و نقل</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">تنظیمات کلی</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        هزینه بسته‌بندی (تومان)
                      </label>
                      <input
                        type="text"
                        value={packagingCost > 0 ? packagingCost.toLocaleString('en-US') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setPackagingCost(parseInt(value) || 0);
                        }}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="مثال: 5,000"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-400 mt-1">این مبلغ به هزینه ارسال محاسبه شده اضافه می‌شود</p>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="trackingEnabled"
                        checked={trackingEnabled}
                        onChange={(e) => setTrackingEnabled(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <label htmlFor="trackingEnabled" className="text-gray-300">
                        رهگیری مرسوله فعال باشد
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">اعلان‌ها</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="smsNotification"
                        checked={smsNotification}
                        onChange={(e) => setSmsNotification(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <label htmlFor="smsNotification" className="text-gray-300">
                        ارسال پیامک وضعیت ارسال
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="emailNotification"
                        checked={emailNotification}
                        onChange={(e) => setEmailNotification(e.target.checked)}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <label htmlFor="emailNotification" className="text-gray-300">
                        ارسال ایمیل وضعیت ارسال
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/shipping-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          packagingCost,
                          trackingEnabled,
                          smsNotification,
                          emailNotification
                        })
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        alert('✅ تنظیمات با موفقیت ذخیره شد');
                      } else {
                        alert('❌ خطا در ذخیره تنظیمات');
                      }
                    } catch (error) {
                      console.error('Error saving settings:', error);
                      alert('❌ خطا در ذخیره تنظیمات');
                    }
                  }}
                  className="btn-primary"
                >
                  ذخیره تنظیمات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Method Modal */}
      {showMethodModal && editingMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingMethod.id ? 'ویرایش روش ارسال' : 'افزودن روش ارسال'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نام</label>
                <input
                  type="text"
                  value={editingMethod.name}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="مثال: ارسال عادی"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
                <textarea
                  value={editingMethod.description}
                  onChange={(e) => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  rows={3}
                  placeholder="توضیحات روش ارسال"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">هزینه پایه (تومان)</label>
                  <input
                    type="text"
                    value={editingMethod.basePrice > 0 ? editingMethod.basePrice.toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setEditingMethod({ ...editingMethod, basePrice: parseInt(value) || 0 });
                    }}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="25,000"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ارسال رایگان از (تومان)</label>
                  <input
                    type="text"
                    value={editingMethod.freeThreshold > 0 ? editingMethod.freeThreshold.toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setEditingMethod({ ...editingMethod, freeThreshold: parseInt(value) || 0 });
                    }}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="500,000"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">زمان تحویل</label>
                <input
                  type="text"
                  value={editingMethod.estimatedDays}
                  onChange={(e) => setEditingMethod({ ...editingMethod, estimatedDays: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="مثال: 3-5 روز کاری"
                />
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="methodActive"
                  checked={editingMethod.active}
                  onChange={(e) => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded"
                />
                <label htmlFor="methodActive" className="text-gray-300">فعال</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowMethodModal(false)}
                className="btn-secondary"
              >
                انصراف
              </button>
              <button onClick={saveMethod} className="btn-primary">
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && editingZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingZone.id ? 'ویرایش منطقه ارسال' : 'افزودن منطقه ارسال'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نام منطقه</label>
                <input
                  type="text"
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="مثال: تهران و حومه"
                />
              </div>
              
              {/* انتخاب استان و شهر با ProvinceSelect */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">انتخاب مناطق تحت پوشش</label>
                <ProvinceSelect
                  selectedProvince=""
                  selectedCity=""
                  onProvinceChange={(province) => {
                    // اضافه کردن استان به لیست
                    if (province && !editingZone.provinces.includes(province)) {
                      setEditingZone({
                        ...editingZone,
                        provinces: [...editingZone.provinces, province]
                      });
                    }
                  }}
                  onCityChange={(city) => {
                    // اضافه کردن شهر به لیست
                    if (city && !editingZone.cities.includes(city)) {
                      setEditingZone({
                        ...editingZone,
                        cities: [...editingZone.cities, city]
                      });
                    }
                  }}
                  placeholder={{
                    province: 'انتخاب استان برای اضافه کردن',
                    city: 'انتخاب شهر برای اضافه کردن'
                  }}
                />
              </div>

              {/* نمایش استان‌های انتخاب شده */}
              {editingZone.provinces.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">استان‌های انتخاب شده</label>
                  <div className="flex flex-wrap gap-2">
                    {editingZone.provinces.map((province, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg border border-blue-500/30"
                      >
                        {province}
                        <button
                          onClick={() => {
                            setEditingZone({
                              ...editingZone,
                              provinces: editingZone.provinces.filter(p => p !== province)
                            });
                          }}
                          className="text-blue-400 hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* نمایش شهرهای انتخاب شده */}
              {editingZone.cities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">شهرهای انتخاب شده</label>
                  <div className="flex flex-wrap gap-2">
                    {editingZone.cities.map((city, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-300 rounded-lg border border-green-500/30"
                      >
                        {city}
                        <button
                          onClick={() => {
                            setEditingZone({
                              ...editingZone,
                              cities: editingZone.cities.filter(c => c !== city)
                            });
                          }}
                          className="text-green-400 hover:text-green-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ضریب قیمت</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingZone.multiplier}
                    onChange={(e) => setEditingZone({ ...editingZone, multiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="مثال: 1.5"
                  />
                  <p className="text-xs text-gray-400 mt-1">ضریب 1.0 = قیمت عادی، 1.5 = 50% گران‌تر</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">هزینه هر کیلوگرم (تومان)</label>
                  <input
                    type="text"
                    value={editingZone.pricePerKg > 0 ? editingZone.pricePerKg.toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setEditingZone({ ...editingZone, pricePerKg: parseFloat(value) || 0 });
                    }}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="مثال: 50,000"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-400 mt-1">هزینه ارسال به ازای هر کیلوگرم وزن محصول</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowZoneModal(false)}
                className="btn-secondary"
              >
                انصراف
              </button>
              <button onClick={saveZone} className="btn-primary">
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShippingPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <ShippingPageContent />
    </Suspense>
  );
};

export default ShippingPage;
