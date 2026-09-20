'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminBlogDashboard() {
  const [, setActiveCard] = useState<string | null>(null);

  const stats = [
    { title: 'کل پست‌ها', value: '24', change: '+12%', icon: '📝', color: 'from-blue-500 to-cyan-500' },
    { title: 'بازدید امروز', value: '1.2K', change: '+8%', icon: '👁️', color: 'from-green-500 to-emerald-500' },
    { title: 'دسته‌بندی‌ها', value: '8', change: '+2', icon: '📂', color: 'from-purple-500 to-violet-500' },
    { title: 'برچسب‌ها', value: '32', change: '+5', icon: '🏷️', color: 'from-pink-500 to-rose-500' }
  ];

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" dir="rtl">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">🚀 پنل مدیریت بلاگ</h1>
              <p className="text-purple-100 text-lg">مدیریت هوشمند محتوای بلاگ شما</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/blog"
                className="px-6 py-3 bg-white/20 backdrop-blur-lg rounded-2xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                مشاهده بلاگ
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onMouseEnter={() => setActiveCard(stat.title)}
            onMouseLeave={() => setActiveCard(null)}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <span className="text-green-400 text-sm font-semibold bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-300 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Posts Management - Large Card */}
        <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl">
                📝
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">مدیریت پست‌ها</h3>
                <p className="text-gray-300">ایجاد، ویرایش و مدیریت محتوای بلاگ</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/blog/posts"
                className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-700/70 transition-all duration-300 group border border-gray-600/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">همه پست‌ها</h4>
                    <p className="text-sm text-gray-300">مشاهده و مدیریت</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/admin/blog/posts/new"
                className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white hover:from-green-500 hover:to-emerald-600 transition-all duration-300 group shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold">پست جدید</h4>
                    <p className="text-sm text-green-100">ایجاد محتوای جدید</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Categories & Tags - Compact Cards */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center text-white">
                  📂
                </div>
                <div>
                  <h3 className="font-bold text-white">دسته‌بندی‌ها</h3>
                  <p className="text-sm text-gray-300">8 دسته فعال</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/admin/blog/categories"
                  className="block bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-gray-700/70 transition-all duration-200 text-sm font-medium text-gray-200 hover:text-purple-400 border border-gray-600/30"
                >
                  📋 مدیریت دسته‌بندی‌ها
                </Link>
                <Link
                  href="/admin/blog/categories/new"
                  className="block bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl p-3 text-white font-medium text-sm hover:from-purple-500 hover:to-violet-600 transition-all duration-200"
                >
                  ➕ دسته‌بندی جدید
                </Link>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-tl from-pink-500/20 to-transparent rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white">
                  🏷️
                </div>
                <div>
                  <h3 className="font-bold text-white">برچسب‌ها</h3>
                  <p className="text-sm text-gray-300">32 برچسب</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/admin/blog/tags"
                  className="block bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-gray-700/70 transition-all duration-200 text-sm font-medium text-gray-200 hover:text-pink-400 border border-gray-600/30"
                >
                  📋 مدیریت برچسب‌ها
                </Link>
                <Link
                  href="/admin/blog/tags/new"
                  className="block bg-gradient-to-r from-pink-400 to-rose-500 rounded-xl p-3 text-white font-medium text-sm hover:from-pink-500 hover:to-rose-600 transition-all duration-200"
                >
                  ➕ برچسب جدید
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white">
              ⚡
            </div>
            فعالیت‌های اخیر
          </h3>
          <span className="text-sm text-gray-300">آخرین 24 ساعت</span>
        </div>
        
        <div className="space-y-4">
          {[
            { action: 'ایجاد پست جدید', title: '"راهنمای طراحی UX"', time: '2 ساعت پیش', type: 'create' },
            { action: 'ویرایش پست', title: '"بهترین ابزارهای توسعه"', time: '4 ساعت پیش', type: 'edit' },
            { action: 'افزودن دسته‌بندی', title: '"فناوری و نوآوری"', time: '6 ساعت پیش', type: 'category' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-700/50 backdrop-blur-sm rounded-2xl hover:bg-gray-700/70 transition-colors border border-gray-600/30">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                activity.type === 'create' ? 'bg-green-500' :
                activity.type === 'edit' ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                {activity.type === 'create' ? '➕' : activity.type === 'edit' ? '✏️' : '📂'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{activity.action}</p>
                <p className="text-sm text-gray-300">{activity.title}</p>
              </div>
              <span className="text-xs text-gray-300 bg-gray-700/50 border border-gray-600/30 px-3 py-1 rounded-full">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}