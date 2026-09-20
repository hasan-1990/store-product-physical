/**
 * کامپوننت ورودی شماره موبایل با اعتبارسنجی آنلاین
 * Mobile Input Component with Real-time Validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { validateIranianMobile, formatMobileNumber, detectOperator } from '@/utils/mobile-validation';

interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean, message: string) => void;
  placeholder?: string;
  className?: string;
  showOperator?: boolean;
  autoFormat?: boolean;
  disabled?: boolean;
  required?: boolean;
}

const MobileInput: React.FC<MobileInputProps> = ({
  value,
  onChange,
  onValidation,
  placeholder = 'شماره موبایل (مثال: 09123456789)',
  className = '',
  showOperator = true,
  autoFormat = true,
  disabled = false,
  required = false
}) => {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
    operator?: string;
  }>({ isValid: false, message: '' });
  
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // اعتبارسنجی در زمان واقعی
  useEffect(() => {
    if (!value) {
      const message = required ? 'شماره موبایل الزامی است' : '';
      setValidation({ isValid: !required, message });
      onValidation?.(!required, message);
      return;
    }

    const result = validateIranianMobile(value);
    const operator = detectOperator(value);
    
    const validationResult = {
      isValid: result.isValid,
      message: result.isValid 
        ? `شماره معتبر ${operator ? `(${operator})` : ''}` 
        : (result.error || 'شماره موبایل نامعتبر'),
      operator: operator || undefined
    };
    
    setValidation(validationResult);
    onValidation?.(validationResult.isValid, validationResult.message);
  }, [value, required, onValidation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // فرمت خودکار
    if (autoFormat && inputValue) {
      // حذف کاراکترهای غیر مجاز
      inputValue = inputValue.replace(/[^\d+]/g, '');
      
      // فرمت نمایشی اگر شماره کامل باشد
      if (inputValue.length === 11 && inputValue.startsWith('09')) {
        // نمایش به صورت 0912 345 6789
        inputValue = inputValue.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
      }
    }
    
    onChange(inputValue);
  };

  const handleBlur = () => {
    setFocused(false);
    setTouched(true);
    
    // فرمت نهایی هنگام خروج از فیلد
    if (autoFormat && value && validation.isValid) {
      const formatted = formatMobileNumber(value, 'display');
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  const getInputStyle = () => {
    const baseStyle = `
      w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 
      text-right placeholder-gray-400 focus:outline-none
    `;
    
    if (!touched || !value) {
      return baseStyle + ' border-gray-300 focus:border-blue-500';
    }
    
    if (validation.isValid) {
      return baseStyle + ' border-green-400 focus:border-green-500 bg-green-50';
    } else {
      return baseStyle + ' border-red-400 focus:border-red-500 bg-red-50';
    }
  };

  const getMessageStyle = () => {
    if (!touched || !value) return 'text-gray-500';
    return validation.isValid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="mobile-input-wrapper">
      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${getInputStyle()} ${className}`}
          dir="ltr"
        />
        
        {/* آیکون وضعیت */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {value && touched && (
            validation.isValid ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )
          )}
        </div>
      </div>
      
      {/* پیام اعتبارسنجی */}
      {(touched || focused) && (
        <div className={`mt-2 text-sm ${getMessageStyle()}`}>
          {validation.message || (focused ? 'شماره موبایل ایرانی خود را وارد کنید' : '')}
        </div>
      )}
      
      {/* نمایش اپراتور */}
      {showOperator && validation.operator && validation.isValid && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span>{validation.operator}</span>
          </div>
        </div>
      )}
      
      {/* راهنمای فرمت */}
      {focused && !validation.isValid && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">فرمت‌های قابل قبول:</div>
            <ul className="text-xs space-y-1 mr-4">
              <li>• 09123456789</li>
              <li>• +989123456789</li>
              <li>• 0912 345 6789</li>
              <li>• 0912-345-6789</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileInput;