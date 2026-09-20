/**
 * Next Rocket Module - Admin Dashboard
 * داشبورد مدیریت ماژول Next Rocket
 */

'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  RocketLaunchIcon, 
  BoltIcon, 
  CpuChipIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  cache?: {
    totalEntries: number;
    totalSize: string;
    hitRate: string;
    missRate: string;
  };
  criticalCss?: {
    cachedUrls: number;
    totalSavings: number;
    savingsPercentage: number;
  };
  database?: {
    collections: number;
    totalSize: string;
    totalDocuments: number;
  };
}

export default function NextRocketDashboard() {
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'tools'>('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Cache removed - only load optimization status
      const statusRes = await fetch('/api/admin/next-rocket/optimize');
      const statusData = await statusRes.json();

      setStats({
        criticalCss: statusData.status?.criticalCss,
        database: statusData.status?.database,
      });
    } catch (error) {
      console.error('خطا در بارگذاری آمار:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (type: string) => {
    const typeNames: { [key: string]: string } = {
      'critical-css': 'Critical CSS',
      'unused-css': 'Unused CSS',
      'javascript': 'JavaScript',
      'database': 'دیتابیس',
      'all': 'همه بهینه‌سازی‌ها',
    };

    // نمایش مدال تایید
    setModalConfig({
      title: '🚀 تایید بهینه‌سازی',
      message: `آیا مطمئن هستید که می‌خواهید بهینه‌سازی ${typeNames[type] || type} را انجام دهید؟`,
      type: 'warning',
      onConfirm: async () => {
        setShowModal(false);
        try {
          setOptimizing(true);
          toast.loading('در حال انجام بهینه‌سازی...', { id: 'optimize' });
          
          const res = await fetch('/api/admin/next-rocket/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
          });

          const data = await res.json();

          if (data.success) {
            toast.success(data.message || '✨ عملیات با موفقیت انجام شد!', { id: 'optimize' });
            await loadStats();
          } else {
            toast.error(data.error || '❌ عملیات با خطا مواجه شد', { id: 'optimize' });
          }
        } catch (error) {
          console.error('خطا در بهینه‌سازی:', error);
          toast.error('❌ خطا در انجام عملیات. لطفاً دوباره تلاش کنید.', { id: 'optimize' });
        } finally {
          setOptimizing(false);
        }
      }
    });
    setShowModal(true);
  };

  // Cache management removed - Redis handles caching for the main site

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
        {/* Header - ULTRA PREMIUM */}
        <div className="mb-10 relative group">
        {/* Multi-layer Glowing Background */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600 rounded-[2.5rem] blur-3xl opacity-30 group-hover:opacity-50 animate-pulse transition-opacity duration-700"></div>
        <div className="absolute -inset-2 bg-gradient-to-br from-pink-500 via-rose-400 to-orange-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
        
        {/* Glass Card with Border Gradient */}
        <div className="relative bg-gradient-to-br from-slate-800/90 via-purple-900/80 to-slate-800/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl hover:shadow-purple-500/30 hover:shadow-[0_20px_80px_rgba(168,85,247,0.4)] p-10 border-2 border-purple-500/30 hover:border-purple-400/50 transform hover:scale-[1.01] transition-all duration-700">
          <div className="flex items-center justify-between">
            {/* Left Side - Icon + Title */}
            <div className="flex items-center gap-6">
              {/* Animated Rocket with Glow */}
              <div className="relative group-hover:animate-bounce">
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-full blur-2xl opacity-60 group-hover:opacity-80 animate-pulse"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-xl opacity-40"></div>
                <div className="relative p-6 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/20">
                  <RocketLaunchIcon className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
              
              {/* Title & Subtitle */}
              <div>
                <h1 className="text-6xl font-black mb-2 leading-tight flex items-center gap-3">
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-gradient bg-[length:200%_auto]">
                    Next Rocket
                  </span>
                  <span className="inline-block animate-bounce text-5xl">🚀</span>
                </h1>
                <p className="text-purple-200 text-xl font-semibold flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-lg shadow-green-500/50"></span>
                  </span>
                  سیستم بهینه‌سازی و کش هوشمند پیشرفته
                </p>
              </div>
            </div>
            
            {/* Right Side - Status Badge */}
            <div className="hidden lg:flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl shadow-green-500/30 ring-2 ring-green-400/30 hover:scale-110 hover:shadow-green-500/50 transition-all duration-300">
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-lg"></span>
              </div>
              <span className="text-white font-black text-lg">آنلاین</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - PREMIUM GLASS STYLE */}
      <div className="relative mb-10 group">
        {/* Glowing Background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
        
        {/* Glass Container */}
        <div className="relative flex gap-4 p-4 bg-gradient-to-br from-slate-800/80 via-purple-900/70 to-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-purple-500/30">
          {[
            { id: 'dashboard', icon: '📊', label: 'داشبورد', gradient: 'from-blue-500 to-cyan-500' },
            { id: 'settings', icon: '⚙️', label: 'تنظیمات', gradient: 'from-purple-500 to-pink-500' },
            { id: 'tools', icon: '🛠️', label: 'ابزارها', gradient: 'from-orange-500 to-red-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group/tab relative flex-1 px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-500 transform overflow-hidden ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-2xl shadow-purple-500/50 scale-105 -translate-y-1`
                  : 'bg-slate-700/50 text-purple-200 hover:bg-slate-600/50 hover:text-white hover:scale-102 hover:shadow-lg'
              }`}
            >
              {/* Active Tab Glow Effect */}
              {activeTab === tab.id && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} blur-xl opacity-50 animate-pulse`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                </>
              )}
              
              {/* Tab Content */}
              <span className="relative flex items-center justify-center gap-3">
                <span className={`text-3xl ${activeTab === tab.id ? 'animate-bounce' : 'group-hover/tab:scale-110 transition-transform'}`}>
                  {tab.icon}
                </span>
                <span className="font-black">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Critical CSS Stats - PREMIUM DARK CARD */}
          <div className="group relative rounded-[2rem] overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/60 to-purple-900/80"></div>
            
            {/* Glass Card */}
            <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-blue-500/30 hover:shadow-3xl p-8 border-2 border-blue-500/30 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500">
              <div className="flex items-center gap-5 mb-8">
                {/* Icon with Multi-layer Glow */}
                <div className="relative group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute -inset-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 animate-pulse"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-3xl blur-lg opacity-40"></div>
                  <div className="relative p-5 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/50 ring-2 ring-blue-400/30">
                    <CpuChipIcon className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    Critical CSS
                  </h3>
                  <p className="text-blue-300 font-semibold flex items-center gap-2 mt-1">
                    🎨 بهینه‌سازی سبک
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 mb-8">
                {/* Stats with Dark Theme */}
                <div className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 p-5 border-2 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                  <div className="relative flex justify-between items-center">
                    <span className="text-blue-200 font-bold text-lg">🔗 URLهای کش شده:</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {stats.criticalCss?.cachedUrls || 0}
                    </span>
                  </div>
                </div>
                
                <div className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-900/40 via-emerald-900/40 to-teal-900/40 p-5 border-2 border-green-500/40 hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                  <div className="relative flex justify-between items-center">
                    <span className="text-green-200 font-bold text-lg">💰 صرفه‌جویی:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/70"></div>
                      <span className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {(stats.criticalCss?.savingsPercentage != null ? stats.criticalCss.savingsPercentage.toFixed(1) : 0)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Warning Badge */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-4 border-2 border-yellow-500/40">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-yellow-300 font-bold text-sm">موقتاً غیرفعال (Next.js 15)</span>
                  </div>
                </div>
              </div>
              
              {/* Button with Glow */}
              <button
                onClick={() => handleOptimize('critical-css')}
                disabled={optimizing}
                className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-5 rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 font-bold text-lg shadow-2xl hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                <ArrowPathIcon className={`w-6 h-6 ${optimizing ? 'animate-spin' : ''}`} />
                تولید Critical CSS
              </button>
            </div>
          </div>

          {/* Database Stats - PREMIUM DARK CARD */}
          <div className="group relative rounded-[2rem] overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-emerald-900/60 to-teal-900/80"></div>
            
            {/* Glass Card */}
            <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-emerald-500/30 hover:shadow-3xl p-8 border-2 border-emerald-500/30 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500">
              <div className="flex items-center gap-5 mb-8">
                {/* Icon with Multi-layer Glow */}
                <div className="relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <div className="absolute -inset-3 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 animate-pulse"></div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-emerald-400 rounded-3xl blur-lg opacity-40"></div>
                  <div className="relative p-5 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-3xl shadow-2xl shadow-emerald-500/50 ring-2 ring-emerald-400/30">
                    <ChartBarIcon className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
                    دیتابیس
                  </h3>
                  <p className="text-emerald-300 font-semibold flex items-center gap-2 mt-1">
                    📊 مدیریت داده
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 mb-8">
                {/* Stats with Dark Theme */}
                <div className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 p-5 border-2 border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                  <div className="relative flex justify-between items-center">
                    <span className="text-emerald-200 font-bold text-lg">📚 Collection ها:</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                      {stats.database?.collections || 0}
                    </span>
                  </div>
                </div>
                
                <div className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 p-5 border-2 border-teal-500/30 hover:border-teal-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                  <div className="relative flex justify-between items-center">
                    <span className="text-teal-200 font-bold text-lg">💾 سایز کل:</span>
                    <span className="text-2xl font-black text-teal-300">
                      {stats.database?.totalSize || '0 MB'}
                    </span>
                  </div>
                </div>
                
                <div className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 p-5 border-2 border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                  <div className="relative flex justify-between items-center">
                    <span className="text-blue-200 font-bold text-lg">📄 تعداد اسناد:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/70"></div>
                      <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {stats.database?.totalDocuments || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Database Optimize Button - PREMIUM */}
              <button
                onClick={() => handleOptimize('database')}
                disabled={optimizing}
                className="group/btn relative w-full overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-5 rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                <Cog6ToothIcon className={`relative w-7 h-7 ${optimizing ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-700'}`} />
                <span className="relative">بهینه‌سازی دیتابیس</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSS Optimization Card */}
          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-purple-500/30 overflow-hidden hover:border-purple-400/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl shadow-purple-500/30">
                  <span className="text-4xl">🎨</span>
                </div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  بهینه‌سازی CSS
                </h3>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => handleOptimize('critical-css')}
                  disabled={optimizing}
                  className="group/btn w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-2xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                  <span className="relative">تولید Critical CSS</span>
                </button>
                <button
                  onClick={() => handleOptimize('unused-css')}
                  disabled={optimizing}
                  className="group/btn w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-5 rounded-2xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                  <span className="relative">حذف CSS استفاده نشده</span>
                </button>
              </div>
            </div>
          </div>

          {/* JavaScript Optimization Card */}
          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-yellow-500/30 overflow-hidden hover:border-yellow-400/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-xl shadow-yellow-500/30">
                  <span className="text-4xl">⚡</span>
                </div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  بهینه‌سازی JavaScript
                </h3>
              </div>
              <button
                onClick={() => handleOptimize('javascript')}
                disabled={optimizing}
                className="group/btn w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-5 rounded-2xl hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                <span className="relative">تحلیل Bundle‌ها</span>
              </button>
            </div>
          </div>

          {/* Database Optimization Card */}
          <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-green-500/30 overflow-hidden hover:border-green-400/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl shadow-green-500/30">
                  <span className="text-4xl">🗄️</span>
                </div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  مدیریت دیتابیس
                </h3>
              </div>
              <button
                onClick={() => handleOptimize('database')}
                disabled={optimizing}
                className="group/btn w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity"></div>
                <span className="relative">بهینه‌سازی کامل</span>
              </button>
            </div>
          </div>

          {/* Full Optimization Card - Spanning 2 columns */}
          <div className="md:col-span-2 group relative bg-gradient-to-br from-slate-800 via-purple-900/50 to-slate-800 rounded-3xl shadow-2xl p-10 border-2 border-blue-500/30 overflow-hidden hover:border-blue-400/50 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <div className="relative">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-5 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/30 animate-pulse">
                  <span className="text-5xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    بهینه‌سازی کامل
                  </h3>
                  <p className="text-gray-400 text-lg">اجرای همه بهینه‌سازی‌ها به صورت یکجا</p>
                </div>
              </div>
              <button
                onClick={() => handleOptimize('all')}
                disabled={optimizing}
                className="group/btn w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-6 rounded-2xl hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed font-black text-xl shadow-2xl hover:shadow-3xl hover:shadow-purple-500/50 hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-blue-400 opacity-0 group-hover/btn:opacity-30 blur-xl transition-opacity"></div>
                <span className="relative flex items-center justify-center gap-3">
                  {optimizing ? (
                    <>
                      <ArrowPathIcon className="w-7 h-7 animate-spin" />
                      در حال اجرا...
                    </>
                  ) : (
                    <>
                      <span>اجرای همه بهینه‌سازی‌ها</span>
                      <span className="animate-bounce">✨</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SettingsForm onSave={loadStats} />
      )}

      {/* Premium Confirmation Modal */}
      {showModal && modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop with Blur */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Card */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-[2rem] shadow-2xl max-w-md w-full border-2 border-purple-500/30 animate-scaleIn overflow-hidden">
            {/* Animated Gradient Background */}
            <div className={`absolute inset-0 opacity-20 ${
              modalConfig.type === 'danger' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
              modalConfig.type === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
              'bg-gradient-to-br from-blue-500 to-purple-500'
            } animate-pulse`}></div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 group z-10"
            >
              <XMarkIcon className="w-5 h-5 text-gray-300 group-hover:text-white" />
            </button>

            {/* Modal Content */}
            <div className="relative p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`relative p-6 rounded-full ${
                  modalConfig.type === 'danger' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                  modalConfig.type === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-blue-500 to-purple-600'
                } shadow-2xl`}>
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse ${
                    modalConfig.type === 'danger' ? 'bg-red-500' :
                    modalConfig.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  {modalConfig.type === 'danger' ? (
                    <XMarkIcon className="relative w-12 h-12 text-white drop-shadow-lg" />
                  ) : modalConfig.type === 'warning' ? (
                    <ExclamationTriangleIcon className="relative w-12 h-12 text-white drop-shadow-lg" />
                  ) : (
                    <CheckCircleIcon className="relative w-12 h-12 text-white drop-shadow-lg" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-3xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {modalConfig.title}
              </h3>

              {/* Message */}
              <p className="text-gray-300 text-center text-lg mb-8 leading-relaxed">
                {modalConfig.message}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {/* Cancel Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 px-6 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  انصراف
                </button>

                {/* Confirm Button */}
                <button
                  onClick={modalConfig.onConfirm}
                  className={`flex-1 py-4 px-6 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl relative overflow-hidden group ${
                    modalConfig.type === 'danger' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/50' 
                      : modalConfig.type === 'warning'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 hover:shadow-yellow-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-blue-500/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    تایید
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Settings Form Component
 */
function SettingsForm({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    type: 'save' | 'reset';
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/next-rocket/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تنظیمات:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSaveConfirmation = () => {
    setConfirmAction({
      title: '💾 ذخیره تنظیمات',
      message: 'آیا مطمئن هستید که می‌خواهید تنظیمات را ذخیره کنید؟',
      type: 'save',
      onConfirm: handleSave
    });
    setShowConfirmModal(true);
  };

  const showResetConfirmation = () => {
    setConfirmAction({
      title: '🔄 بازگشت به پیش‌فرض',
      message: 'آیا مطمئن هستید که می‌خواهید تمام تنظیمات را به حالت پیش‌فرض برگردانید؟ این عملیات قابل بازگشت نیست!',
      type: 'reset',
      onConfirm: handleReset
    });
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setShowConfirmModal(false);
    try {
      setSaving(true);
      toast.loading('در حال ذخیره تنظیمات...', { id: 'settings' });
      
      const res = await fetch('/api/admin/next-rocket/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('✨ تنظیمات با موفقیت ذخیره شد!', { id: 'settings', duration: 3000 });
        onSave();
      } else {
        toast.error(`❌ خطا: ${data.error}`, { id: 'settings' });
      }
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error);
      toast.error('❌ خطا در ذخیره تنظیمات', { id: 'settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setShowConfirmModal(false);
    try {
      setSaving(true);
      toast.loading('در حال بازگردانی تنظیمات...', { id: 'reset' });
      
      const res = await fetch('/api/admin/next-rocket/settings', {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        toast.success('✨ تنظیمات به حالت پیش‌فرض بازگشت!', { id: 'reset' });
        onSave();
      }
    } catch (error) {
      console.error('خطا در ریست تنظیمات:', error);
      toast.error('❌ خطا در ریست تنظیمات', { id: 'reset' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        خطا در بارگذاری تنظیمات
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl">
        <div>
          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">⚙️ تنظیمات ماژول</h3>
          <p className="text-gray-300 mt-2 text-lg">مدیریت و پیکربندی Next Rocket</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={showResetConfirmation}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl hover:from-slate-500 hover:to-slate-600 transition-all duration-300 disabled:opacity-50 font-bold hover:scale-105 hover:shadow-xl"
          >
            🔄 بازگشت به پیش‌فرض
          </button>
          <button
            onClick={showSaveConfirmation}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-3 font-bold hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره تنظیمات'}
          </button>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-8 border-2 border-purple-500/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-10 animate-pulse"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-black text-white mb-2">🚀 وضعیت ماژول</h4>
            <p className="text-purple-200 text-lg">فعال یا غیرفعال کردن کل ماژول Next Rocket</p>
          </div>
          <button 
            type="button"
            onClick={() => {
            const newValue = !(settings.enabled || false);
            updateSetting('enabled', newValue);
            
            // نمایش Toast برای toggle اصلی
            if (newValue) {
              toast.success('🚀 ماژول Next Rocket فعال شد!', {
                duration: 2000,
                position: 'top-left',
                icon: '✅',
                style: {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  borderRadius: '1.5rem',
                  padding: '1rem 1.5rem',
                  boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)',
                }
              });
            } else {
              toast('📴 ماژول Next Rocket غیرفعال شد', {
                duration: 2000,
                position: 'top-left',
                icon: '⏸️',
                style: {
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  borderRadius: '1.5rem',
                  padding: '1rem 1.5rem',
                  boxShadow: '0 10px 30px rgba(107, 114, 128, 0.3)',
                }
              });
            }
          }}
            className="relative inline-flex items-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-500/50 rounded-full"
          >
            <div className={`relative w-20 h-10 rounded-full transition-all duration-500 ${
              (settings.enabled || false) 
                ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-2xl shadow-green-500/50' 
                : 'bg-slate-600 shadow-inner'
            }`}>
              {(settings.enabled || false) && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 blur-lg opacity-60 animate-pulse"></div>
              )}
              <div className={`absolute top-1 transition-all duration-500 ${
                (settings.enabled || false) ? 'right-1' : 'right-11'
              } w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center transform ${
                (settings.enabled || false) ? 'rotate-[360deg] scale-110' : 'rotate-0'
              }`}>
                {(settings.enabled || false) ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* File Optimization */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-blue-500/30">
        <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">📄</span>
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">بهینه‌سازی فایل‌ها</span>
        </h4>
        
        <div className="space-y-4">
          <ToggleSetting
            label="فعال بودن بهینه‌سازی فایل‌ها"
            checked={settings.fileOptimization?.enabled}
            onChange={(v) => updateSetting('fileOptimization.enabled', v)}
          />
          
          <ToggleSetting
            label="Minify CSS"
            description="کوچک‌سازی فایل‌های CSS"
            checked={settings.fileOptimization?.minifyCss}
            onChange={(v) => updateSetting('fileOptimization.minifyCss', v)}
          />
          
          <ToggleSetting
            label="Minify JavaScript"
            description="کوچک‌سازی فایل‌های JavaScript"
            checked={settings.fileOptimization?.minifyJs}
            onChange={(v) => updateSetting('fileOptimization.minifyJs', v)}
          />
          
          <ToggleSetting
            label="حذف CSS استفاده نشده"
            description="حذف کدهای CSS که در صفحات استفاده نمی‌شوند"
            checked={settings.fileOptimization?.removeUnusedCss}
            onChange={(v) => updateSetting('fileOptimization.removeUnusedCss', v)}
          />
          
          <ToggleSetting
            label="Critical CSS"
            description="تولید و درج CSS بحرانی به صورت inline"
            checked={settings.fileOptimization?.criticalCss}
            onChange={(v) => updateSetting('fileOptimization.criticalCss', v)}
          />
          
          <ToggleSetting
            label="Async CSS Loading"
            description="بارگذاری غیرهمزمان CSS"
            checked={settings.fileOptimization?.asyncCss}
            onChange={(v) => updateSetting('fileOptimization.asyncCss', v)}
          />
        </div>
      </div>

      {/* Cache Settings */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-yellow-500/30">
        <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">تنظیمات کش</span>
        </h4>
        
        <div className="space-y-4">
          <ToggleSetting
            label="فعال بودن سیستم کش"
            checked={settings.cache?.enabled}
            onChange={(v) => updateSetting('cache.enabled', v)}
          />
          
          <ToggleSetting
            label="کش صفحات"
            description="کش کردن خروجی صفحات"
            checked={settings.cache?.pageCache}
            onChange={(v) => updateSetting('cache.pageCache', v)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="مدت زمان کش (دقیقه)"
              value={settings.cache?.cacheLifespan}
              onChange={(v) => updateSetting('cache.cacheLifespan', v)}
              min={1}
              max={1440}
            />
            
            <NumberInput
              label="حداکثر سایز (MB)"
              value={settings.cache?.maxSize}
              onChange={(v) => updateSetting('cache.maxSize', v)}
              min={10}
              max={1000}
            />
          </div>
        </div>
      </div>

      {/* JavaScript Settings */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-orange-500/30">
        <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">تنظیمات JavaScript</span>
        </h4>
        
        <div className="space-y-4">
          <ToggleSetting
            label="تاخیر اجرای JavaScript"
            description="به تاخیر انداختن اجرای JS تا تعامل کاربر"
            checked={settings.javascript?.delayExecution}
            onChange={(v) => updateSetting('javascript.delayExecution', v)}
          />
          
          <NumberInput
            label="زمان تاخیر (ثانیه)"
            value={settings.javascript?.delayTimeout}
            onChange={(v) => updateSetting('javascript.delayTimeout', v)}
            min={1}
            max={10}
          />
        </div>
      </div>

      {/* Database Settings */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 border-2 border-green-500/30">
        <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🗄️</span>
          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">تنظیمات دیتابیس</span>
        </h4>
        
        <div className="space-y-4">
          <ToggleSetting
            label="پاکسازی خودکار"
            description="پاکسازی خودکار داده‌های قدیمی"
            checked={settings.database?.autoCleanup}
            onChange={(v) => updateSetting('database.autoCleanup', v)}
          />
          
          <NumberInput
            label="پاکسازی داده‌های قدیمی‌تر از (روز)"
            value={settings.database?.cleanupDays}
            onChange={(v) => updateSetting('database.cleanupDays', v)}
            min={7}
            max={365}
          />
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="sticky bottom-0 bg-gradient-to-r from-slate-800 to-slate-700 border-t-2 border-purple-500/30 p-6 rounded-b-3xl shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-lg text-purple-200 font-semibold">
            💡 تغییرات بلافاصله پس از ذخیره اعمال می‌شوند
          </p>
          <button
            onClick={showSaveConfirmation}
            disabled={saving}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره تنظیمات'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Settings */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowConfirmModal(false)}
          ></div>
          
          {/* Modal Card */}
          <div className={`relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-[2rem] shadow-2xl max-w-md w-full border-2 ${
            confirmAction.type === 'reset' ? 'border-orange-500/30' : 'border-purple-500/30'
          } animate-scaleIn overflow-hidden`}>
            {/* Animated Background */}
            <div className={`absolute inset-0 opacity-20 ${
              confirmAction.type === 'reset' 
                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            } animate-pulse`}></div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 left-4 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-90 group z-10"
            >
              <XMarkIcon className="w-5 h-5 text-gray-300 group-hover:text-white" />
            </button>

            {/* Modal Content */}
            <div className="relative p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className={`relative p-6 rounded-full ${
                  confirmAction.type === 'reset'
                    ? 'bg-gradient-to-br from-orange-500 to-red-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                } shadow-2xl`}>
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse ${
                    confirmAction.type === 'reset' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}></div>
                  {confirmAction.type === 'reset' ? (
                    <ArrowPathIcon className="relative w-12 h-12 text-white drop-shadow-lg" />
                  ) : (
                    <CheckCircleIcon className="relative w-12 h-12 text-white drop-shadow-lg" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-3xl font-black text-center mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {confirmAction.title}
              </h3>

              {/* Message */}
              <p className="text-gray-300 text-center text-lg mb-8 leading-relaxed">
                {confirmAction.message}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 px-6 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  انصراف
                </button>

                <button
                  onClick={confirmAction.onConfirm}
                  className={`flex-1 py-4 px-6 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl relative overflow-hidden group ${
                    confirmAction.type === 'reset'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 hover:shadow-orange-500/50'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:shadow-purple-500/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    تایید
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Module Toggle Component (for big toggle in settings)
 */
function MainModuleToggle({
  enabled,
  onChange
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-2xl font-black text-white mb-2">🚀 وضعیت ماژول</h4>
        <p className="text-purple-200 text-lg">فعال یا غیرفعال کردن کل ماژول Next Rocket</p>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!enabled)}
        className="relative inline-flex items-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-500/50 rounded-full"
      >
        <div className={`relative w-20 h-10 rounded-full transition-all duration-500 ${
          enabled 
            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-2xl shadow-green-500/50' 
            : 'bg-slate-600 shadow-inner'
        }`}>
          {enabled && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 blur-lg opacity-60 animate-pulse"></div>
          )}
          <div className={`absolute top-1 transition-all duration-500 ${
            enabled ? 'right-1' : 'right-11'
          } w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center transform ${
            enabled ? 'rotate-[360deg] scale-110' : 'rotate-0'
          }`}>
            {enabled ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

/**
 * Toggle Setting Component
 */
function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description?: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
}) {
  const isChecked = checked || false; // Fix: default to false if undefined
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !isChecked;
    onChange(newValue);
    
    // نمایش Toast برای فیدبک فوری
    if (newValue) {
      toast.success(`✅ ${label} فعال شد`, {
        duration: 1500,
        position: 'top-left',
        icon: '🟢',
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '1rem',
          padding: '0.75rem 1.25rem',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
        }
      });
    } else {
      toast(`⏸️ ${label} غیرفعال شد`, {
        duration: 1500,
        position: 'top-left',
        icon: '⚪',
        style: {
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '1rem',
          padding: '0.75rem 1.25rem',
          boxShadow: '0 10px 25px rgba(107, 114, 128, 0.3)',
        }
      });
    }
  };

  return (
    <div className="group flex items-center justify-between py-4 px-5 rounded-2xl border-2 border-slate-700/30 hover:border-purple-500/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
      <div className="flex-1">
        <label className="text-base font-bold text-gray-200 block group-hover:text-white transition-colors cursor-pointer" onClick={handleToggle}>
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">{description}</p>
        )}
      </div>
      
      {/* Premium Toggle Switch */}
      <button 
        type="button"
        onClick={handleToggle}
        className="relative inline-flex items-center cursor-pointer ml-4 focus:outline-none focus:ring-4 focus:ring-purple-500/50 rounded-full"
      >
        <div className={`relative w-16 h-8 rounded-full transition-all duration-500 ${
          isChecked 
            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/50' 
            : 'bg-slate-600 shadow-inner'
        }`}>
          {/* Glow Effect when ON */}
          {isChecked && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 blur-md opacity-60 animate-pulse"></div>
          )}
          
          {/* Toggle Circle */}
          <div className={`absolute top-1 transition-all duration-500 ${
            isChecked ? 'right-1' : 'right-9'
          } w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transform ${
            isChecked ? 'rotate-[360deg]' : 'rotate-0'
          }`}>
            {isChecked ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            ) : (
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

/**
 * Number Input Component
 */
function NumberInput({ 
  label, 
  value, 
  onChange, 
  min, 
  max 
}: { 
  label: string; 
  value: number; 
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="group">
      <label className="block text-base font-bold text-gray-200 mb-3 group-hover:text-white transition-colors">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        min={min}
        max={max}
        className="w-full px-5 py-4 bg-slate-700/50 border-2 border-slate-600 text-white text-lg font-semibold rounded-2xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 hover:bg-slate-600/50 hover:border-slate-500"
      />
      <p className="text-sm text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">
        بین {min} تا {max}
      </p>
    </div>
  );
}
