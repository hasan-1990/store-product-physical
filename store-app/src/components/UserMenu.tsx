'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import ProfileHeader from './ProfileHeader';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const [customUser, setCustomUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for custom auth user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCustomUser(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
    setLoading(false);
  }, []);

  // اگر در حال بارگذاری باشد
  if (status === 'loading' || loading) {
    return (
      <div className="p-2 text-gray-300">
        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }

  // اگر هیچ کدام لاگین نکرده باشد
  if (!session && !customUser) {
    return (
      <Link 
        href="/login" 
        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    );
  }

  // Get user data from either NextAuth session or custom auth
  const user = session?.user || customUser;
  const userName = user?.name || user?.email?.split('@')[0] || 'کاربر';

  // اگر لاگین کرده باشد
  return (
    <div 
      className="relative"
      onMouseEnter={() => {
        console.log('Mouse entered - opening menu');
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        console.log('Mouse left - closing menu');
        setIsOpen(false);
      }}
    >
      {/* User Icon Button */}
      <button
        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 relative"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        
        {/* نشانگر لاگین */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-slate-800"></span>
      </button>

      {/* Bridge - فاصله بین آیکون و منو */}
      {isOpen && <div className="absolute top-full left-0 right-0 h-2"></div>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-1 w-72 bg-slate-800/95 backdrop-blur-md border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 pt-1"
        >
          {/* Header با ProfileHeader کامپوننت */}
          <ProfileHeader user={user} compact={true} />

          {/* Menu Items */}
          <div className="py-2">
            {/* داشبورد کاربری */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 ml-3 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>داشبورد کاربری</span>
            </Link>

            {/* سفارشات */}
            <Link
              href="/profile/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 ml-3 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>سفارشات</span>
            </Link>

            {/* دانلودها */}
            <Link
              href="/profile/downloads"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 ml-3 text-green-400 group-hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>دانلودها</span>
            </Link>

            {/* خط جداکننده */}
            <div className="my-2 border-t border-purple-500/20"></div>

            {/* خروج */}
            <button
              onClick={async () => {
                setIsOpen(false);
                
                // Logout from both NextAuth and Custom Auth
                if (session) {
                  await signOut({ callbackUrl: '/' });
                }
                
                if (customUser) {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }
              }}
              className="w-full flex items-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>خروج از حساب</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
