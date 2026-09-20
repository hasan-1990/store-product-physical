'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, Shield, Sparkles, Smartphone, Eye, EyeOff, Lock } from 'lucide-react';
import Link from 'next/link';

type ResetMethod = 'email' | 'phone';
type PhoneStep = 'input' | 'verify' | 'change-password';

export default function ForgotPassword() {
  const [resetMethod, setResetMethod] = useState<ResetMethod>('phone');
  
  // Email state
  const [email, setEmail] = useState('');
  
  // Phone state
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارسال درخواست');
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'خطا در ارسال لینک بازیابی');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, isAdmin: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارسال کد تایید');
      }

      setPhoneStep('verify');
    } catch (error: any) {
      setError(error.message || 'خطا در ارسال کد تایید');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'کد تایید نامعتبر است');
      }

      setPhoneStep('change-password');
    } catch (error: any) {
      setError(error.message || 'کد تایید نامعتبر است');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در تغییر رمز عبور');
      }

      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'خطا در تغییر رمز عبور');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 4 + 1 + 'px',
                height: Math.random() * 4 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Login Form */}
      <motion.div
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/50"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
            بازیابی رمز عبور
          </h1>
          <p className="text-gray-400">ایمیل خود را وارد کنید</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          variants={itemVariants}
        >
          {!success ? (
            <>
              {/* Method Tabs */}
              <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    setError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    resetMethod === 'email'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  ایمیل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('phone');
                    setError('');
                    setPhoneStep('input');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    resetMethod === 'phone'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  موبایل
                </button>
              </div>

              {/* Email Form */}
              {resetMethod === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Email Input */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ایمیل
                </label>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="admin@example.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <>
                    <span>ارسال لینک بازیابی</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <motion.div
                variants={itemVariants}
                className="text-center"
              >
                <Link
                  href="/admin/login"
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors inline-flex items-center gap-2"
                >
                  بازگشت به صفحه ورود
                </Link>
              </motion.div>
                </form>
              )}

              {/* Phone Form */}
              {resetMethod === 'phone' && (
                <>
                  {/* Step 1: Enter Phone Number */}
                  {phoneStep === 'input' && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          شماره موبایل مدیر
                        </label>
                        <div className="relative group">
                          <Smartphone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="09123456789"
                            required
                            disabled={isLoading}
                            dir="ltr"
                          />
                        </div>
                      </motion.div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>در حال ارسال...</span>
                          </>
                        ) : (
                          <>
                            <span>ارسال کد تایید</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </motion.button>

                      <motion.div variants={itemVariants} className="text-center">
                        <Link
                          href="/admin/login"
                          className="text-sm text-purple-300 hover:text-purple-200 transition-colors inline-flex items-center gap-2"
                        >
                          بازگشت به صفحه ورود
                        </Link>
                      </motion.div>
                    </form>
                  )}

                  {/* Step 2: Verify Code */}
                  {phoneStep === 'verify' && (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                      <div className="text-center mb-4">
                        <p className="text-gray-300 text-sm">
                          کد تایید به شماره <span className="font-bold text-white">{phone}</span> ارسال شد
                        </p>
                      </div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          کد تایید
                        </label>
                        <div className="relative group">
                          <Shield className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="----"
                            required
                            disabled={isLoading}
                            maxLength={4}
                            dir="ltr"
                          />
                        </div>
                      </motion.div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isLoading || verificationCode.length !== 4}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>در حال بررسی...</span>
                          </>
                        ) : (
                          <span>تایید کد</span>
                        )}
                      </motion.button>

                      <motion.div variants={itemVariants} className="text-center">
                        <button
                          type="button"
                          onClick={() => setPhoneStep('input')}
                          className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                        >
                          تغییر شماره موبایل
                        </button>
                      </motion.div>
                    </form>
                  )}

                  {/* Step 3: Change Password */}
                  {phoneStep === 'change-password' && (
                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-2">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-gray-300 text-sm">
                          کد تایید صحیح است. رمز عبور جدید را وارد کنید
                        </p>
                      </div>

                      {/* New Password */}
                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          رمز عبور جدید
                        </label>
                        <div className="relative group">
                          <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pr-12 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="حداقل ۸ کاراکتر"
                            required
                            disabled={isLoading}
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>

                      {/* Confirm Password */}
                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          تکرار رمز عبور
                        </label>
                        <div className="relative group">
                          <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pr-12 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="تکرار رمز عبور"
                            required
                            disabled={isLoading}
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </motion.div>

                      {/* Password Strength */}
                      {newPassword.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <span className={newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'}>
                              حداقل ۸ کاراکتر
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${newPassword === confirmPassword && newPassword.length > 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <span className={newPassword === confirmPassword && newPassword.length > 0 ? 'text-green-400' : 'text-gray-400'}>
                              مطابقت رمز عبور
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>در حال تغییر رمز...</span>
                          </>
                        ) : (
                          <span>تغییر رمز عبور</span>
                        )}
                      </motion.button>
                    </form>
                  )}
                </>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              
              {resetMethod === 'email' ? (
                <>
                  <h2 className="text-2xl font-bold text-white">
                    لینک بازیابی ارسال شد
                  </h2>
                  
                  <p className="text-gray-300">
                    لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.
                  </p>
                  
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-200 text-sm">
                    <p className="font-medium mb-1">⏱️ توجه:</p>
                    <p>لینک بازیابی فقط ۱ ساعت اعتبار دارد.</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white">
                    رمز عبور با موفقیت تغییر کرد
                  </h2>
                  
                  <p className="text-gray-300">
                    رمز عبور شما با موفقیت تغییر یافت. اکنون می‌توانید با رمز عبور جدید وارد شوید.
                  </p>
                  
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm">
                    <p className="font-medium">✅ رمز عبور جدید فعال شد</p>
                  </div>
                </>
              )}

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
              >
                بازگشت به صفحه ورود
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </motion.div>
    </div>
  );
}
