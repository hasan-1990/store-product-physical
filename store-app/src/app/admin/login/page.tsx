'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Step 1: Attempting login with:', email);
      
      // استفاده از NextAuth signIn
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('✅ Step 2: SignIn result:', JSON.stringify(result));

      if (result?.error) {
        console.error('❌ Step 3: Login failed with error:', result.error);
        setError('ایمیل یا رمز عبور اشتباه است');
        setIsLoading(false);
        return;
      }
      
      if (result?.ok) {
        console.log('✅ Step 3: Login successful! Setting localStorage...');
        
        // Create a fake but valid JWT structure for admin layout
        const fakeJWT = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
                       btoa(JSON.stringify({ email: email, role: 'admin', exp: Math.floor(Date.now() / 1000) + 86400 })) + '.' +
                       btoa('signature');
        
        const userData = {
          email: email,
          role: 'admin',
          name: 'ادمین'
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', fakeJWT);
        localStorage.setItem('admin_authenticated', 'true');
        
        console.log('✅ Step 4: localStorage set:', {
          user: localStorage.getItem('user'),
          token: localStorage.getItem('token')?.substring(0, 50) + '...'
        });
        
        console.log('✅ Step 5: Redirecting to /admin...');
        
        // Use router.push instead of window.location
        router.push('/admin');
        return;
      }
      
      console.warn('⚠️ Step 3: Unexpected result (no error, no ok):', result);
      setError('خطای نامشخص در ورود');
      setIsLoading(false);
      
    } catch (error) {
      console.error('💥 Exception during login:', error);
      setError('خطا در ورود به سیستم');
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dark background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Dark Container */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-gray-700">
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              variants={itemVariants}
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4 shadow-md"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                پنل مدیریت
              </h1>
              <p className="text-gray-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                ورود به داشبورد ادمین
                <Sparkles className="w-4 h-4" />
              </p>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="admin@example.com"
                    required
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      در حال ورود...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5" />
                      ورود به پنل
                    </div>
                  )}
                </motion.button>
              </motion.div>

              {/* Forgot Password Link */}
              <motion.div variants={itemVariants} className="text-center">
                <Link
                  href="/admin/forgot-password"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>رمز عبور خود را فراموش کرده‌اید؟</span>
                </Link>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              className="mt-8 text-center text-gray-500 text-sm"
              variants={itemVariants}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                سیستم امن شده با NextAuth.js
              </div>
              <p>© 2025 فروشگاه هاب - پنل مدیریت</p>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-xl"></div>
        </div>

        {/* Bottom Glow */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-20 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </motion.div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}