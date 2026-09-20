'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { validateMobileWithMessage } from '@/utils/mobile-validation'
import { validateEmail, validatePassword } from '@/utils'

// WordPress Character Component
const WordPressCharacter = ({ state = 'idle' }) => {
  const getCharacterAnimation = () => {
    switch (state) {
      case 'loading':
        return {
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
          y: [0, -5, 0]
        }
      case 'success':
        return {
          scale: [1, 1.3, 1],
          rotate: [0, 360, 0],
          y: [0, -20, 0]
        }
      case 'error':
        return {
          rotate: [0, -10, 10, -5, 5, 0],
          scale: [1, 0.9, 1]
        }
      case 'thinking':
        return {
          y: [0, -3, 0],
          scale: [1, 1.05, 1]
        }
      case 'happy':
        return {
          scale: [1, 1.2, 1],
          y: [0, -10, 0]
        }
      default:
        return {
          y: [0, -2, 0],
          scale: [1, 1.02, 1]
        }
    }
  }

  const getCharacterEmoji = () => {
    switch (state) {
      case 'loading': return '⚡'
      case 'success': return '🎉'
      case 'error': return '😰'
      case 'thinking': return '🤔'
      case 'happy': return '😊'
      default: return '🎨'
    }
  }

  return (
    <motion.div
      className="relative w-12 h-12 mx-auto mb-6"
      animate={getCharacterAnimation()}
      transition={{ 
        duration: state === 'loading' ? 0.8 : 2,
        repeat: state === 'loading' ? Infinity : state === 'thinking' ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {/* Main Character - کوچکتر شده */}
      <motion.div
        className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl shadow-lg border-3 border-white/30"
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

      {/* Floating Icons */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {[
          { icon: '🎨', position: 'top-0 left-0' },
          { icon: '⚡', position: 'top-0 right-0' },
          { icon: '🛍️', position: 'bottom-0 left-0' },
          { icon: '📱', position: 'bottom-0 right-0' }
        ].map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.position} w-6 h-6 text-sm flex items-center justify-center`}
            animate={{ 
              y: [0, -5, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              delay: i * 0.5,
              repeat: Infinity 
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: ''
  })
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState('email')
  const [rememberMe, setRememberMe] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [characterState, setCharacterState] = useState('idle')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    const message = searchParams?.get('message')
    if (message === 'register_success') {
      setCharacterState('happy')
      setTimeout(() => setCharacterState('idle'), 3000)
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (loginMethod === 'email') {
      // ✅ Email Validation پیشرفته
      if (!formData.email) {
        newErrors.email = 'آدرس ایمیل الزامی است'
      } else {
        const emailResult = validateEmail(formData.email, { allowTempEmails: false });
        if (!emailResult.isValid) {
          newErrors.email = emailResult.error || 'ایمیل نامعتبر است';
        }
      }

      // ✅ Password Validation پیشرفته
      if (!formData.password) {
        newErrors.password = 'رمز عبور الزامی است'
      } else {
        const passResult = validatePassword(formData.password);
        if (!passResult.isValid) {
          newErrors.password = passResult.error || 'رمز عبور نامعتبر است';
        }
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = 'شماره موبایل الزامی است'
      } else {
        // استفاده از سیستم اعتبارسنجی بهبود یافته
        try {
          // import در بالای فایل انجام می‌شود
          const validation = validateMobileWithMessage(formData.phone);
          if (!validation.isValid) {
            newErrors.phone = validation.message;
          }
        } catch {
          // fallback به روش قدیمی
          if (!/^09\d{9}$/.test(formData.phone)) {
            newErrors.phone = 'شماره موبایل ایرانی معتبر وارد کنید (مثال: 09123456789)';
          }
        }
      }

      if (otpSent && !formData.otp) {
        newErrors.otp = 'کد تایید الزامی است'
      } else if (otpSent && formData.otp.length !== 4) {
        newErrors.otp = 'کد تایید باید ۴ رقم باشد'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    setCharacterState('thinking')
    setTimeout(() => setCharacterState('idle'), 1000)
  }

  const sendOtp = async () => {
    if (!formData.phone || !/^09\d{9}$/.test(formData.phone)) {
        setErrors({ phone: 'شماره موبایل صحیح وارد کنید' })
      setCharacterState('error')
      setTimeout(() => setCharacterState('idle'), 2000)
      return
    }

    setIsSubmitting(true)
    setCharacterState('loading')
    
    try {
      const response = await fetch('/api/auth/send-login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone }),
      })

      if (response.ok) {
        setOtpSent(true)
        setCountdown(120)
        setCharacterState('success')
        setTimeout(() => setCharacterState('idle'), 2000)
      } else {
        const errorData = await response.json()
        setErrors({ phone: errorData.error || 'خطا در ارسال کد تایید' })
        setCharacterState('error')
        setTimeout(() => setCharacterState('idle'), 2000)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      setErrors({ phone: 'خطا در ارسال کد تایید' })
      setCharacterState('error')
      setTimeout(() => setCharacterState('idle'), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setCharacterState('error')
      setTimeout(() => setCharacterState('idle'), 2000)
      return
    }

    setIsSubmitting(true)
    setCharacterState('loading')

    try {
      if (loginMethod === 'email') {
        // Email login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            rememberMe
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setCharacterState('success')

          // API returns { success: true, data: { user, token } }
          const user = data.data?.user || data.user
          const token = data.data?.token || data.token

          if (!user) {
            console.error('No user data received:', data)
            setErrors({ email: 'خطا در دریافت اطلاعات کاربر' })
            setCharacterState('error')
            setTimeout(() => setCharacterState('idle'), 2000)
            return
          }

          // ذخیره در localStorage
          localStorage.setItem('user', JSON.stringify(user))
          if (token) {
            localStorage.setItem('token', token)
          }

          if (user.role === 'admin') {
            setTimeout(() => router.push('/admin'), 1000)
          } else {
            // Redirect to profile page for regular users
            setTimeout(() => router.push('/profile'), 1000)
          }
        } else {
          const errorData = await response.json()
          setErrors({ 
            email: errorData.error || 'ایمیل یا رمز عبور اشتباه است' 
          })
          setCharacterState('error')
          setTimeout(() => setCharacterState('idle'), 2000)
        }
      } else {
        // Phone OTP login
        if (!otpSent) {
          await sendOtp()
        } else {
          const response = await fetch('/api/auth/verify-login-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: formData.phone,
              otp: formData.otp
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setCharacterState('success')
            
            // Save user data to localStorage
            if (data.success && data.data) {
              localStorage.setItem('user', JSON.stringify(data.data.user))
              if (data.data.token) {
                localStorage.setItem('token', data.data.token)
              }
              
              if (data.data.user.role === 'admin') {
                setTimeout(() => router.push('/admin'), 1000)
              } else {
                setTimeout(() => router.push('/profile'), 1000)
              }
            }
          } else {
            const errorData = await response.json()
            setErrors({ 
              otp: errorData.error || 'کد تایید اشتباه است' 
            })
            setCharacterState('error')
            setTimeout(() => setCharacterState('idle'), 2000)
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ 
        general: 'خطا در برقراری ارتباط با سرور' 
      })
      setCharacterState('error')
      setTimeout(() => setCharacterState('idle'), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, #4c1d95 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, #1e293b 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, #7c3aed 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
        >
          {/* Glassmorphism Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl" />
          
          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Character */}
            <WordPressCharacter state={characterState} />

            {/* Header */}
            <div className="text-center mb-6">
              <motion.h2 
                className="text-2xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                🎨 ورود به پنل
              </motion.h2>
              <motion.p 
                className="text-white/80 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                به مجموعه قالب و افزونه وردپرس خوش آمدید
              </motion.p>
            </div>

            {/* Login Method Selector */}
            <div className="mb-8">
              <motion.div 
                className="flex bg-white/10 rounded-2xl p-2 border border-white/20"
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email')
                    setOtpSent(false)
                    setCountdown(0)
                    setErrors({})
                    setCharacterState('thinking')
                  }}
                  className={`flex-1 py-4 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                    loginMethod === 'email'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-xl mr-2">📧</span>
                    ورود با ایمیل
                  </div>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setLoginMethod('phone')
                    setOtpSent(false)
                    setCountdown(0)
                    setErrors({})
                    setCharacterState('thinking')
                  }}
                  className={`flex-1 py-4 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                    loginMethod === 'phone'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-xl mr-2">📱</span>
                    کد یکبار مصرف
                  </div>
                </motion.button>
              </motion.div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {loginMethod === 'email' ? (
                  <motion.div
                    key="email-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-white/90 text-sm font-medium">
                        📧 آدرس ایمیل
                      </label>
                      <motion.div 
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pr-4 pl-4 py-4 bg-white/20 border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm ${
                            errors.email 
                              ? 'border-red-400/50 focus:border-red-400' 
                              : 'border-white/30 focus:border-blue-400/50 hover:border-white/50'
                          }`}
                          placeholder="نام@example.com"
                        />
                      </motion.div>
                      <AnimatePresence>
                        {errors.email && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center mt-2"
                          >
                            <span className="text-lg mr-2">😞</span>
                            <p className="text-red-300 text-sm">{errors.email}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-white/90 text-sm font-medium">
                        🔒 رمز عبور
                      </label>
                      <motion.div 
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full pr-4 pl-12 py-4 bg-white/20 border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm ${
                            errors.password 
                              ? 'border-red-400/50 focus:border-red-400' 
                              : 'border-white/30 focus:border-blue-400/50 hover:border-white/50'
                          }`}
                          placeholder="رمز عبور خود را وارد کنید"
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <span className="text-lg">
                            {showPassword ? '🙈' : '👁️'}
                          </span>
                        </motion.button>
                      </motion.div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center mt-2"
                          >
                            <span className="text-lg mr-2">😞</span>
                            <p className="text-red-300 text-sm">{errors.password}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="phone-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Phone Field */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-white/90 text-sm font-medium">
                        📱 شماره موبایل
                      </label>
                      <motion.div 
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full pr-4 pl-4 py-4 bg-white/20 border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm ${
                            errors.phone 
                              ? 'border-red-400/50 focus:border-red-400' 
                              : 'border-white/30 focus:border-blue-400/50 hover:border-white/50'
                          }`}
                          placeholder="09xxxxxxxxx"
                          disabled={otpSent}
                        />
                      </motion.div>
                      <AnimatePresence>
                        {errors.phone && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center mt-2"
                          >
                            <span className="text-lg mr-2">😞</span>
                            <p className="text-red-300 text-sm">{errors.phone}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* OTP Field */}
                    <AnimatePresence>
                      {otpSent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <label htmlFor="otp" className="block text-white/90 text-sm font-medium">
                            🔐 کد تایید
                          </label>
                          <div className="flex gap-3">
                            <motion.div 
                              className="relative flex-1"
                              whileFocus={{ scale: 1.02 }}
                            >
                              <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={formData.otp}
                                onChange={handleInputChange}
                                className={`w-full pr-4 pl-4 py-4 bg-white/20 border rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm text-center text-lg tracking-widest ${
                                  errors.otp 
                                    ? 'border-red-400/50 focus:border-red-400' 
                                    : 'border-white/30 focus:border-blue-400/50 hover:border-white/50'
                                }`}
                                placeholder="- - - -"
                                maxLength={4}
                              />
                            </motion.div>
                            {countdown > 0 ? (
                              <motion.div 
                                className="flex items-center px-6 py-4 bg-white/10 border border-white/30 rounded-2xl backdrop-blur-sm"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <div className="flex items-center">
                                  <span className="text-xl mr-2">⏰</span>
                                  <span className="text-white/90 text-sm font-mono">
                                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                  </span>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.button
                                type="button"
                                onClick={sendOtp}
                                disabled={isSubmitting}
                                className="px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl text-sm font-medium transition-all duration-300 disabled:opacity-50 backdrop-blur-sm border border-white/20 hover:border-white/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="mr-2">🔄</span>
                                ارسال مجدد
                              </motion.button>
                            )}
                          </div>
                          <AnimatePresence>
                            {errors.otp && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center mt-2"
                              >
                                <span className="text-lg mr-2">😞</span>
                                <p className="text-red-300 text-sm">{errors.otp}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember Me - Only for email login */}
              <AnimatePresence>
                {loginMethod === 'email' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between pt-2"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2 backdrop-blur-sm"
                      />
                      <label htmlFor="rememberMe" className="mr-3 text-white/90 text-sm">
                        مرا به خاطر بسپار
                      </label>
                    </div>
                    <Link href="/forgot-password" className="text-orange-300 hover:text-orange-200 text-sm transition-colors">
                      فراموشی رمز عبور
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl font-medium text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={characterState === 'loading' ? { 
                  background: ['linear-gradient(45deg, #f97316, #ec4899)', 'linear-gradient(45deg, #ec4899, #8b5cf6)', 'linear-gradient(45deg, #8b5cf6, #f97316)']
                } : {}}
                transition={{ duration: 1, repeat: characterState === 'loading' ? Infinity : 0 }}
              >
                <div className="relative z-10 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="text-xl mr-3"
                        >
                          ⚡
                        </motion.span>
                        در حال پردازش...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <span className="text-xl mr-3">
                          {loginMethod === 'phone' && !otpSent ? '📱' :
                           loginMethod === 'phone' && otpSent ? '🔐' : '🚀'}
                        </span>
                        {loginMethod === 'phone' && !otpSent ? 'دریافت کد تایید' :
                         loginMethod === 'phone' && otpSent ? 'ورود با کد تایید' : 'ورود'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </form>

            {/* Footer Links */}
            <motion.div 
              className="mt-8 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <p className="text-white/80 text-sm">
                  حساب کاربری ندارید؟{' '}
                  <Link href="/register" className="text-orange-300 hover:text-orange-200 font-medium transition-colors">
                    ثبت‌نام کنید
                  </Link>
                </p>
              </div>

              <div className="flex justify-center space-x-6 space-x-reverse">
                <Link 
                  href="/forgot-password" 
                  className="text-pink-300 hover:text-pink-200 transition-colors text-sm flex items-center"
                >
                  <span className="text-lg ml-2">🔑</span>
                  بازیابی رمز عبور
                </Link>
                
                <Link 
                  href="/" 
                  className="text-white/70 hover:text-white transition-colors text-sm flex items-center"
                >
                  <span className="text-lg ml-2">🏠</span>
                  بازگشت به صفحه اصلی
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}