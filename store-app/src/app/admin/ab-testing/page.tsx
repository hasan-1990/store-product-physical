'use client';

import { useState } from 'react';
import { ABTestManagement } from '@/components/admin/ABTestManagement';
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics';

export default function ABTestingPage() {
  const [activeTab, setActiveTab] = useState<'management' | 'analytics'>('management');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">A/B Testing</h1>
          <p className="text-gray-300 mt-1">آزمایش و بهینه‌سازی تجربه کاربری</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-reverse space-x-8">
          <button
            onClick={() => setActiveTab('management')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'management'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            مدیریت تست‌ها
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            آمار و گزارشات
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'management' && <ABTestManagement />}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
      </div>
    </div>
  );
}