'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface FormData {
  code: string
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''
  const email = searchParams.get('email') || ''
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [step, setStep] = useState<'verify' | 'password'>('verify')
  const [code, setCode] = useState(['', '', '', ''])
  const [formData, setFormData] = useState<FormData>({
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Redirect if no phone number or email
    if (!phone && !email) {
      router.push('/forgot-password')
    }
  }, [phone, email, router])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    
    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto-verify when all 4 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 4) {
      handleVerifyCode(newCode.join(''))
    }
    
    // Clear error when user starts typing
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }))
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyCode = async (codeValue: string) => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const body: any = { code: codeValue }
      if (phone) {
        body.phone = phone
      } else if (email) {
        body.email = email
      }

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        setStep('password')
        setFormData(prev => ({ ...prev, code: codeValue }))
      } else {
        setErrors({ code: result.error || 'کد تأیید نامعتبر است' })
        // Reset code inputs on error
        setCode(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Verify code error:', error)
      setErrors({ code: 'خطا در تأیید کد' })
      setCode(['', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

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

    if (!formData.newPassword) {
      newErrors.newPassword = 'رمز عبور جدید الزامی است'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'رمز عبور باید حداقل 6 کاراکتر باشد'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تکرار آن یکسان نیستند'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only handle password change in step 2
    if (step !== 'password') return

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const body: any = {
        code: formData.code,
        newPassword: formData.newPassword
      }

      if (phone) {
        body.phone = phone
      } else if (email) {
        body.email = email
      }

      const response = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        setIsSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=password_reset_success')
        }, 3000)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ general: 'خطا در بازنشانی رمز عبور' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBackToForgotPassword = () => {
    router.push('/forgot-password')
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
              رمز عبور تغییر یافت!
            </h1>
            
            <p className="text-gray-300 mb-6">
              رمز عبور شما با موفقیت تغییر یافت.
              <br />
              در حال انتقال به صفحه ورود...
            </p>

            <div className="flex items-center justify-center mb-4">
              <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              رفتن به صفحه ورود
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!phone && !email) {
    return null // Will redirect to forgot-password
  }

  // Create masked display for phone or email
  const maskedContact = phone
    ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3')
    : email
      ? (() => {
          const [username, domain] = email.split('@')
          const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1)
          return `${maskedUsername}@${domain}`
        })()
      : ''

  const contactType = phone ? 'شماره موبایل' : 'ایمیل'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'verify' ? (
                phone ? (
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )
              ) : (
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>

            {step === 'verify' ? (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">
                  تأیید {contactType}
                </h1>
                <p className="text-gray-300">
                  کد 4 رقمی ارسال شده به {contactType}
                  <br />
                  <span className="text-purple-400 font-semibold">
                    {maskedContact}
                  </span>
                  <br />
                  را وارد کنید
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">
                  تنظیم رمز عبور جدید
                </h1>
                <p className="text-gray-300">
                  {contactType} شما تأیید شد!
                  <br />
                  حالا رمز عبور جدید خود را وارد کنید
                </p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-center">{errors.general}</p>
              </div>
            )}

            {step === 'verify' ? (
              /* Verification Code Step */
              <>
                <div>
                  <label className="block text-gray-300 mb-4 font-medium text-center">
                    کد تأیید 4 رقمی را وارد کنید
                  </label>
                  <div className="flex justify-center gap-3" dir="ltr">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className={`w-14 h-14 text-center text-2xl font-bold bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-all ${
                          errors.code 
                            ? 'border-red-500/50 focus:border-red-400' 
                            : 'border-purple-500/30 focus:border-purple-400 focus:shadow-lg'
                        }`}
                        placeholder="0"
                        disabled={isSubmitting}
                        maxLength={1}
                      />
                    ))}
                  </div>
                  {errors.code && <p className="mt-3 text-red-400 text-sm text-center">{errors.code}</p>}
                </div>

                {/* Loading State for Verification */}
                {isSubmitting && (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <svg className="animate-spin h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="text-purple-400">در حال تأیید کد...</p>
                  </div>
                )}
              </>
            ) : (
              /* Password Change Step */
              <>
                {/* Success Message */}
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-400 font-medium">کد شما تأیید شد!</p>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label htmlFor="newPassword" className="block text-gray-300 mb-2 font-medium">
                    رمز عبور جدید <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors pr-12 ${
                        errors.newPassword 
                          ? 'border-red-500/50 focus:border-red-400' 
                          : 'border-purple-500/30 focus:border-purple-400'
                      }`}
                      placeholder="رمز عبور جدید خود را وارد کنید"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
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
                  {errors.newPassword && <p className="mt-2 text-red-400 text-sm">{errors.newPassword}</p>}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-300 mb-2 font-medium">
                    تکرار رمز عبور جدید <span className="text-red-400">*</span>
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
                      placeholder="رمز عبور جدید را مجدداً وارد کنید"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
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

                {/* Submit Button for Password Change */}
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
                      در حال تغییر رمز عبور...
                    </div>
                  ) : (
                    'تغییر رمز عبور'
                  )}
                </button>
              </>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-3">
              <div>
                <button
                  type="button"
                  onClick={goBackToForgotPassword}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ارسال مجدد کد تأیید
                </button>
              </div>
              <div>
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
                >
                  بازگشت به صفحه ورود
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}