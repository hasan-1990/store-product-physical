'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { generateProductUrl } from '@/lib/url-client';

interface WishlistItem {
  _id: string;
  userId: string;
  productId: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    slug: string;
    sequentialId?: string;
    price: number;
    imageUrl: string;
  };
}

interface Stats {
  totalItems: number;
  totalUsers: number;
  totalProducts: number;
}

interface PopularProduct {
  productId: string;
  count: number;
  product: {
    name: string;
    slug: string;
    imageUrl: string;
    price: number;
  };
}

export default function AdminWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalItems: 0, totalUsers: 0, totalProducts: 0 });
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'stats'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/wishlist');
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items);
        setStats(data.data.stats);
        setPopularProducts(data.data.popularProducts);
      }
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/admin/wishlist?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('آیتم با موفقیت حذف شد');
        fetchData();
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('خطا در حذف آیتم');
    }
  };

  const filteredItems = items.filter(item =>
    item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  مدیریت لیست علاقه‌مندی‌ها
                </h1>
                <p className="text-purple-200 mt-1">مشاهده و مدیریت علاقه‌مندی‌های کاربران</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('all')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  view === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-purple-200 hover:bg-white/10'
                }`}
              >
                📋 همه آیتم‌ها
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  view === 'stats'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-purple-200 hover:bg-white/10'
                }`}
              >
                📊 آمار و گزارشات
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-1">تعداد کل آیتم‌ها</p>
                <p className="text-3xl font-bold text-white">{stats.totalItems.toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-1">تعداد کاربران</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm mb-1">تعداد محصولات منحصربفرد</p>
                <p className="text-3xl font-bold text-white">{stats.totalProducts.toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'all' ? (
          <>
            {/* Search */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-4 border border-white/20 mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو بر اساس نام کاربر، ایمیل یا نام محصول..."
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Items List */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/20">
                      <th className="px-6 py-4 text-right text-sm font-bold text-white">کاربر</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-white">محصول</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-white">قیمت</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-white">تاریخ افزودن</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-white">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-purple-200">
                          هیچ آیتمی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{item.user?.name || 'نامشخص'}</p>
                              <p className="text-purple-300 text-sm">{item.user?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.product?.imageUrl && (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{item.product?.name || 'محصول حذف شده'}</p>
                                {item.product?.sequentialId && (
                                  <p className="text-purple-300 text-xs">#{item.product.sequentialId}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {item.product?.price?.toLocaleString('fa-IR')} تومان
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-purple-200 text-sm">
                              {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Popular Products */
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">محبوب‌ترین محصولات در لیست علاقه‌مندی‌ها</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularProducts.map((item, index) => (
                <div key={item.productId} className="bg-white/5 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-purple-400">#{index + 1}</div>
                    {item.product?.imageUrl && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{item.product?.name}</p>
                      <p className="text-purple-300 text-sm">
                        {item.count.toLocaleString('fa-IR')} بار اضافه شده
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
