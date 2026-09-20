'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { validateMobileWithMessage } from '@/utils/mobile-validation'

// WordPress Character Component - کوچکتر شده
const WordPressCharacter = ({ state = 'idle' }) => {
  const getCharacterAnimation = () => {
    switch (state) {
      case 'loading':
        return {
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
          y: [0, -3, 0]
        }
      case 'success':
        return {
          scale: [1, 1.2, 1],
          rotate: [0, 360, 0],
          y: [0, -10, 0]
        }
      case 'error':
        return {
          rotate: [0, -10, 10, -5, 5, 0],
          scale: [1, 0.9, 1]
        }
      case 'thinking':
        return {
          y: [0, -2, 0],
          scale: [1, 1.03, 1]
        }
      case 'happy':
        return {
          scale: [1, 1.15, 1],
          y: [0, -8, 0]
        }
      default:
        return {
          y: [0, -1, 0],
          scale: [1, 1.01, 1]
        }
    }
  }

  const getCharacterEmoji = () => {
    switch (state) {
      case 'loading': return '📱'
      case 'success': return '🎉'
      case 'error': return '😰'
      case 'thinking': return '🤔'
      case 'happy': return '😊'
      default: return '🚀'
    }
  }

  return (
    <motion.div
      className="relative w-12 h-12 mx-auto mb-4"
      animate={getCharacterAnimation()}
      transition={{ 
        duration: state === 'loading' ? 0.8 : 2,
        repeat: state === 'loading' ? Infinity : state === 'thinking' ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {/* Main Character - کوچکتر شده */}
      <motion.div
        className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white/30"
        whileHover={{ scale: 1.1 }}
      >
        <motion.span
          key={state}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ duration: 0.5 }}
        >
          {getCharacterEmoji()}
        </motion.span>
      </motion.div>

      {/* Floating Icons - کوچکتر شده */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {[
          { icon: '✨', position: 'top-0 left-0' },
          { icon: '🎨', position: 'top-0 right-0' },
          { icon: '📋', position: 'bottom-0 left-0' },
          { icon: '🔐', position: 'bottom-0 right-0' }
        ].map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.position} w-4 h-4 text-xs flex items-center justify-center`}
            animate={{ 
              y: [0, -3, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2 + i * 0.5, 
              repeat: Infinity,
              delay: i * 0.2 
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </motion.div>

      {/* Pulse effect */}
      {state === 'loading' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-400"
          animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

interface FormData {
  phone: string
  verificationCode: string
}

interface FormErrors {
  [key: string]: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'verification'>('phone')
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    verificationCode: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCodeSending, setIsCodeSending] = useState(false)
  const [characterState, setCharacterState] = useState<'idle' | 'loading' | 'thinking' | 'success' | 'error' | 'happy'>('idle')

  // Character state management
  useEffect(() => {
    if (isSubmitting || isCodeSending) {
      setCharacterState('loading')
    } else if (step === 'verification') {
      setCharacterState('thinking')
    } else {
      setCharacterState('idle')
    }
  }, [isSubmitting, isCodeSending, step])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Character reactions
    if (value.length > 0) {
      setCharacterState('thinking')
    } else {
      setCharacterState('idle')
    }
  }

  const validatePhone = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره موبایل الزامی است'
      setCharacterState('error')
    } else {
      // استفاده از سیستم اعتبارسنجی بهبود یافته
      const validation = validateMobileWithMessage(formData.phone.trim());
      if (!validation.isValid) {
        newErrors.phone = validation.message;
        setCharacterState('error');
      }
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      setCharacterState('happy')
      return true
    }
    return false
  }

  const validateCode = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = 'کد تایید الزامی است'
      setCharacterState('error')
    } else if (formData.verificationCode.trim().length !== 4) {
      newErrors.verificationCode = 'کد تایید باید 4 رقم باشد'
      setCharacterState('error')
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      setCharacterState('happy')
      return true
    }
    return false
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePhone()) {
      return
    }

    setIsCodeSending(true)
    setCharacterState('loading')

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStep('verification')
        setErrors({})
        setCharacterState('success')
        setTimeout(() => setCharacterState('thinking'), 1000)
      } else {
        setErrors({ phone: result.error || 'خطا در ارسال کد تایید' })
        setCharacterState('error')
        setTimeout(() => setCharacterState('idle'), 2000)
      }
    } catch (error) {
      console.error('Send verification error:', error)
      setErrors({ phone: 'خطا در ارتباط با سرور' })
      setCharacterState('error')
      setTimeout(() => setCharacterState('idle'), 2000)
    } finally {
      setIsCodeSending(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCode()) {
      return
    }

    setIsSubmitting(true)
    setCharacterState('loading')

    try {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          verificationCode: formData.verificationCode
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCharacterState('success')
        // Store token in localStorage
        localStorage.setItem('token', result.data.token)
        localStorage.setItem('user', JSON.stringify(result.data.user))
        
        setTimeout(() => {
          // Redirect to profile completion page
          router.push('/profile/complete')
        }, 1500)
      } else {
        setErrors({ verificationCode: result.error || 'کد تایید نامعتبر است' })
        setCharacterState('error')
        setTimeout(() => setCharacterState('thinking'), 2000)
      }
    } catch (error) {
      console.error('Verify code error:', error)
      setErrors({ verificationCode: 'خطا در ارتباط با سرور' })
      setCharacterState('error')
      setTimeout(() => setCharacterState('thinking'), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    setIsCodeSending(true)
    setCharacterState('loading')
    setErrors({})

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setErrors({ verificationCode: result.error || 'خطا در ارسال مجدد کد' })
        setCharacterState('error')
        setTimeout(() => setCharacterState('thinking'), 2000)
      } else {
        setCharacterState('success')
        setTimeout(() => setCharacterState('thinking'), 1000)
      }
    } catch (error) {
      console.error('Resend code error:', error)
      setErrors({ verificationCode: 'خطا در ارتباط با سرور' })
      setCharacterState('error')
      setTimeout(() => setCharacterState('thinking'), 2000)
    } finally {
      setIsCodeSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-pink-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-6">
          <WordPressCharacter state={characterState} />
          <h1 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {step === 'phone' ? 'ثبت‌نام در فروشگاه' : 'تایید شماره موبایل'}
          </h1>
          <p className="text-gray-300 text-sm">
            {step === 'phone' 
              ? 'برای شروع، شماره موبایل خود را وارد کنید' 
              : `کد تایید ارسال شده به ${formData.phone} را وارد کنید`
            }
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl relative">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
          
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {Object.keys(errors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-xs">
                      {errors.phone || errors.verificationCode || errors.general}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSendCode}
                  className="space-y-4"
                >
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-gray-200 text-xs font-medium">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pr-10 pl-4 py-3 bg-white/10 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300 backdrop-blur-sm text-sm ${
                          errors.phone 
                            ? 'border-red-400/50 focus:border-red-400' 
                            : 'border-white/20 focus:border-green-400/50 hover:border-white/30'
                        }`}
                        placeholder="09xxxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isCodeSending}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {isCodeSending && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isCodeSending ? 'در حال ارسال...' : 'دریافت کد تایید'}
                    </div>
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="verification-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerifyCode}
                  className="space-y-4"
                >
                  {/* Verification Code Field */}
                  <div className="space-y-2">
                    <label htmlFor="verificationCode" className="block text-gray-200 text-xs font-medium">
                      کد تایید 4 رقمی
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="verificationCode"
                        name="verificationCode"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        maxLength={4}
                        className={`w-full pr-10 pl-4 py-3 bg-white/10 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm text-center text-lg tracking-widest ${
                          errors.verificationCode 
                            ? 'border-red-400/50 focus:border-red-400' 
                            : 'border-white/20 focus:border-blue-400/50 hover:border-white/30'
                        }`}
                        placeholder="- - - -"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <div className="flex items-center justify-center">
                        {isSubmitting && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {isSubmitting ? 'در حال تایید...' : 'تایید و ثبت‌نام'}
                      </div>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isCodeSending}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs transition-all duration-300 disabled:opacity-50 border border-white/20 hover:border-white/30"
                      >
                        ارسال مجدد
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone')
                          setErrors({})
                          setFormData(prev => ({ ...prev, verificationCode: '' }))
                          setCharacterState('idle')
                        }}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs transition-all duration-300 border border-white/20 hover:border-white/30"
                      >
                        تغییر شماره
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Additional Links */}
            <div className="mt-4 space-y-3">
              <div className="text-center">
                <p className="text-gray-300 text-xs">
                  قبلاً حساب کاربری دارید؟{' '}
                  <Link href="/login" className="text-green-300 hover:text-green-200 font-medium transition-colors">
                    وارد شوید
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <Link 
                  href="/" 
                  className="text-gray-400 hover:text-white transition-colors text-xs flex items-center justify-center"
                >
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  بازگشت به صفحه اصلی
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
