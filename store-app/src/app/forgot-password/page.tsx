'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { validateMobileWithMessage } from '@/utils/mobile-validation'

interface FormData {
  phone: string
  email: string
}

type MethodType = 'phone' | 'email'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [method, setMethod] = useState<MethodType>('phone')
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    email: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (method === 'phone') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'شماره موبایل الزامی است'
      } else {
        const validation = validateMobileWithMessage(formData.phone.trim());
        if (!validation.isValid) {
          newErrors.phone = validation.message;
        }
      }
    } else {
      if (!formData.email.trim()) {
        newErrors.email = 'ایمیل الزامی است'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'ایمیل معتبر وارد کنید'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🚀 شروع submit فرم forgot password...');
    console.log(`📱 روش انتخابی: ${method}`);
    console.log(`📱 ${method === 'phone' ? 'شماره موبایل' : 'ایمیل'}:`, method === 'phone' ? formData.phone : formData.email);

    if (!validateForm()) {
      console.log('❌ validation فرم ناموفق');
      return;
    }

    console.log('✅ validation فرم موفق، ارسال درخواست...');
    setIsSubmitting(true)

    try {
      console.log('📤 ارسال درخواست به API...');

      const body = method === 'phone'
        ? { phone: formData.phone.trim() }
        : { email: formData.email.trim() }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      console.log('📥 دریافت پاسخ از API:', response.status, response.ok);
      const result = await response.json()
      console.log('📋 نتیجه API:', result);

      if (result.success) {
        console.log('✅ موفقیت! کد ارسال شد');
        setIsSuccess(true)
        if (method === 'phone') {
          setMaskedPhone(result.phone)
        } else {
          // برای ایمیل، یک ماسک ساده ایجاد میکنیم
          const email = formData.email.trim()
          const [username, domain] = email.split('@')
          const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1)
          setMaskedEmail(`${maskedUsername}@${domain}`)
        }
      } else {
        console.log('❌ خطا از API:', result.error);
        setErrors({ general: result.error })
      }
    } catch (error) {
      console.error('💥 خطا در درخواست:', error)
      setErrors({ general: 'خطا در ارسال درخواست' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToVerification = () => {
    if (method === 'phone') {
      router.push(`/reset-password?phone=${encodeURIComponent(formData.phone)}`)
    } else {
      // برای ایمیل، نیازی به رفتن به صفحه verification نداریم چون لینک میره به ایمیل
      router.push('/login')
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">
              {method === 'phone' ? 'کد تأیید ارسال شد' : 'لینک بازیابی ارسال شد'}
            </h1>

            <p className="text-gray-300 mb-6">
              {method === 'phone' ? (
                <>
                  کد تأیید به شماره {maskedPhone} ارسال شد.
                  <br />
                  برای تغییر رمز عبور، کد دریافتی را وارد کنید.
                </>
              ) : (
                <>
                  لینک بازیابی رمز عبور به ایمیل {maskedEmail} ارسال شد.
                  <br />
                  لطفاً ایمیل خود را بررسی کنید و روی لینک کلیک کنید.
                </>
              )}
            </p>

            <button
              onClick={goToVerification}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {method === 'phone' ? 'ادامه' : 'بازگشت به ورود'}
            </button>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                بازگشت به صفحه ورود
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              فراموشی رمز عبور
            </h1>
            <p className="text-gray-300">
              {method === 'phone' ? 'شماره موبایل خود را وارد کنید' : 'ایمیل خود را وارد کنید'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {method === 'phone' ? 'کد تأیید به شماره شما ارسال خواهد شد' : 'لینک بازیابی به ایمیل شما ارسال خواهد شد'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            {/* Method Selection Tabs */}
            <div className="flex gap-3 p-1 bg-gray-800/50 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMethod('phone')
                  setErrors({})
                }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all duration-300 ${
                  method === 'phone'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  شماره موبایل
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod('email')
                  setErrors({})
                }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all duration-300 ${
                  method === 'email'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ایمیل
                </div>
              </button>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-center">{errors.general}</p>
              </div>
            )}

            {/* Input Field - Phone or Email */}
            {method === 'phone' ? (
              <div>
                <label htmlFor="phone" className="block text-gray-300 mb-2 font-medium">
                  شماره موبایل <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-500/50 focus:border-red-400'
                      : 'border-purple-500/30 focus:border-purple-400'
                  }`}
                  placeholder="09123456789"
                  disabled={isSubmitting}
                  autoComplete="tel"
                  dir="ltr"
                />
                {errors.phone && <p className="mt-2 text-red-400 text-sm">{errors.phone}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">
                  ایمیل <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500/50 focus:border-red-400'
                      : 'border-purple-500/30 focus:border-purple-400'
                  }`}
                  placeholder="example@email.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                  dir="ltr"
                />
                {errors.email && <p className="mt-2 text-red-400 text-sm">{errors.email}</p>}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ارسال...
                </div>
              ) : (
                method === 'phone' ? 'ارسال کد تأیید' : 'ارسال لینک بازیابی'
              )}
            </button>

            {/* Footer Links */}
            <div className="text-center space-y-3">
              <div>
                <Link
                  href="/login"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  بازگشت به صفحه ورود
                </Link>
              </div>
              <div>
                <Link
                  href="/register"
                  className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
                >
                  حساب کاربری ندارید؟ ثبت‌نام کنید
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}