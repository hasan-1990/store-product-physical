'use client';
import React, { useState, useEffect } from 'react';
import { ABTest, ABTestVariant } from '@/hooks/useABTest';

export function ABTestManagement() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'draft' | 'completed'>('all');

  useEffect(() => {
    loadTests();
  }, [activeTab]);

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await fetch(`/api/admin/ab-tests${statusParam}`);
      const result = await response.json();

      if (result.success) {
        setTests(result.tests || []);
      } else {
        throw new Error(result.error || 'خطا در بارگذاری تست‌ها');
      }
    } catch (err) {
      console.error('خطا در بارگذاری تست‌ها:', err);
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, newStatus: ABTest['status']) => {
    try {
      const response = await fetch('/api/admin/ab-tests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testId, status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        setTests(prev => prev.map(test => 
          test.id === testId ? { ...test, status: newStatus } : test
        ));
      } else {
        throw new Error(result.error || 'خطا در تغییر وضعیت');
      }
    } catch (err) {
      console.error('خطا در تغییر وضعیت تست:', err);
      alert('خطا در تغییر وضعیت تست');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('آیا از حذف این تست مطمئن هستید؟')) return;

    try {
      const response = await fetch(`/api/admin/ab-tests?id=${testId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setTests(prev => prev.filter(test => test.id !== testId));
      } else {
        throw new Error(result.error || 'خطا در حذف تست');
      }
    } catch (err) {
      console.error('خطا در حذف تست:', err);
      alert('خطا در حذف تست');
    }
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ABTest['status']) => {
    switch (status) {
      case 'running': return 'در حال اجرا';
      case 'draft': return 'پیش‌نویس';
      case 'paused': return 'متوقف';
      case 'completed': return 'تکمیل شده';
      default: return 'نامشخص';
    }
  };

  const calculateOverallStats = (test: ABTest) => {
    if (!test.results) return { totalViews: 0, totalConversions: 0, averageConversionRate: 0 };

    const variants = Object.values(test.results);
    const totalViews = variants.reduce((sum, variant) => sum + variant.views, 0);
    const totalConversions = variants.reduce((sum, variant) => sum + variant.conversions, 0);
    const averageConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    return { totalViews, totalConversions, averageConversionRate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="mr-3 text-gray-300">بارگذاری تست‌ها...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت A/B Testing</h2>
          <p className="text-gray-300 mt-1">آزمایش و بهینه‌سازی تجربه کاربری</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ایجاد تست جدید
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-reverse space-x-8">
          {[
            { key: 'all', label: 'همه', count: tests.length },
            { key: 'running', label: 'در حال اجرا', count: tests.filter(t => t.status === 'running').length },
            { key: 'draft', label: 'پیش‌نویس', count: tests.filter(t => t.status === 'draft').length },
            { key: 'completed', label: 'تکمیل شده', count: tests.filter(t => t.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`mr-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-purple-100 text-purple-700' : 'bg-gray-700 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="mr-3">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={loadTests}
                className="text-sm text-red-400 hover:text-red-300 underline mt-1"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">هیچ تستی یافت نشد</h3>
          <p className="mt-1 text-sm text-gray-400">با ایجاد اولین تست A/B خود شروع کنید</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              ایجاد تست جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {tests.map(test => {
            const stats = calculateOverallStats(test);
            return (
              <div key={test.id} className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                        {getStatusLabel(test.status)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{test.description}</p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">کل بازدید</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{stats.totalConversions.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">تبدیل</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{stats.averageConversionRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-400">نرخ تبدیل</div>
                      </div>
                    </div>

                    {/* Variants */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Variants:</h4>
                      <div className="flex flex-wrap gap-2">
                        {test.variants.map(variant => (
                          <div key={variant.id} className="flex items-center gap-2 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/30">
                            <span className="text-sm font-medium text-purple-200">{variant.name}</span>
                            <span className="text-xs text-purple-300">{variant.weight}%</span>
                            {test.results?.[variant.id] && (
                              <span className="text-xs text-purple-300">
                                ({test.results[variant.id].conversions}/{test.results[variant.id].views})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(test.id, 'running')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        شروع
                      </button>
                    )}
                    
                    {test.status === 'running' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(test.id, 'paused')}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          توقف
                        </button>
                        <button
                          onClick={() => handleStatusChange(test.id, 'completed')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          تکمیل
                        </button>
                      </>
                    )}
                    
                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(test.id, 'running')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        ادامه
                      </button>
                    )}

                    <button
                      onClick={() => setEditingTest(test)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      ویرایش
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Dates */}
                {(test.startDate || test.endDate) && (
                  <div className="flex gap-4 text-sm text-gray-400 border-t border-gray-700 pt-3">
                    {test.startDate && (
                      <span>شروع: {new Date(test.startDate).toLocaleDateString('fa-IR')}</span>
                    )}
                    {test.endDate && (
                      <span>پایان: {new Date(test.endDate).toLocaleDateString('fa-IR')}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingTest) && (
        <ABTestForm
          test={editingTest}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTest(null);
          }}
          onSave={() => {
            loadTests();
            setShowCreateForm(false);
            setEditingTest(null);
          }}
        />
      )}
    </div>
  );
}

// فرم ایجاد/ویرایش تست
interface ABTestFormProps {
  test?: ABTest | null;
  onClose: () => void;
  onSave: () => void;
}

function ABTestForm({ test, onClose, onSave }: ABTestFormProps) {
  const [formData, setFormData] = useState({
    name: test?.name || '',
    description: test?.description || '',
    variants: test?.variants || [
      { id: 'control', name: 'کنترل', weight: 50 },
      { id: 'variant_a', name: 'Variant A', weight: 50 }
    ],
    goals: {
      primary: test?.goals.primary || 'conversion',
      secondary: test?.goals.secondary || []
    },
    targetAudience: {
      percentage: test?.targetAudience?.percentage || 100,
      conditions: test?.targetAudience?.conditions || {}
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = test ? 'PUT' : 'POST';
      const body = test 
        ? { id: test.id, ...formData }
        : formData;

      const response = await fetch('/api/admin/ab-tests', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        onSave();
      } else {
        throw new Error(result.error || 'خطا در ذخیره تست');
      }
    } catch (err) {
      console.error('خطا در ذخیره تست:', err);
      alert('خطا در ذخیره تست');
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { 
          id: `variant_${Date.now()}`, 
          name: `Variant ${prev.variants.length}`, 
          weight: 0 
        }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 2) return; // حداقل 2 variant

    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: keyof ABTestVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              {test ? 'ویرایش تست' : 'ایجاد تست جدید'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">نام تست</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                required
              />
            </div>

            {/* Variants */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-300">Variants</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + افزودن Variant
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div key={variant.id} className="flex items-center gap-3 p-3 border border-gray-600 bg-gray-700/50 rounded-lg">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm focus:ring-1 focus:ring-purple-500"
                      placeholder="نام variant"
                    />
                    <input
                      type="number"
                      value={variant.weight}
                      onChange={(e) => updateVariant(index, 'weight', parseInt(e.target.value) || 0)}
                      className="w-20 border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-purple-500"
                      placeholder="وزن"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-gray-400">%</span>
                    {formData.variants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-400 mt-2">
                مجموع: {formData.variants.reduce((sum, v) => sum + v.weight, 0)}%
                {formData.variants.reduce((sum, v) => sum + v.weight, 0) !== 100 && (
                  <span className="text-red-400 mr-2">⚠️ مجموع باید 100% باشد</span>
                )}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">هدف اصلی</label>
              <select
                value={formData.goals.primary}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  goals: { ...prev.goals, primary: e.target.value }
                }))}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="conversion">تبدیل کلی</option>
                <option value="add_to_cart">افزودن به سبد</option>
                <option value="purchase">خرید</option>
                <option value="signup">ثبت‌نام</option>
                <option value="contact">تماس</option>
                <option value="click">کلیک</option>
                <option value="view">بازدید</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">درصد شرکت در تست</label>
              <input
                type="number"
                value={formData.targetAudience.percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  targetAudience: { 
                    ...prev.targetAudience, 
                    percentage: parseInt(e.target.value) || 0 
                  }
                }))}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="1"
                max="100"
              />
              <p className="text-sm text-gray-400 mt-1">درصد کاربرانی که در تست شرکت می‌کنند</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving || formData.variants.reduce((sum, v) => sum + v.weight, 0) !== 100}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'در حال ذخیره...' : (test ? 'به‌روزرسانی' : 'ایجاد تست')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}