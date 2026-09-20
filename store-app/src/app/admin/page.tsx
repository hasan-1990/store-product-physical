'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import AnalyticsCards from '@/components/admin/AnalyticsCards';
import RevenueChart from '@/components/admin/RevenueChart';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product' | 'review';
  description: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

const AdminDashboard = () => {
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check JWT authentication
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/admin/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      
      // Check if user is admin
      if (userData.role !== 'ADMIN' && userData.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      
      // Verify token is not expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }
      
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
      return;
    }

    // Simulate loading dashboard data
    setStats({
      totalProducts: 156,
      totalOrders: 1247,
      totalUsers: 3892,
      totalRevenue: 456800000,
      pendingOrders: 23,
      lowStockProducts: 8
    });

    setRecentActivity([
      {
        id: '1',
        type: 'order',
        description: 'سفارش جدید #ORD-2025-154 از علی احمدی',
        timestamp: '2 دقیقه پیش',
        status: 'pending'
      },
      {
        id: '2',
        type: 'user',
        description: 'ثبت‌نام کاربر جدید: sara.hosseini@email.com',
        timestamp: '15 دقیقه پیش'
      },
      {
        id: '3',
        type: 'product',
        description: 'محصول "هدفون بی‌سیم" کم موجود است (3 عدد باقیمانده)',
        timestamp: '1 ساعت پیش'
      },
      {
        id: '4',
        type: 'review',
        description: 'نظر 5 ستاره جدید برای "ساعت هوشمند ورزشی"',
        timestamp: '2 ساعت پیش'
      },
      {
        id: '5',
        type: 'order',
        description: 'سفارش #ORD-2025-153 ارسال شد',
        timestamp: '3 ساعت پیش',
        status: 'completed'
      }
    ]);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white">در حال بررسی احراز هویت...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const statCards = [
    {
      title: 'کل محصولات',
      value: stats.totalProducts.toLocaleString('fa-IR'),
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      href: '/admin/products'
    },
    {
      title: 'کل سفارش‌ها',
      value: stats.totalOrders.toLocaleString('fa-IR'),
      icon: '🛒',
      color: 'from-green-500 to-green-600',
      href: '/admin/orders'
    },
    {
      title: 'کل کاربران',
      value: stats.totalUsers.toLocaleString('fa-IR'),
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
      href: '/admin/users'
    },
    {
      title: 'کل درآمد',
      value: `${stats.totalRevenue.toLocaleString('fa-IR')} تومان`,
      icon: '💰',
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/analytics'
    }
  ];

  const alertCards = [
    {
      title: 'سفارش‌های در انتظار',
      value: stats.pendingOrders,
      icon: '⏰',
      color: 'from-orange-500 to-orange-600',
      href: '/admin/orders?status=pending'
    },
    {
      title: 'محصولات کم موجود',
      value: stats.lowStockProducts,
      icon: '⚠️',
      color: 'from-red-500 to-red-600',
      href: '/admin/products?filter=low-stock'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return '🛒';
      case 'user': return '👤';
      case 'product': return '📦';
      case 'review': return '⭐';
      default: return '📋';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">داشبورد</h1>
          <p className="text-gray-300 mt-1">خوش آمدید {user?.name || user?.email}! در اینجا وضعیت فروشگاه و آمار بازدید واقعی نمایش داده می‌شود.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-gray-300">امروز</p>
            <p className="text-white font-semibold">{new Date().toLocaleDateString('fa-IR')}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/admin/login');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            title="خروج از سیستم"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </div>

      {/* آمار بازدید واقعی - Compact Version */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">📊 آمار بازدید واقعی</h2>
          <Link
            href="/admin/analytics"
            className="px-3 py-1.5 text-sm bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            جزئیات کامل ←
          </Link>
        </div>
        <AnalyticsCards />
      </div>

      {/* Alert Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alertCards.map((card, index) => (
          <Link key={index} href={card.href}>
            <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-xs">{card.title}</p>
                  <p className="text-xl font-bold text-white mt-1">{card.value}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">نیاز به توجه دارد</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity - Modern Design */}
        <div className="backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-white">فعالیت‌های اخیر</h2>
            </div>
            <Link
              href="/admin/analytics"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <span className="text-xs">←</span>
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div 
                key={activity.id} 
                className="group relative flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-800/40 to-gray-800/20 hover:from-gray-800/60 hover:to-gray-800/40 transition-all duration-300 border border-gray-700/30 hover:border-purple-500/40"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Icon with background */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-relaxed mb-1">{activity.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">🕒</span>
                    <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                {activity.status && (
                  <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    activity.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {getStatusText(activity.status)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Modern Cards */}
        <div className="backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="text-2xl">⚡</div>
            <h2 className="text-xl font-bold text-white">عملیات سریع</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/products/add"
              className="group relative p-5 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl text-white hover:from-blue-500/30 hover:to-blue-600/20 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 border border-blue-500/20 hover:border-blue-400/40 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-all"></div>
              <div className="relative">
                <div className="text-3xl mb-2">➕</div>
                <div className="text-sm font-bold">افزودن محصول</div>
                <div className="text-xs text-blue-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">محصول جدید ایجاد کنید</div>
              </div>
            </Link>
            
            <Link
              href="/admin/categories/add"
              className="group relative p-5 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl text-white hover:from-green-500/30 hover:to-green-600/20 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 border border-green-500/20 hover:border-green-400/40 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full blur-2xl group-hover:bg-green-400/20 transition-all"></div>
              <div className="relative">
                <div className="text-3xl mb-2">🏷️</div>
                <div className="text-sm font-bold">افزودن دسته‌بندی</div>
                <div className="text-xs text-green-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">دسته جدید بسازید</div>
              </div>
            </Link>
            
            <Link
              href="/admin/orders"
              className="group relative p-5 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl text-white hover:from-orange-500/30 hover:to-orange-600/20 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 border border-orange-500/20 hover:border-orange-400/40 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/10 rounded-full blur-2xl group-hover:bg-orange-400/20 transition-all"></div>
              <div className="relative">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm font-bold">مدیریت سفارش‌ها</div>
                <div className="text-xs text-orange-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">سفارشات را مشاهده کنید</div>
              </div>
            </Link>
            
            <Link
              href="/admin/content"
              className="group relative p-5 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl text-white hover:from-purple-500/30 hover:to-purple-600/20 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 border border-purple-500/20 hover:border-purple-400/40 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-all"></div>
              <div className="relative">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm font-bold">ویرایش محتوا</div>
                <div className="text-xs text-purple-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">محتوای سایت را تغییر دهید</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder - Modern */}
      <RevenueChart />
    </div>
  );
};

export default AdminDashboard;
