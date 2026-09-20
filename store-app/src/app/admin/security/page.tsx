"use client";

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ChartBarIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ServerIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface SecuritySettings {
  rateLimit: any;
  logging: any;
  authentication: any;
  fileUpload: any;
  database: any;
  headers: any;
  ipBlocking: any;
  notifications: any;
  advanced: any;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
}

export default function SecurityManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Helper function to get headers with JWT token
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const showToast = (type: Toast['type'], message: string, description?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      if (activeTab === 'overview' || activeTab === 'settings') {
        const res = await fetch('/api/admin/security/settings', {
          credentials: 'include',
          headers
        });
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        }
      }

      if (activeTab === 'overview' || activeTab === 'logs') {
        const res = await fetch('/api/admin/security/logs?hours=24&limit=50', {
          credentials: 'include',
          headers
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.recentLogs || []);
          setStats(data.data.stats || {});
        }
      }

      if (activeTab === 'blocked-ips') {
        const res = await fetch('/api/admin/security/blocked-ips', {
          credentials: 'include',
          headers
        });
        const data = await res.json();
        if (data.success) {
          setBlockedIPs(data.data.blockedIPs || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'خطا در بارگذاری داده', 'نمی‌توان اطلاعات را دریافت کرد');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'تنظیمات ذخیره شد', 'تنظیمات امنیتی با موفقیت بروزرسانی شد');
        loadData();
      } else {
        showToast('error', 'خطا در ذخیره', data.message || 'امکان ذخیره تنظیمات وجود ندارد');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'خطا در ذخیره تنظیمات', 'لطفا دوباره تلاش کنید');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    showToast('warning', 'در حال بازگشت به پیش‌فرض', 'تنظیمات در حال بازگردانی است...');

    try {
      const res = await fetch('/api/admin/security/settings', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'بازگشت موفق', 'تنظیمات به حالت پیش‌فرض بازگشت');
        loadData();
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const blockIP = async () => {
    const ip = prompt('IP مورد نظر را وارد کنید:');
    if (!ip) return;

    const reason = prompt('دلیل بلاک کردن:') || 'Blocked by admin';
    const duration = prompt('مدت زمان بلاک (ساعت) - خالی = دائمی:');

    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ip,
          reason,
          durationHours: duration ? parseInt(duration) : null
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'IP بلاک شد', `آدرس ${ip} با موفقیت بلاک شد`);
        loadData();
      } else {
        showToast('error', 'خطا در بلاک', data.message || 'امکان بلاک کردن IP وجود ندارد');
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
      showToast('error', 'خطا در ارتباط', 'لطفا دوباره تلاش کنید');
    }
  };

  const unblockIP = async (ip: string) => {
    // Note: در نسخه بعدی می‌توان یک modal تایید اضافه کرد

    try {
      const res = await fetch(`/api/admin/security/blocked-ips?ip=${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'IP آزاد شد', `آدرس ${ip} از بلاک خارج شد`);
        loadData();
      } else {
        showToast('error', 'خطا در حذف بلاک', data.message || 'امکان حذف بلاک وجود ندارد');
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
      showToast('error', 'خطا در ارتباط', 'لطفا دوباره تلاش کنید');
    }
  };

  const exportLogs = async () => {
    showToast('info', 'در حال دانلود', 'فایل CSV در حال آماده‌سازی است...');
    
    try {
      const res = await fetch('/api/admin/security/logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ hours: 24 })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${Date.now()}.csv`;
        a.click();
        showToast('success', 'دانلود موفق', 'فایل لاگ‌ها با موفقیت دانلود شد');
      } else {
        showToast('error', 'خطا در دانلود', 'امکان دانلود فایل وجود ندارد');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      showToast('error', 'خطا در دانلود', 'لطفا دوباره تلاش کنید');
    }
  };

  const tabs = [
    { id: 'overview', name: 'داشبورد', icon: ChartBarIcon },
    { id: 'settings', name: 'تنظیمات', icon: ShieldCheckIcon },
    { id: 'logs', name: 'لاگ‌ها', icon: DocumentTextIcon },
    { id: 'blocked-ips', name: 'IP های بلاک شده', icon: XMarkIcon },
    { id: 'audit', name: 'تاریخچه تغییرات', icon: ClockIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-pink-50/30 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                مدیریت امنیت
              </h1>
              <p className="text-gray-600 mt-1">
                مدیریت تنظیمات امنیتی، لاگ‌ها و نظارت بر سیستم
              </p>
            </div>
          </div>
        </div>

        {/* Security Score Card */}
        {stats && (
          <div className="bg-gradient-to-br from-red-500 via-pink-500 to-pink-600 rounded-2xl shadow-xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm opacity-90 mb-2">نمره امنیتی</div>
                <div className="text-4xl font-bold mb-1">92/100</div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-lg">🏆</span>
                  <span>عالی</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm opacity-90 mb-2">ورود ناموفق (24h)</div>
                <div className="text-3xl font-bold">{stats.failedLogins || 0}</div>
                <div className="text-xs opacity-75 mt-1">تلاش‌های ناموفق</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm opacity-90 mb-2">نقض امنیتی (24h)</div>
                <div className="text-3xl font-bold">{stats.securityViolations || 0}</div>
                <div className="text-xs opacity-75 mt-1">هشدار امنیتی</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-sm opacity-90 mb-2">فعالیت مشکوک (24h)</div>
                <div className="text-3xl font-bold">{stats.suspiciousActivities || 0}</div>
                <div className="text-xs opacity-75 mt-1">رفتار غیرعادی</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 mb-6">
          <div className="border-b border-gray-200/50">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-red-500 text-red-600 bg-red-50/50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                  <ShieldCheckIcon className="w-8 h-8 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-gray-600 mt-4">در حال بارگذاری...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                        <ChartBarIcon className="w-6 h-6 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">داشبورد امنیتی</h2>
                    </div>
                    
                    {/* Recent Logs */}
                    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200/50 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-red-600" />
                        آخرین رویدادها
                      </h3>
                      <div className="space-y-2">
                        {logs.slice(0, 10).map((log, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200">
                            <div className={`w-3 h-3 rounded-full shadow-lg ${
                              log.eventType === 'FAILED_LOGIN' ? 'bg-red-500 shadow-red-200' :
                              log.eventType === 'SUCCESSFUL_LOGIN' ? 'bg-green-500 shadow-green-200' :
                              log.eventType === 'SECURITY_VIOLATION' ? 'bg-orange-500 shadow-orange-200' :
                              'bg-blue-500 shadow-blue-200'
                            }`} />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{log.eventType}</div>
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{log.ip}</span>
                                <span>•</span>
                                <span>{log.userId || 'ناشناس'}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                              {new Date(log.createdAt).toLocaleString('fa-IR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && settings && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                          <ShieldCheckIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">تنظیمات امنیتی</h2>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={resetSettings}
                          className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                          بازگشت به پیش‌فرض
                        </button>
                        <button
                          onClick={saveSettings}
                          disabled={saving}
                          className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-red-500/30 transition-all duration-200 flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              در حال ذخیره...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-5 h-5" />
                              ذخیره تنظیمات
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Rate Limiting */}
                    <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                          <ServerIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        محدودیت درخواست (Rate Limiting)
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={settings.rateLimit.enabled}
                              onChange={(e) => setSettings({
                                ...settings,
                                rateLimit: { ...settings.rateLimit, enabled: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-pink-500 transition-all duration-200"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
                          </div>
                          <span className="font-medium text-gray-700 group-hover:text-gray-900">فعال‌سازی محدودیت</span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                            <label className="block text-sm font-semibold mb-2 text-purple-900">
                              Auth Endpoints
                            </label>
                            <input
                              type="number"
                              value={settings.rateLimit.auth.maxRequests}
                              onChange={(e) => setSettings({
                                ...settings,
                                rateLimit: {
                                  ...settings.rateLimit,
                                  auth: { ...settings.rateLimit.auth, maxRequests: parseInt(e.target.value) }
                                }
                              })}
                              className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                            />
                            <span className="text-xs text-purple-600 mt-1 block">درخواست در 15 دقیقه</span>
                          </div>

                          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                            <label className="block text-sm font-semibold mb-2 text-blue-900">
                              Admin Endpoints
                            </label>
                            <input
                              type="number"
                              value={settings.rateLimit.admin.maxRequests}
                              onChange={(e) => setSettings({
                                ...settings,
                                rateLimit: {
                                  ...settings.rateLimit,
                                  admin: { ...settings.rateLimit.admin, maxRequests: parseInt(e.target.value) }
                                }
                              })}
                              className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                            />
                            <span className="text-xs text-blue-600 mt-1 block">درخواست در 15 دقیقه</span>
                          </div>

                          <div className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                            <label className="block text-sm font-semibold mb-2 text-green-900">
                              General API
                            </label>
                            <input
                              type="number"
                              value={settings.rateLimit.general.maxRequests}
                              onChange={(e) => setSettings({
                                ...settings,
                                rateLimit: {
                                  ...settings.rateLimit,
                                  general: { ...settings.rateLimit.general, maxRequests: parseInt(e.target.value) }
                                }
                              })}
                              className="w-full px-4 py-2.5 border-2 border-green-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                            />
                            <span className="text-xs text-green-600 mt-1 block">درخواست در 15 دقیقه</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logging */}
                    <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        لاگ‌گیری (Logging)
                      </h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={settings.logging.enabled}
                              onChange={(e) => setSettings({
                                ...settings,
                                logging: { ...settings.logging, enabled: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-pink-500 transition-all duration-200"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
                          </div>
                          <span className="font-medium text-gray-700 group-hover:text-gray-900">فعال‌سازی لاگ‌گیری</span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-red-50/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={settings.logging.logFailedLogins}
                              onChange={(e) => setSettings({
                                ...settings,
                                logging: { ...settings.logging, logFailedLogins: e.target.checked }
                              })}
                              className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">ورود ناموفق</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-green-50/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={settings.logging.logSuccessfulLogins}
                              onChange={(e) => setSettings({
                                ...settings,
                                logging: { ...settings.logging, logSuccessfulLogins: e.target.checked }
                              })}
                              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">ورود موفق</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-orange-50/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={settings.logging.logSuspiciousActivity}
                              onChange={(e) => setSettings({
                                ...settings,
                                logging: { ...settings.logging, logSuspiciousActivity: e.target.checked }
                              })}
                              className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">فعالیت مشکوک</span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings.logging.logAPIErrors}
                              onChange={(e) => setSettings({
                                ...settings,
                                logging: { ...settings.logging, logAPIErrors: e.target.checked }
                              })}
                              className="rounded"
                            />
                            <span className="text-sm">خطاهای API</span>
                          </label>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">
                            مدت نگهداری لاگ‌ها (روز)
                          </label>
                          <input
                            type="number"
                            value={settings.logging.retentionDays}
                            onChange={(e) => setSettings({
                              ...settings,
                              logging: { ...settings.logging, retentionDays: parseInt(e.target.value) }
                            })}
                            className="w-32 px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Authentication */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <LockClosedIcon className="w-5 h-5" />
                        احراز هویت (Authentication)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            زمان انقضای Session (دقیقه)
                          </label>
                          <input
                            type="number"
                            value={settings.authentication.sessionTimeout / 60000}
                            onChange={(e) => setSettings({
                              ...settings,
                              authentication: {
                                ...settings.authentication,
                                sessionTimeout: parseInt(e.target.value) * 60000
                              }
                            })}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            حداکثر تلاش ورود ناموفق
                          </label>
                          <input
                            type="number"
                            value={settings.authentication.maxLoginAttempts}
                            onChange={(e) => setSettings({
                              ...settings,
                              authentication: {
                                ...settings.authentication,
                                maxLoginAttempts: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            حداقل طول رمز عبور
                          </label>
                          <input
                            type="number"
                            value={settings.authentication.passwordMinLength}
                            onChange={(e) => setSettings({
                              ...settings,
                              authentication: {
                                ...settings.authentication,
                                passwordMinLength: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            حداکثر Session همزمان
                          </label>
                          <input
                            type="number"
                            value={settings.authentication.maxConcurrentSessions}
                            onChange={(e) => setSettings({
                              ...settings,
                              authentication: {
                                ...settings.authentication,
                                maxConcurrentSessions: parseInt(e.target.value)
                              }
                            })}
                            className="w-full px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">آپلود فایل</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.fileUpload.enabled}
                            onChange={(e) => setSettings({
                              ...settings,
                              fileUpload: { ...settings.fileUpload, enabled: e.target.checked }
                            })}
                            className="rounded"
                          />
                          <span>فعال</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            حداکثر حجم فایل (مگابایت)
                          </label>
                          <input
                            type="number"
                            value={settings.fileUpload.maxFileSize / 1048576}
                            onChange={(e) => setSettings({
                              ...settings,
                              fileUpload: {
                                ...settings.fileUpload,
                                maxFileSize: parseInt(e.target.value) * 1048576
                              }
                            })}
                            className="w-32 px-3 py-2 border rounded"
                          />
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.fileUpload.checkMagicNumber}
                            onChange={(e) => setSettings({
                              ...settings,
                              fileUpload: { ...settings.fileUpload, checkMagicNumber: e.target.checked }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">بررسی Magic Number</span>
                        </label>
                      </div>
                    </div>

                    {/* IP Blocking */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">بلاک کردن IP</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.ipBlocking.enabled}
                            onChange={(e) => setSettings({
                              ...settings,
                              ipBlocking: { ...settings.ipBlocking, enabled: e.target.checked }
                            })}
                            className="rounded"
                          />
                          <span>فعال</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={settings.ipBlocking.autoBlockOnFailedLogins}
                            onChange={(e) => setSettings({
                              ...settings,
                              ipBlocking: { ...settings.ipBlocking, autoBlockOnFailedLogins: e.target.checked }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">بلاک خودکار بعد از ورود ناموفق</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            تعداد تلاش ناموفق برای بلاک
                          </label>
                          <input
                            type="number"
                            value={settings.ipBlocking.failedLoginThreshold}
                            onChange={(e) => setSettings({
                              ...settings,
                              ipBlocking: {
                                ...settings.ipBlocking,
                                failedLoginThreshold: parseInt(e.target.value)
                              }
                            })}
                            className="w-32 px-3 py-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                          <DocumentTextIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">لاگ‌های امنیتی</h2>
                      </div>
                      <button
                        onClick={exportLogs}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-medium shadow-lg shadow-green-500/30 transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        دانلود CSV
                      </button>
                    </div>

                    <div className="space-y-3">
                      {logs.map((log, idx) => (
                        <div key={idx} className="bg-white border border-gray-200/50 rounded-xl p-5 hover:border-red-200 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  log.eventType === 'FAILED_LOGIN' ? 'bg-red-500' :
                                  log.eventType === 'SUCCESSFUL_LOGIN' ? 'bg-green-500' :
                                  log.eventType === 'SECURITY_VIOLATION' ? 'bg-orange-500' :
                                  'bg-blue-500'
                                }`}></span>
                                <span className="font-semibold text-gray-900">{log.eventType}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="px-2.5 py-1 bg-gray-100 rounded-md font-mono text-xs">{log.ip}</span>
                                <span className="text-gray-400">•</span>
                                <span>{log.userId || 'ناشناس'}</span>
                              </div>
                              {log.details && (
                                <pre className="text-xs text-gray-600 mt-3 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg whitespace-nowrap mr-4">
                              {new Date(log.createdAt).toLocaleString('fa-IR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocked IPs Tab */}
                {activeTab === 'blocked-ips' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                          <XMarkIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">IP های بلاک شده</h2>
                      </div>
                      <button
                        onClick={blockIP}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-medium shadow-lg shadow-red-500/30 transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        بلاک کردن IP جدید
                      </button>
                    </div>

                    <div className="space-y-3">
                      {blockedIPs.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-5 bg-white border border-red-100 rounded-xl hover:border-red-200 hover:shadow-md transition-all duration-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                              <span className="font-bold text-gray-900 font-mono">{item.ip}</span>
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">دلیل:</span> {item.reason}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.isPermanent ? (
                                <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-lg font-medium">دائمی</span>
                              ) : (
                                <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg">
                                  تا {new Date(item.expiresAt).toLocaleString('fa-IR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => unblockIP(item.ip)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 font-medium transition-all duration-200 flex items-center gap-2 shadow-md"
                          >
                            <CheckIcon className="w-4 h-4" />
                            حذف بلاک
                          </button>
                        </div>
                      ))}

                      {blockedIPs.length === 0 && (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckIcon className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg">IP بلاک شده‌ای وجود ندارد</p>
                          <p className="text-gray-400 text-sm mt-2">سیستم شما در حال حاضر IP بلاک شده‌ای ندارد</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 left-4 z-50 space-y-3" dir="ltr">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl backdrop-blur-sm
              transform transition-all duration-300 ease-out animate-slideIn
              ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <XMarkIcon className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'warning' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0" dir="rtl">
              <div className="font-bold text-sm">{toast.message}</div>
              {toast.description && (
                <div className="text-xs mt-1 opacity-90">{toast.description}</div>
              )}
            </div>

            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
