'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';

interface CartDropdownProps {
  userId?: string;
}

const CartIcon = ({ userId }: CartDropdownProps) => {
  // تمام hooks در ابتدا و بدون شرط فراخوانی می‌شوند
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize sessionId from localStorage immediately
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    if (userId) return undefined; // Don't need sessionId if we have userId

    let id = localStorage.getItem('cart_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', id);
    }
    return id;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // hook useCart همیشه فراخوانی می‌شود
  const { cartItems, itemCount, subtotal, removeItem, refreshCart } = useCart({ userId, sessionId });

  // Store refreshCart in a ref to avoid dependency issues
  const refreshCartRef = useRef(refreshCart);
  useEffect(() => {
    refreshCartRef.current = refreshCart;
  }, [refreshCart]);

  // تمام useEffect ها همیشه فراخوانی می‌شوند
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-load cart on mount
  useEffect(() => {
    if (!mounted) return;
    
    // Load cart immediately on mount
    refreshCartRef.current();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleCartUpdate = () => {
      // Use ref to avoid dependency on refreshCart
      refreshCartRef.current();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [mounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsHovering(false);
      }
    };

    if (mounted) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mounted]);

  // فقط rendering شرطی داریم، نه hooks شرطی
  if (!mounted) {
    return (
      <Link href="/cart" className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 6H4m4 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
      </Link>
    );
  }

  // Handle mouse enter
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovering(true);
    setIsOpen(true);
  };

  // Handle mouse leave - تاخیر بیشتر برای بسته شدن
  const handleMouseLeave = () => {
    setIsHovering(false);
    // تاخیر 300ms برای بسته شدن
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <div 
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cart Icon */}
      <Link
        href="/cart"
        className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 6H4m4 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
        </svg>

        {/* Badge */}
        {itemCount > 0 && (
          <span className="absolute  button-2 top-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Link>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 sm:w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] transform transition-all duration-200 ease-out opacity-100 scale-100">
          {/* Header */}
          <div className="p-2.5 sm:p-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 6H4m4 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="text-sm">سبد خرید</span>
              <span className="text-xs text-purple-600 font-normal">({itemCount})</span>
            </h3>
          </div>

          {/* Content */}
          <div className="max-h-36 sm:max-h-55 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 6H4m4 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-gray-600 font-semibold text-xs">سبد خرید خالی است</p>
                <p className="text-gray-400 text-[10px] mt-0.5">محصولی اضافه نکردید</p>
              </div>
            ) : (
              <div className="p-2">
                {cartItems.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 border-b border-gray-100 last:border-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {item.image && item.image !== 'null' && item.image.trim() !== '' ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image load error:', item.image);
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-2">{item.name}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {item.quantity} عدد
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {formatPrice(item.price * item.quantity)} تومان
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await removeItem(item.id);
                      }}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      title="حذف از سبد خرید"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-purple-50 rounded-b-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">مجموع:</span>
                <span className="text-base font-bold text-purple-600">{formatPrice(subtotal)} تومان</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  className="px-3 py-2 text-xs sm:text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 text-center shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  مشاهده سبد
                </Link>
                <Link
                  href="/checkout"
                  className="px-3 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-center shadow-lg hover:shadow-xl"
                  onClick={() => setIsOpen(false)}
                >
                  تسویه حساب
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartIcon;
