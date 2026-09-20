'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useURLSettings } from '@/contexts/URLSettingsContext';

interface WishlistProduct {
  _id: string;
  productId: string;
  userId: string;
  createdAt: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    sequentialId?: number;
    price: number;
    discountPrice?: number;
    imageUrl: string;
    stock?: number;
    isAvailable?: boolean;
    category?: {
      _id: string;
      name: string;
      slug: string;
    };
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { generateProductUrl } = useURLSettings();
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchWishlist();
  }, [router]);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data.wishlist || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('آیا از حذف این محصول از لیست علاقه‌مندی‌ها مطمئن هستید؟')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/wishlist/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchWishlist();
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === product._id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product._id,
          name: product.name,
          price: product.discountPrice || product.price,
          image: product.imageUrl,
          quantity: 1
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      alert('محصول به سبد خرید اضافه شد');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
        <div className="container mx-auto px-1">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <svg className="w-8 h-8 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  لیست علاقه‌مندی‌های من
                </h1>
                <p className="text-gray-600 mt-2">محصولات مورد علاقه شما</p>
              </div>
            </div>
            <div className="text-purple-600 font-bold text-2xl">
              {wishlist.length} محصول
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لیست علاقه‌مندی‌های شما خالی است</h3>
            <p className="text-gray-600 mb-6">محصولات مورد علاقه خود را با کلیک روی قلب اضافه کنید</p>
            <Link
              href="/products"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {wishlist.map((item) => (
              <div key={item._id} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                {/* Product Image */}
                <div className="relative h-40 bg-gray-100">
                  <Link href={generateProductUrl(item.product, item.product.category)}>
                    <Image
                      src={item.product.imageUrl || '/placeholder.jpg'}
                      alt={item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                  
                  {/* Discount Badge */}
                  {item.product.discountPrice && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {Math.round(((item.product.price - item.product.discountPrice) / item.product.price) * 100)}%
                    </div>
                  )}

                  {/* Stock Status */}
                  {item.product.stock === 0 || item.product.isAvailable === false ? (
                    <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white px-2 py-0.5 rounded-full text-xs">
                      ناموجود
                    </div>
                  ) : null}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <Link href={generateProductUrl(item.product, item.product.category)}>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5 hover:text-purple-600 transition-colors line-clamp-2 leading-tight">
                      {item.product.name}
                    </h3>
                  </Link>

                  {item.product.sequentialId && (
                    <p className="text-xs text-gray-500 mb-2">کد: {item.product.sequentialId}</p>
                  )}

                  {/* Price */}
                  <div className="mb-3">
                    {item.product.discountPrice ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold text-purple-600">
                          {item.product.discountPrice.toLocaleString('fa-IR')} تومان
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {item.product.price.toLocaleString('fa-IR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-bold text-gray-900">
                        {item.product.price.toLocaleString('fa-IR')} تومان
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <Link
                    href={generateProductUrl(item.product, item.product.category)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    نمایش
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {wishlist.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-block bg-white text-purple-600 border-2 border-purple-600 px-8 py-3 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-medium"
            >
              ادامه خرید
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
