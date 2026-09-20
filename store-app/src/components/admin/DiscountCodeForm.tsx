'use client';

import { useState, useEffect } from 'react';
import { DiscountCode, DiscountFormData, CreateDiscountRequest } from '@/types/discount';
import PersianDatePicker from '@/components/ui/PersianDatePicker';
import '@/styles/persian-calendar.css';

interface DiscountCodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCode?: DiscountCode | null;
}

const DiscountCodeForm = ({ isOpen, onClose, onSuccess, editingCode }: DiscountCodeFormProps) => {
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usageLimitPerUser: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    excludedProducts: [],
    excludedCategories: [],
    firstTimeUserOnly: false,
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form with editing data
  useEffect(() => {
    if (editingCode) {
      setFormData({
        code: editingCode.code,
        type: editingCode.type,
        value: editingCode.value.toString(),
        minOrderAmount: editingCode.minOrderAmount?.toString() || '',
        maxDiscountAmount: editingCode.maxDiscountAmount?.toString() || '',
        usageLimit: editingCode.usageLimit?.toString() || '',
        usageLimitPerUser: editingCode.usageLimitPerUser?.toString() || '',
        validFrom: new Date(editingCode.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(editingCode.validUntil).toISOString().slice(0, 16),
        isActive: editingCode.isActive,
        applicableProducts: editingCode.applicableProducts || [],
        applicableCategories: editingCode.applicableCategories || [],
        excludedProducts: editingCode.excludedProducts || [],
        excludedCategories: editingCode.excludedCategories || [],
        firstTimeUserOnly: editingCode.firstTimeUserOnly || false,
        description: editingCode.description || ''
      });
    } else {
      // Reset form for new code
      setFormData({
        code: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        usageLimitPerUser: '',
        validFrom: '',
        validUntil: '',
        isActive: true,
        applicableProducts: [],
        applicableCategories: [],
        excludedProducts: [],
        excludedCategories: [],
        firstTimeUserOnly: false,
        description: ''
      });
    }
    setErrors({});
  }, [editingCode, isOpen]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Generate unique code
  const generateCode = async () => {
    try {
      const response = await fetch('/api/admin/discount-codes/generate');
      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, code: data.code }));
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'کد تخفیف الزامی است';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'مقدار تخفیف باید بیشتر از صفر باشد';
    }

    if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      newErrors.value = 'درصد تخفیف نمی‌تواند بیشتر از 100 باشد';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = 'تاریخ شروع الزامی است';
    }

    if (!formData.validUntil) {
      newErrors.validUntil = 'تاریخ پایان الزامی است';
    }

    if (formData.validFrom && formData.validUntil) {
      const validFrom = new Date(formData.validFrom);
      const validUntil = new Date(formData.validUntil);
      
      if (validFrom >= validUntil) {
        newErrors.validUntil = 'تاریخ پایان باید بعد از تاریخ شروع باشد';
      }
    }

    if (formData.minOrderAmount && parseFloat(formData.minOrderAmount) < 0) {
      newErrors.minOrderAmount = 'حداقل مبلغ سفارش نمی‌تواند منفی باشد';
    }

    if (formData.maxDiscountAmount && parseFloat(formData.maxDiscountAmount) < 0) {
      newErrors.maxDiscountAmount = 'حداکثر مبلغ تخفیف نمی‌تواند منفی باشد';
    }

    if (formData.usageLimit && parseInt(formData.usageLimit) < 1) {
      newErrors.usageLimit = 'محدودیت استفاده باید حداقل 1 باشد';
    }

    if (formData.usageLimitPerUser && parseInt(formData.usageLimitPerUser) < 1) {
      newErrors.usageLimitPerUser = 'محدودیت استفاده هر کاربر باید حداقل 1 باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData: CreateDiscountRequest = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : undefined,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        isActive: formData.isActive,
        applicableProducts: formData.applicableProducts,
        applicableCategories: formData.applicableCategories,
        excludedProducts: formData.excludedProducts,
        excludedCategories: formData.excludedCategories,
        firstTimeUserOnly: formData.firstTimeUserOnly,
        description: formData.description
      };

      const url = editingCode 
        ? '/api/admin/discount-codes' 
        : '/api/admin/discount-codes';
      
      const method = editingCode ? 'PUT' : 'POST';
      
      if (editingCode) {
        (requestData as any).id = editingCode.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
        alert(editingCode ? 'کد تخفیف با موفقیت به‌روزرسانی شد' : 'کد تخفیف با موفقیت ایجاد شد');
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('خطا در ارسال فرم');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {editingCode ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف جدید'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">اطلاعات پایه</h3>
              
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  کد تخفیف <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="مثال: SUMMER2024"
                    className={`flex-1 px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.code ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    تولید
                  </button>
                </div>
                {errors.code && <p className="text-red-400 text-sm mt-1">{errors.code}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  نوع تخفیف <span className="text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="percentage">درصدی</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  مقدار تخفیف <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder={formData.type === 'percentage' ? '10' : '50000'}
                    min="0"
                    step={formData.type === 'percentage' ? '0.1' : '1000'}
                    className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.value ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {formData.type === 'percentage' ? '%' : 'تومان'}
                  </span>
                </div>
                {errors.value && <p className="text-red-400 text-sm mt-1">{errors.value}</p>}
              </div>

              {/* Min Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  حداقل مبلغ سفارش (تومان)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  placeholder="100000"
                  min="0"
                  step="1000"
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.minOrderAmount ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.minOrderAmount && <p className="text-red-400 text-sm mt-1">{errors.minOrderAmount}</p>}
              </div>

              {/* Max Discount Amount */}
              {formData.type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    حداکثر مبلغ تخفیف (تومان)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleInputChange}
                    placeholder="200000"
                    min="0"
                    step="1000"
                    className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                      errors.maxDiscountAmount ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.maxDiscountAmount && <p className="text-red-400 text-sm mt-1">{errors.maxDiscountAmount}</p>}
                </div>
              )}
            </div>

            {/* Usage & Validity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">محدودیت‌ها و اعتبار</h3>
              
              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  محدودیت تعداد استفاده کل
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.usageLimit ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.usageLimit && <p className="text-red-400 text-sm mt-1">{errors.usageLimit}</p>}
                <p className="text-gray-400 text-xs mt-1">خالی بگذارید برای نامحدود</p>
              </div>

              {/* Usage Limit Per User */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  محدودیت تعداد استفاده هر کاربر
                </label>
                <input
                  type="number"
                  name="usageLimitPerUser"
                  value={formData.usageLimitPerUser}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                    errors.usageLimitPerUser ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.usageLimitPerUser && <p className="text-red-400 text-sm mt-1">{errors.usageLimitPerUser}</p>}
                <p className="text-gray-400 text-xs mt-1">خالی بگذارید برای نامحدود</p>
              </div>

              {/* Valid From */}
              <PersianDatePicker
                label="تاریخ شروع اعتبار"
                value={formData.validFrom}
                onChange={(isoDate) => handleInputChange({ target: { name: 'validFrom', value: isoDate } } as any)}
                placeholder="انتخاب تاریخ شروع"
                required
                error={errors.validFrom}
                showTime
              />

              {/* Valid Until */}
              <PersianDatePicker
                label="تاریخ پایان اعتبار"
                value={formData.validUntil}
                onChange={(isoDate) => handleInputChange({ target: { name: 'validUntil', value: isoDate } } as any)}
                placeholder="انتخاب تاریخ پایان"
                required
                error={errors.validUntil}
                showTime
                minDate={formData.validFrom} // Ensure end date is after start date
              />

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-600 mr-3"
                  />
                  <label className="text-gray-300">فعال</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="firstTimeUserOnly"
                    checked={formData.firstTimeUserOnly}
                    onChange={handleInputChange}
                    className="rounded border-gray-600 mr-3"
                  />
                  <label className="text-gray-300">فقط برای کاربران تازه</label>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="توضیحات اختیاری برای کد تخفیف..."
              className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {editingCode ? 'به‌روزرسانی کد تخفیف' : 'ایجاد کد تخفیف'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountCodeForm;