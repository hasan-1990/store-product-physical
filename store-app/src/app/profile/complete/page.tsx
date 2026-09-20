'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { validateEmail, validateFirstName, validatePassword, getStrengthLabel } from '@/utils'

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

interface User {
  id: string
  name: string | null
  email: string | null
  phone: string
  profileComplete: boolean
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in and profile is incomplete
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData) as User
      if (parsedUser.profileComplete) {
        // Profile already complete, redirect to user dashboard
        router.push('/user')
        return
      }
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // چک کردن قدرت رمز عبور
    if (name === 'password' && value) {
      const result = validatePassword(value);
      setPasswordStrength(result.strength);
    } else if (name === 'password' && !value) {
      setPasswordStrength(null);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // اعتبارسنجی نام
    const nameResult = validateFirstName(formData.name);
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error || 'نام نامعتبر است';
    }

    // اعتبارسنجی ایمیل
    const emailResult = validateEmail(formData.email, { allowTempEmails: false });
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error || 'ایمیل نامعتبر است';
    }

    // اعتبارسنجی رمز عبور
    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error || 'رمز عبور نامعتبر است';
    }

    // بررسی تطابق رمزها
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.data.user))
        
        // Redirect to user dashboard
        router.push('/user')
      } else {
        if (result.details && Array.isArray(result.details)) {
          const newErrors: FormErrors = {}
          result.details.forEach((error: any) => {
            if (error.path && error.path[0]) {
              newErrors[error.path[0]] = error.message
            }
          })
          setErrors(newErrors)
        } else {
          setErrors({ general: result.error || 'خطا در تکمیل پروفایل' })
        }
      }
    } catch (error) {
      console.error('Complete profile error:', error)
      setErrors({ general: 'خطا در ارتباط با سرور' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">تکمیل اطلاعات کاربری</h1>
          <p className="text-gray-300 mb-4">
            شماره موبایل <span className="text-green-400 font-medium">{user.phone}</span> تایید شد
          </p>
          <p className="text-gray-300">اطلاعات باقی‌مانده خود را وارد کنید</p>
        </div>

        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-gray-300 mb-2 font-medium">
                نام و نام خانوادگی <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                  errors.name 
                    ? 'border-red-500/50 focus:border-red-400' 
                    : 'border-purple-500/30 focus:border-purple-400'
                }`}
                placeholder="نام و نام خانوادگی خود را وارد کنید"
              />
              {errors.name && <p className="mt-2 text-red-400 text-sm">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2 font-medium">
                آدرس ایمیل <span className="text-red-400">*</span>
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
                dir="ltr"
              />
              {errors.email && <p className="mt-2 text-red-400 text-sm">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-gray-300 mb-2 font-medium">
                رمز عبور <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors pr-12 ${
                    errors.password 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-purple-500/30 focus:border-purple-400'
                  }`}
                  placeholder="حداقل 6 کاراکتر"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-red-400 text-sm">{errors.password}</p>}
              
              {/* نشانگر قدرت رمز عبور */}
              {passwordStrength && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">قدرت رمز عبور:</span>
                    <span className="text-sm font-bold" style={{ color: passwordStrength.color }}>
                      {getStrengthLabel(passwordStrength.level)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${passwordStrength.percentage}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  {passwordStrength.feedback && passwordStrength.feedback.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {passwordStrength.feedback.map((feedback: string, i: number) => (
                        <div key={i}>• {feedback}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-300 mb-2 font-medium">
                تکرار رمز عبور <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors pr-12 ${
                    errors.confirmPassword 
                      ? 'border-red-500/50 focus:border-red-400' 
                      : 'border-purple-500/30 focus:border-purple-400'
                  }`}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-red-400 text-sm">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'در حال تکمیل پروفایل...' : 'تکمیل پروفایل و ورود'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              می‌خواهید از حساب دیگری استفاده کنید؟{' '}
              <button 
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  router.push('/register')
                }}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                شماره جدید
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link 
              href="/" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}