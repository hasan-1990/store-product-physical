'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';

const CartPage = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check if user is logged in (you can modify this based on your auth system)
  useEffect(() => {
    // Example: Get user from localStorage or session
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        // Only set userId if it's a valid ObjectId (24 hex characters)
        if (userData.id && /^[0-9a-fA-F]{24}$/.test(userData.id)) {
          setUserId(userData.id);
        }
        // No need to log anything - guest cart is normal behavior
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const {
    cartItems,
    loading,
    error,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  } = useCart({ userId });
  // نرخ مالیات را از تنظیمات عمومی دریافت کن
  const [taxRate, setTaxRate] = useState<number>(0.09); // مقدار پیش‌فرض 9%
  useEffect(() => {
    fetch('/api/public-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.taxRate !== undefined) {
          // استفاده از تبدیل صحیح و پشتیبانی از 0
          setTaxRate(Number(data.data.taxRate) / 100);
        }
      })
      .catch((error) => {
        console.error('Error fetching tax rate:', error);
      });
  }, []);

  // Auto-refresh cart when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCart();
    }, 100);
    return () => clearTimeout(timer);
  }, [refreshCart]);

  // Show error message if exists
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      const result = await removeItem(id);
      if (!result.success) {
        setErrorMessage(result.error || 'خطا در حذف محصول');
      }
      return;
    }
    
    const result = await updateQuantity(id, newQuantity);
    if (!result.success) {
      setErrorMessage(result.error || 'خطا در بروزرسانی تعداد');
    }
  };

  const handleRemoveItem = async (id: string) => {
    const result = await removeItem(id);
    if (!result.success) {
      setErrorMessage(result.error || 'خطا در حذف محصول');
    }
  };

  const tax = subtotal * taxRate; // محاسبه مالیات بر اساس نرخ از تنظیمات
  const shipping = subtotal > 1000000 ? 0 : 50000; // ارسال رایگان بالای 1,000,000 تومان
  const total = subtotal + tax + shipping;

  // Show loading state
  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-white mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">در حال بارگذاری سبد خرید...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H17M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6M7 13H5.4M17 13v6M9 19v2M15 19v2" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">سبد خرید شما خالی است</h2>
            <p className="text-gray-400 mb-8">محصولات شگفت‌انگیز اضافه کنید تا شروع کنید!</p>
            <Link 
              href="/products" 
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-medium inline-flex items-center space-x-2 space-x-reverse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>ادامه خرید</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-center">{errorMessage}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">سبد خرید</h1>
          <p className="text-gray-400">{itemCount} {itemCount === 1 ? 'آیتم' : 'آیتم'} در سبد خرید شما</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="xl:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Product Image */}
                    {item.image && (
                      <div className="flex-shrink-0">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-purple-400 mb-2">{item.category}</p>
                      )}
                      
                      {/* Variations */}
                      {(item.color || item.size) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.color && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs">
                              رنگ: {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs">
                              سایز: {item.size}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center space-x-2 space-x-reverse mb-3">
                        <span className="text-xl font-bold text-purple-400">{item.price.toLocaleString('fa-IR')} تومان</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">{item.originalPrice.toLocaleString('fa-IR')} تومان</span>
                            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% تخفیف
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex flex-col sm:items-end space-y-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-white font-medium bg-slate-800 py-1 rounded">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading || item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>

                      {/* Stock Warning */}
                      {item.quantity >= item.stock && (
                        <p className="text-xs text-yellow-400">
                          حداکثر موجودی: {item.stock}
                        </p>
                      )}

                      {/* Item Total */}
                      <div className="text-left">
                        <p className="text-sm text-gray-400">مجموع آیتم</p>
                        <p className="text-lg font-bold text-white">{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm flex items-center space-x-1 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8">
              <Link 
                href="/products" 
                className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center space-x-2 space-x-reverse transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" />
                </svg>
                <span>ادامه خرید</span>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-6">خلاصه سفارش</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">جمع کل ({itemCount} آیتم)</span>
                  <span className="text-white font-medium">{subtotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">هزینه ارسال</span>
                  <span className="text-white font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-400">رایگان</span>
                    ) : (
                      `${shipping.toLocaleString('fa-IR')} تومان`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">مالیات ({(taxRate * 100).toLocaleString('fa-IR')}٪)</span>
                  <span className="text-white font-medium">{tax.toLocaleString('fa-IR')} تومان</span>
                </div>
                
                <div className="border-t border-purple-500/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">مجموع کل</span>
                    <span className="text-xl font-bold text-purple-400">{total.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              {/* Free Shipping Notice */}
              {shipping > 0 && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    💡 <span className="font-bold">{(1000000 - subtotal).toLocaleString('fa-IR')} تومان</span> دیگر اضافه کنید تا ارسال رایگان شود!
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 space-x-reverse"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>ادامه تا پرداخت</span>
              </Link>

              {/* Security Notice */}
              <div className="mt-4 flex items-center justify-center text-sm text-gray-400">
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>پرداخت امن و رمزگذاری شده</span>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-purple-500/20">
                <p className="text-sm text-white mb-3">روش‌های پرداخت:</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* بانک ملت */}
                  <div className="w-16 h-16 rounded p-1 flex items-center justify-center">
                    <Image 
                      src="/images/banks/Bank_Mellat.png" 
                      alt="بانک ملت" 
                      width={56} 
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* بانک ملی ایران */}
                  <div className="w-16 h-16 rounded p-1 flex items-center justify-center">
                    <Image 
                      src="/images/banks/Bank_Melli.png" 
                      alt="بانک ملی ایران" 
                      width={56} 
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* زرین پال */}
                  <div className="w-20 h-16 rounded flex items-center justify-center">
                    <Image 
                      src="/images/banks/zarinpal.png" 
                      alt="زرین پال" 
                      width={50} 
                      height={75}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
