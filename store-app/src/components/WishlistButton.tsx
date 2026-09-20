'use client';

import React, { useState, useEffect } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  className = '',
  showText = false,
  size = 'md'
}) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('لطفا ابتدا وارد حساب کاربری خود شوید');
      return;
    }

    const wasInWishlist = inWishlist;
    setIsLoading(true);
    try {
      if (wasInWishlist) {
        await removeFromWishlist(productId);
        setAlertMessage('از علاقه‌مندی‌ها حذف شد');
      } else {
        await addToWishlist(productId);
        setAlertMessage('به علاقه‌مندی‌ها اضافه شد');
      }

      // Show alert animation
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-full
          transition-all duration-300
          ${inWishlist
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-50 hover:text-red-500'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
          ${className}
        `}
        title={inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        aria-label={inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      >
        {isLoading ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : inWishlist ? (
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {showText && (
          <span className="mr-2 text-sm font-medium">
            {inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          </span>
        )}
      </button>

      {/* Toast Notification - Fixed to top-right corner */}
      {showAlert && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes wishlistSlideIn {
              from { opacity: 0; transform: translateX(100%); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}} />
          <div
            className={`
              fixed top-5 right-5 z-[9999]
              px-6 py-3 rounded-lg shadow-2xl
              text-sm font-bold text-white whitespace-nowrap
              flex items-center gap-3
              ${alertMessage.includes('اضافه') ? 'bg-green-500' : 'bg-red-500'}
            `}
            style={{
              animation: 'wishlistSlideIn 0.3s ease-out forwards'
            }}
          >
            <span className="text-xl">{alertMessage.includes('اضافه') ? '✓' : '✗'}</span>
            <span>{alertMessage}</span>
          </div>
        </>
      )}
    </>
  );
};

export default WishlistButton;
