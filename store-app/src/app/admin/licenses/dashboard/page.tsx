'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface LicenseStatsExtended {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expired: number;
  byProduct: Record<string, number>;
  productStats: Array<{
    _id: string;
    count: number;
    active: number;
  }>;
  monthlyStats: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
  recentLicenses: any[];
}

export default function LicensesDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<LicenseStatsExtended | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/licenses/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">دسترسی مجاز نیست</h1>
          <p className="text-gray-600">لطفاً وارد شوید</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">خطا در دریافت آمار</h1>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // تهیه داده‌های چارت وضعیت
  const statusChartData = {
    labels: ['فعال', 'غیرفعال', 'تعلیق شده', 'منقضی شده'],
    datasets: [
      {
        data: [stats.active, stats.inactive, stats.suspended, stats.expired],
        backgroundColor: [
          '#10B981', // green
          '#6B7280', // gray
          '#EF4444', // red
          '#F59E0B', // orange
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // تهیه داده‌های چارت محصولات
  const productChartData = {
    labels: stats.productStats.slice(0, 10).map(item => item._id),
    datasets: [
      {
        label: 'کل لایسنس‌ها',
        data: stats.productStats.slice(0, 10).map(item => item.count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'فعال',
        data: stats.productStats.slice(0, 10).map(item => item.active),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

  // تهیه داده‌های چارت ماهانه
  const monthNames = [
    'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
    'ژوئیه', 'آگوست', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
  ];

  const monthlyChartData = {
    labels: stats.monthlyStats.map(item => 
      `${monthNames[item._id.month - 1]} ${item._id.year}`
    ),
    datasets: [
      {
        label: 'لایسنس‌های جدید',
        data: stats.monthlyStats.map(item => item.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">داشبورد لایسنس‌ها</h1>
            <p className="text-gray-600 mt-2">آمار و گزارش‌های کامل سیستم لایسنس</p>
          </div>
          <Link 
            href="/admin/licenses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            مدیریت لایسنس‌ها
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">کل لایسنس‌ها</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">تمام لایسنس‌های صادر شده</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">لایسنس‌های فعال</p>
                <p className="text-3xl font-bold text-green-600">{stats.active.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% از کل
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">نیاز به بررسی</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(stats.suspended + stats.expired).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">تعلیق شده + منقضی</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">محصولات فعال</p>
                <p className="text-3xl font-bold text-purple-600">{stats.productStats.length}</p>
                <p className="text-xs text-gray-500 mt-1">محصولات دارای لایسنس</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">توزیع وضعیت لایسنس‌ها</h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={statusChartData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom',
                  },
                },
              }} />
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">روند ماهانه لایسنس‌های جدید</h3>
            <div style={{ height: '300px' }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Product Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">آمار محصولات (10 محصول برتر)</h3>
          <div style={{ height: '400px' }}>
            <Bar data={productChartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Licenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">آخرین لایسنس‌های صادر شده</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    کلید لایسنس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    ایمیل کاربر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاریخ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentLicenses.slice(0, 5).map((license) => (
                  <tr key={license._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono">{license.licenseKey}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        license.status === 'active' ? 'bg-green-100 text-green-800' :
                        license.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {license.status === 'active' ? 'فعال' : 
                         license.status === 'inactive' ? 'غیرفعال' : 'مشکل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(license.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link 
              href="/admin/licenses"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              مشاهده همه لایسنس‌ها ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}