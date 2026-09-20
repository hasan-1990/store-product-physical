/**
 * مثال استفاده از سیستم اعتبارسنجی شماره موبایل ایرانی
 * Example usage of Iranian Mobile Phone Validation System
 */

'use client';

import React, { useState } from 'react';
import MobileInput from '@/components/MobileInput';
import { 
  validateIranianMobile, 
  formatMobileNumber, 
  detectOperator,
  generateRandomMobile 
} from '@/utils/mobile-validation';

const MobileValidationExample: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: false, message: '' });

  const handleValidation = (isValid: boolean, message: string) => {
    setValidationResult({ isValid, message });
  };

  const generateSample = () => {
    const randomMobile = generateRandomMobile();
    setMobileNumber(randomMobile);
  };

  const testValidation = () => {
    if (!mobileNumber) return;
    
    const result = validateIranianMobile(mobileNumber, {
      allowInternational: true,
      strictOperatorCheck: false
    });
    
    console.log('🧪 نتیجه اعتبارسنجی:', result);
    
    if (result.isValid) {
      alert(`✅ شماره معتبر!\n\nفرمت شده: ${result.formatted}\nاپراتور: ${result.operator || 'نامشخص'}`);
    } else {
      alert(`❌ شماره نامعتبر!\n\nخطا: ${result.error}`);
    }
  };

  const formatNumber = (format: 'local' | 'international' | 'display') => {
    if (!mobileNumber) return;
    
    const formatted = formatMobileNumber(mobileNumber, format);
    setMobileNumber(formatted);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🧪 تست سیستم اعتبارسنجی شماره موبایل ایرانی
      </h2>

      <div className="space-y-6">
        {/* کامپوننت ورودی */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شماره موبایل:
          </label>
          <MobileInput
            value={mobileNumber}
            onChange={setMobileNumber}
            onValidation={handleValidation}
            showOperator={true}
            autoFormat={true}
            required={true}
          />
        </div>

        {/* دکمه‌های عملیاتی */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateSample}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🎲 تولید شماره تصادفی
          </button>
          
          <button
            onClick={testValidation}
            disabled={!mobileNumber}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ تست اعتبارسنجی
          </button>
          
          <button
            onClick={() => formatNumber('local')}
            disabled={!mobileNumber}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            محلی
          </button>
          
          <button
            onClick={() => formatNumber('international')}
            disabled={!mobileNumber}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            بین‌المللی
          </button>
          
          <button
            onClick={() => formatNumber('display')}
            disabled={!mobileNumber}
            className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            نمایشی
          </button>
        </div>

        {/* نمایش نتایج */}
        {mobileNumber && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">📊 اطلاعات شماره:</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">وضعیت:</span>
                <span className={`mr-2 ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.isValid ? '✅ معتبر' : '❌ نامعتبر'}
                </span>
              </div>
              
              <div>
                <span className="font-medium">پیام:</span>
                <span className="mr-2 text-gray-600">{validationResult.message}</span>
              </div>
              
              {validationResult.isValid && (
                <>
                  <div>
                    <span className="font-medium">اپراتور:</span>
                    <span className="mr-2 text-blue-600">{detectOperator(mobileNumber) || 'نامشخص'}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">فرمت محلی:</span>
                    <span className="mr-2 font-mono">{formatMobileNumber(mobileNumber, 'local')}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium">فرمت بین‌المللی:</span>
                    <span className="mr-2 font-mono">{formatMobileNumber(mobileNumber, 'international')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* نمونه شماره‌ها */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">📋 نمونه شماره‌های معتبر:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              '09123456789 (همراه اول)',
              '09901234567 (ایرانسل)',
              '09201234567 (رایتل)',
              '+989123456789 (بین‌المللی)',
              '0912 345 6789 (با فاصله)',
              '0912-345-6789 (با خط تیره)'
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setMobileNumber(example.split(' ')[0])}
                className="text-left p-2 bg-white rounded border hover:bg-blue-100 transition-colors cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* آمار اپراتورها */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">📡 اپراتورهای پشتیبانی شده:</h3>
          <div className="text-sm space-y-1">
            <div>• همراه اول: 0901, 0902, 0903, 0905, 0930-0939</div>
            <div>• ایرانسل: 0910-0919, 0990-0999</div>
            <div>• رایتل: 0920-0922</div>
            <div>• تله‌کیش: 0932, 0934</div>
            <div>• سایر اپراتورها: 0959, 0989, 0997, 0998</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileValidationExample;