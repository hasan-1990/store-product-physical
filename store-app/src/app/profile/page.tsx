'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ProfileHeader from '@/components/ProfileHeader';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalSpent: number;
  digitalProducts: number;
  wishlistItems: number;
}

function getUserIdFromStorage(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id || user._id || user.userId || null;
  } catch {
    return null;
  }
}

function decodeToken(token: string): { userId?: string; role?: string; email?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function resolveUserId(token: string | null, sessionUserId?: string | null): string | null {
  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.userId) return decoded.userId;
  }
  return sessionUserId || getUserIdFromStorage();
}

function mapStoredUserToProfile(userData: Record<string, unknown>): UserProfile {
  const nameParts = String(userData.name || '').split(' ');
  return {
    _id: String(userData._id || userData.id || ''),
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: String(userData.email || ''),
    phone: String(userData.phone || ''),
    avatar: userData.avatar ? String(userData.avatar) : undefined,
    createdAt: String(userData.createdAt || new Date().toISOString()),
    lastLogin: userData.lastLogin ? String(userData.lastLogin) : undefined,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    digitalProducts: 0,
    wishlistItems: 0
  });
  const [loading, setLoading] = useState(true);

  const applyProfileFromApi = useCallback((user: Record<string, unknown>) => {
    const nameParts = String(user.name || '').split(' ');
    setProfile({
      _id: String(user._id || ''),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: String(user.email || ''),
      phone: String(user.phone || ''),
      avatar: user.avatar ? String(user.avatar) : undefined,
      createdAt: String(user.createdAt || new Date().toISOString()),
      lastLogin: user.lastLogin ? String(user.lastLogin) : undefined,
    });
  }, []);

  const loadStats = useCallback(async (userIdParam: string, token: string | null) => {
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let ordersStats = {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalSpent: 0,
      digitalProducts: 0,
    };

    try {
      const ordersResponse = await fetchWithTimeout(
        `/api/orders?userId=${userIdParam}&limit=100`,
        { headers, credentials: 'include' }
      );

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data || ordersData.orders || [];

        if (Array.isArray(orders)) {
          const completed = orders.filter((o: { status?: string }) => o.status === 'completed').length;
          const pending = orders.filter((o: { status?: string }) =>
            o.status === 'pending' || o.status === 'PENDING'
          ).length;

          const totalSpent = orders
            .filter((o: { status?: string }) => o.status === 'completed')
            .reduce((sum: number, o: { totalAmount?: number; items?: Array<{ price?: number; quantity?: number }> }) => {
              let orderTotal = o.totalAmount || 0;
              if (orderTotal === 0 && Array.isArray(o.items)) {
                orderTotal = o.items.reduce(
                  (itemSum, item) => itemSum + ((item.price || 0) * (item.quantity || 1)),
                  0
                );
              }
              return sum + orderTotal;
            }, 0);

          let digitalCount = 0;
          orders.forEach((order: { status?: string; items?: Array<{ productType?: string }> }) => {
            if (order.status === 'completed' && Array.isArray(order.items)) {
              order.items.forEach((item) => {
                if (item.productType === 'DIGITAL' || item.productType === 'digital') {
                  digitalCount++;
                }
              });
            }
          });

          ordersStats = {
            totalOrders: orders.length,
            completedOrders: completed,
            pendingOrders: pending,
            totalSpent,
            digitalProducts: digitalCount,
          };
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری سفارشات:', error);
    }

    let wishlistCount = 0;
    try {
      const wishlistResponse = await fetchWithTimeout('/api/user/wishlist', {
        headers,
        credentials: 'include',
      });

      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        if (wishlistData.success && wishlistData.data) {
          wishlistCount = wishlistData.data.length;
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری wishlist:', error);
    }

    setStats({
      ...ordersStats,
      wishlistItems: wishlistCount,
    });
  }, []);

  const loadUserData = useCallback(async (userIdParam: string | null, token: string | null) => {
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setProfile(mapStoredUserToProfile(JSON.parse(savedUser)));
      } catch {
        // ignore invalid local user cache
      }
    }

    try {
      const userResponse = await fetchWithTimeout('/api/user/profile', {
        headers,
        credentials: 'include',
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success && userData.user) {
          applyProfileFromApi(userData.user);
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری پروفایل:', error);
    } finally {
      setLoading(false);
    }

    if (userIdParam) {
      void loadStats(userIdParam, token);
    }
  }, [applyProfileFromApi, loadStats]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const token = localStorage.getItem('token');
    const resolvedUserId = resolveUserId(token, session?.user?.id);

    if (!token && !session?.user && !getUserIdFromStorage()) {
      setLoading(false);
      router.push('/login');
      return;
    }

    void loadUserData(resolvedUserId, token);
  }, [router, sessionStatus, session, loadUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <svg className="animate-spin w-10 h-10 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <p className="text-gray-600 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-yellow-50/30 relative overflow-hidden" dir="rtl">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header با اطلاعات کاربر */}
        {profile && (
          <div className="mb-8">
            <ProfileHeader 
              user={{
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                phone: profile.phone,
                avatar: profile.avatar,
                createdAt: profile.createdAt,
                lastLogin: profile.lastLogin
              }} 
              showActions={true}
            />
          </div>
        )}

        {/* آمار سریع */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* کل سفارشات */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-blue-100 hover:border-blue-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">کل سفارشات</p>
              </div>
            </div>
          </div>

          {/* تکمیل شده */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-green-100 hover:border-green-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">{stats.completedOrders}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">تکمیل شده</p>
              </div>
            </div>
          </div>

          {/* در انتظار */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-yellow-100 hover:border-yellow-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-800 bg-clip-text text-transparent">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">در انتظار</p>
              </div>
            </div>
          </div>

          {/* کل خرید */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-purple-100 hover:border-purple-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{stats.totalSpent.toLocaleString('fa-IR')}</p>
                <p className="text-xs text-gray-600 font-bold mt-2">کل خرید (تومان)</p>
              </div>
            </div>
          </div>

          {/* محصول دیجیتال */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-orange-100 hover:border-orange-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-pink-800 bg-clip-text text-transparent">{stats.digitalProducts}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">محصول دیجیتال</p>
              </div>
            </div>
          </div>

          {/* علاقه‌مندی‌ها */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1 border border-pink-100 hover:border-pink-300">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-rose-800 bg-clip-text text-transparent">{stats.wishlistItems}</p>
                <p className="text-sm text-gray-600 font-bold mt-2">علاقه‌مندی‌ها</p>
              </div>
            </div>
          </div>
        </div>

        {/* منوی اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* سفارشات */}
          <Link
            href="/profile/orders"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-blue-100 hover:border-blue-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  سفارشات من
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  مشاهده و پیگیری سفارشات خود
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <span>مشاهده همه</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* دانلودها */}
          <Link
            href="/profile/downloads"
            className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-green-100 hover:border-green-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  دانلودهای من
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  محصولات دیجیتال قابل دانلود
                </p>
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <span>مشاهده همه</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* علاقه‌مندی‌ها */}
          <Link
            href="/wishlist"
            className="group relative overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-pink-100 hover:border-pink-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                  علاقه‌مندی‌ها
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  محصولات مورد علاقه شما
                </p>
                <div className="flex items-center gap-2 text-pink-600 font-bold">
                  <span>مشاهده همه</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* آدرس‌ها */}
          <Link
            href="/profile/addresses"
            className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-purple-100 hover:border-purple-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  آدرس‌های من
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  مدیریت آدرس‌های ارسال
                </p>
                <div className="flex items-center gap-2 text-purple-600 font-bold">
                  <span>مشاهده همه</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* ویرایش پروفایل */}
          <Link
            href="/profile/edit"
            className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-orange-100 hover:border-orange-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  ویرایش پروفایل
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  ویرایش اطلاعات شخصی
                </p>
                <div className="flex items-center gap-2 text-orange-600 font-bold">
                  <span>ویرایش</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* تیکت‌های پشتیبانی */}
          <Link
            href="/profile/tickets"
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-indigo-100 hover:border-indigo-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  تیکت‌های پشتیبانی
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  ارسال و پیگیری درخواست‌ها
                </p>
                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                  <span>مشاهده همه</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* تغییر رمز عبور */}
          <Link
            href="/profile/change-password"
            className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 border-2 border-red-100 hover:border-red-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200/30 to-transparent rounded-full blur-2xl -z-10"></div>
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                  تغییر رمز عبور
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  امنیت حساب کاربری
                </p>
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <span>تغییر رمز</span>
                  <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* دسترسی سریع - CTA Banner */}
        <div className="mt-8 relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-3xl p-10 shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-right flex-1">
              <h2 className="text-3xl font-extrabold text-white mb-3 drop-shadow-lg">
                به فروشگاه ما خوش آمدید! 🎉
              </h2>
              <p className="text-white/95 text-lg font-medium drop-shadow">
                محصولات جدید و پیشنهادهای ویژه را از دست ندهید
              </p>
            </div>
            <Link
              href="/"
              className="group px-10 py-5 bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 text-orange-600 rounded-2xl font-extrabold text-lg transition-all transform hover:scale-110 shadow-2xl flex items-center gap-3"
            >
              <span>مشاهده محصولات</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
