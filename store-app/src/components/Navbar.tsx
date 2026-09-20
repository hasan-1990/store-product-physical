'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AjaxSearchBar from './AjaxSearchBar';
import MegaMenu from './MegaMenu';
import CartIcon from './CartIcon';
import UserMenu from './UserMenu';
import { useCartContext } from '@/contexts/CartContext';
import HiddenSEOContent from '@/components/SEO/HiddenSEOContent';

const Navbar = () => {
  // تمام hooks در ابتدا فراخوانی می‌شوند
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('فروشگاه');
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { itemCount } = useCartContext();

  // تمام useEffect ها همیشه فراخوانی می‌شوند
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Get userId from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.id && /^[0-9a-fA-F]{24}$/.test(userData.id)) {
          setUserId(userData.id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.site_name) {
            setSiteName(result.data.site_name);
          }
        }
      } catch (error) {
        console.error('Error fetching site name:', error);
      }
    };

    fetchSettings();
  }, [mounted]);

  // فقط rendering شرطی داریم
  if (!mounted) {
    return (
      <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl backdrop-blur-md border-b border-purple-500/20 relative z-[9998]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 min-h-[80px]">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  فروشگاه
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl backdrop-blur-md border-b border-purple-500/20 relative z-[9998]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 min-h-[80px]">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {siteName}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation + MegaMenu */}
            <div className="hidden lg:flex items-center gap-1">
                <Link href="/" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm">
                  خانه
                </Link>
                <Link href="/products" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm">
                  محصولات
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm">
                  درباره ما
                </Link>
                
                {/* MegaMenu Trigger */}
                <div className="relative">
                  <MegaMenu />
                </div>
            </div>

            {/* Search Bar - بخش جستجو با AJAX */}
            <div className="flex-1 max-w-xl mx-8 relative hidden lg:block" style={{ minWidth: '300px' }}>
              <AjaxSearchBar />
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4">
              {/* Cart Icon with Dropdown */}
              <CartIcon userId={userId} />

              {/* User Menu with Dropdown */}
              <UserMenu />

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-purple-500/20">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-gradient-to-b from-slate-900/95 to-purple-900/95 backdrop-blur-md">
              {/* Search bar for mobile - بخش جستجو موبایل */}
              <div className="mb-4">
                <AjaxSearchBar />
              </div>
              
              <Link href="/" className="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200">
                خانه
              </Link>
              <Link href="/products" className="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200">
                محصولات
              </Link>
              
              {/* MegaMenu برای موبایل */}
              <div className="mb-4">
                <MegaMenu />
              </div>
              
              <Link href="/about" className="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200">
                درباره ما
              </Link>
              <Link href="/cart" className="flex items-center justify-between text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200">
                سبد خرید
                {itemCount > 0 && (
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link href="/user" className="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200">
                حساب کاربری
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
