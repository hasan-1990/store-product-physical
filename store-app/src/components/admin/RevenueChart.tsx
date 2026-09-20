'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface Stats {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
}

const RevenueChart = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState<Stats>({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/revenue?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setRevenueData(data.chartData);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const todayChange = calculatePercentageChange(stats.today, stats.yesterday);
  const weekChange = calculatePercentageChange(stats.thisWeek, stats.lastWeek);
  const monthChange = calculatePercentageChange(stats.thisMonth, stats.lastMonth);

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} میلیون`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} هزار`;
    }
    return amount.toLocaleString('fa-IR');
  };

  const statCards = [
    {
      title: 'درآمد امروز',
      value: stats.today,
      change: todayChange,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
      bgGlow: 'group-hover:shadow-emerald-500/50'
    },
    {
      title: 'درآمد این هفته',
      value: stats.thisWeek,
      change: weekChange,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-blue-500 to-indigo-600',
      bgGlow: 'group-hover:shadow-blue-500/50'
    },
    {
      title: 'درآمد این ماه',
      value: stats.thisMonth,
      change: monthChange,
      icon: <Package className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600',
      bgGlow: 'group-hover:shadow-purple-500/50'
    },
    {
      title: 'میانگین سفارش',
      value: stats.averageOrderValue,
      change: 0,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600',
      bgGlow: 'group-hover:shadow-orange-500/50',
      hideChange: true
    }
  ];

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 border border-purple-500/20 shadow-2xl">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 text-lg">در حال بارگذاری داده‌ها...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="group backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
          >
            {/* Icon & Title */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg ${card.bgGlow} transition-shadow duration-300`}>
                {card.icon}
              </div>
              {!card.hideChange && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  card.change >= 0 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {card.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span className="text-xs font-bold">
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Value & Label */}
            <div>
              <p className="text-2xl font-bold text-white mb-1">
                {formatCurrency(card.value)}
                <span className="text-sm text-gray-400 mr-1">تومان</span>
              </p>
              <p className="text-sm text-gray-400">{card.title}</p>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: `${Math.min((card.value / maxRevenue) * 100, 100)}%`,
                  animation: 'slideIn 1s ease-out'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-purple-500/20 shadow-2xl">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              📈 نمای کلی درآمد
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              مجموع: {formatCurrency(revenueData.reduce((sum, d) => sum + d.revenue, 0))} تومان
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-purple-500/20">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  period === p
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {p === 'week' ? 'هفتگی' : p === 'month' ? 'ماهانه' : 'سالانه'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="relative">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full grid grid-rows-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-purple-500/50"></div>
              ))}
            </div>
          </div>

          {/* Chart Bars */}
          <div className="relative flex items-end justify-between gap-2 h-64 px-4">
            {revenueData.map((data, idx) => {
              const height = (data.revenue / maxRevenue) * 100;
              const isHighest = data.revenue === Math.max(...revenueData.map(d => d.revenue));
              
              return (
                <div key={idx} className="flex-1 group relative flex flex-col items-center">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-gray-900 border border-purple-500/30 rounded-xl px-3 py-2 shadow-xl backdrop-blur-lg">
                      <p className="text-white text-xs font-bold whitespace-nowrap">
                        {formatCurrency(data.revenue)} تومان
                      </p>
                      <p className="text-gray-400 text-[10px] text-center">
                        {data.orders} سفارش
                      </p>
                    </div>
                  </div>

                  {/* Bar */}
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-700 ease-out relative overflow-hidden ${
                      isHighest 
                        ? 'bg-gradient-to-t from-emerald-500 via-teal-500 to-cyan-400 shadow-lg shadow-emerald-500/50' 
                        : 'bg-gradient-to-t from-purple-600 via-purple-500 to-purple-400 group-hover:from-purple-500 group-hover:via-purple-400 group-hover:to-purple-300'
                    }`}
                    style={{ 
                      height: `${height}%`,
                      animation: `growUp 0.8s ease-out ${idx * 0.1}s both`
                    }}
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>

                  {/* Date Label */}
                  <p className="text-gray-400 text-[10px] mt-2 group-hover:text-white transition-colors">
                    {data.date}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Footer Stats */}
        <div className="mt-6 pt-4 border-t border-purple-500/20">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">کل سفارشات</p>
              <p className="text-white text-lg font-bold">{stats.totalOrders.toLocaleString('fa-IR')}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">کل مشتریان</p>
              <p className="text-white text-lg font-bold">{stats.totalCustomers.toLocaleString('fa-IR')}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">بیشترین فروش</p>
              <p className="text-white text-lg font-bold">
                {formatCurrency(Math.max(...revenueData.map(d => d.revenue)))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes growUp {
          from {
            height: 0%;
            opacity: 0;
          }
          to {
            height: var(--final-height);
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueChart;
