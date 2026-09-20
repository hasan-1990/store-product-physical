'use client';

import { useState, useEffect } from 'react';
import { DiscountStats } from '@/types/discount';
import Link from 'next/link';

interface ChartData {
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    usage: number;
    discountGiven: number;
  }>;
  typeDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

const DiscountAnalyticsPage = () => {
  const [stats, setStats] = useState<DiscountStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to
      });

      const response = await fetch(`/api/admin/discount-codes/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setChartData({
          monthlyTrends: data.data.monthlyTrends,
          typeDistribution: data.data.typeDistribution
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  // Format month name
  const getMonthName = (month: number) => {
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return months[month - 1] || '';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-white text-lg">در حال بارگذاری آمار...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-red-400 text-lg">خطا در بارگذاری آمار</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/discount-codes"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            بازگشت به لیست کدهای تخفیف
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">آمار و تحلیل کدهای تخفیف</h1>
          <p className="text-gray-300">تحلیل عملکرد و آمار استفاده از کدهای تخفیف</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
          <div>
            <label className="block text-sm text-gray-300 mb-1">از تاریخ</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">تا تاریخ</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-6 rounded-2xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalCodes}</div>
          <div className="text-blue-300">کل کدهای تخفیف</div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 p-6 rounded-2xl border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.activeCodes}</div>
          <div className="text-green-300">کدهای فعال</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalUsage}</div>
          <div className="text-purple-300">تعداد استفاده</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 p-6 rounded-2xl border border-yellow-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.totalDiscountGiven)}</div>
          <div className="text-yellow-300">کل تخفیف داده شده</div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trends */}
        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">روند استفاده ماهانه</h3>
          
          {chartData?.monthlyTrends && chartData.monthlyTrends.length > 0 ? (
            <div className="space-y-4">
              {chartData.monthlyTrends.map((item, index) => {
                const maxUsage = Math.max(...chartData.monthlyTrends.map(i => i.usage));
                const widthPercentage = maxUsage > 0 ? (item.usage / maxUsage) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {getMonthName(item._id.month)} {item._id.year}
                      </span>
                      <span className="text-white font-medium">{item.usage} استفاده</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${widthPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatCurrency(item.discountGiven)} تخفیف
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>

        {/* Type Distribution */}
        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">توزیع انواع کدهای تخفیف</h3>
          
          {chartData?.typeDistribution && chartData.typeDistribution.length > 0 ? (
            <div className="space-y-4">
              {chartData.typeDistribution.map((item, index) => {
                const total = chartData.typeDistribution.reduce((sum, i) => sum + i.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        item._id === 'percentage' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-white">
                        {item._id === 'percentage' ? 'درصدی' : 'مبلغ ثابت'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{item.count} کد</div>
                      <div className="text-gray-400 text-sm">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Codes by Usage */}
        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">پرکاربردترین کدها</h3>
          
          {stats.topCodes && stats.topCodes.length > 0 ? (
            <div className="space-y-3">
              {stats.topCodes.slice(0, 10).map((code, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="font-mono text-white bg-gray-700 px-2 py-1 rounded">
                      {code.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{code.usageCount} بار</div>
                    <div className="text-gray-400 text-sm">{formatCurrency(code.discountGiven)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              هنوز استفاده‌ای ثبت نشده است
            </div>
          )}
        </div>

        {/* Recent Usage */}
        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">آخرین استفاده‌ها</h3>
          
          {stats.recentUsage && stats.recentUsage.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsage.slice(0, 10).map((usage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="font-mono text-white bg-gray-700 px-2 py-1 rounded text-sm">
                      {usage.code}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      سفارش: {usage.orderId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatCurrency(usage.amount)}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(usage.usedAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              هنوز استفاده‌ای ثبت نشده است
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountAnalyticsPage;