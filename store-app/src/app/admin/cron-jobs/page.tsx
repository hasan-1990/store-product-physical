'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import type { CronJob } from '@/types/cron';
import { CRON_TASK_TEMPLATES, CRON_PRESETS } from '@/types/cron';

export default function CronJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch cron jobs
  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/cron-jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
      } else {
        toast.error('خطا در بارگذاری وظایف');
      }
    } catch (error) {
      console.error('Fetch jobs error:', error);
      toast.error('خطا در برقراری ارتباط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show delete confirmation modal
  const showDeleteConfirmation = (jobId: string, jobName: string) => {
    setJobToDelete({ id: jobId, name: jobName });
    setShowDeleteModal(true);
  };

  // Delete job
  const handleDelete = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('وظیفه با موفقیت حذف شد');
        fetchJobs();
      } else {
        toast.error(data.error || 'خطا در حذف وظیفه');
      }
    } catch (error) {
      console.error('Delete job error:', error);
      toast.error('خطا در حذف وظیفه');
    } finally {
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  // Toggle job enabled status
  const handleToggle = async (jobId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(!currentStatus ? 'وظیفه فعال شد' : 'وظیفه غیرفعال شد');
        fetchJobs();
      } else {
        toast.error(data.error || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      console.error('Toggle job error:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  // Trigger job manually
  const handleTrigger = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobId}/trigger`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('وظیفه با موفقیت اجرا شد');
        setTimeout(fetchJobs, 2000); // Refresh after 2 seconds
      } else {
        toast.error(data.error || 'خطا در اجرای وظیفه');
      }
    } catch (error) {
      console.error('Trigger job error:', error);
      toast.error('خطا در اجرای وظیفه');
    }
  };

  // Status badge colors with gradients
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 border border-emerald-200';
      case 'paused': return 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-700 border border-slate-200';
      case 'error': return 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-700 border border-rose-200';
      case 'running': return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 border border-blue-200 animate-pulse';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  // Priority badge colors with gradients
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-700 border border-red-200';
      case 'high': return 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 border border-orange-200';
      case 'medium': return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-700 border border-yellow-200';
      case 'low': return 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-700 border border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  // Convert cron expression to readable Persian text
  const getCronDescription = (schedule: string): string => {
    const descriptions: Record<string, string> = {
      '* * * * *': 'هر دقیقه',
      '*/5 * * * *': 'هر ۵ دقیقه',
      '*/15 * * * *': 'هر ۱۵ دقیقه',
      '*/30 * * * *': 'هر ۳۰ دقیقه',
      '0 * * * *': 'هر ساعت',
      '0 */6 * * *': 'هر ۶ ساعت',
      '0 0 * * *': 'روزانه نیمه‌شب',
      '0 12 * * *': 'روزانه ظهر',
      '0 0 * * 0': 'هفتگی یکشنبه',
      '0 0 1 * *': 'ماهانه اول ماه'
    };
    return descriptions[schedule] || schedule;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
          <p className="text-purple-400 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                مدیریت وظایف خودکار
              </h1>
              <p className="text-gray-300 text-lg">
                مدیریت و زمان‌بندی وظایف خودکار سیستم (Cron Jobs)
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>وظیفه جدید</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="group bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">کل وظایف</div>
                  <div className="text-3xl font-bold text-white">
                    {jobs.length}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  ⚙️
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">فعال</div>
                  <div className="text-3xl font-bold text-green-400">
                    {jobs.filter(j => j.enabled && j.status === 'active').length}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  ✓
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">غیرفعال</div>
                  <div className="text-3xl font-bold text-gray-400">
                    {jobs.filter(j => !j.enabled).length}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  ⏸
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">خطاها</div>
                  <div className="text-3xl font-bold text-red-400">
                    {jobs.filter(j => j.status === 'error').length}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  ⚠️
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table or Empty State */}
        {jobs.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20 p-16">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-300 text-lg font-medium">هیچ وظیفه‌ای یافت نشد</p>
              <p className="text-gray-400 text-sm mt-2">برای شروع یک وظیفه جدید ایجاد کنید</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-500/20">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/50">
                <thead className="bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-bold text-purple-300 uppercase tracking-wider w-16">
                      #
                    </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    نام وظیفه
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    نوع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    زمان‌بندی
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    اولویت
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    آخرین اجرا
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    آمار
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/50 divide-y divide-gray-700/30">
                {jobs.map((job) => {
                  const template = CRON_TASK_TEMPLATES.find(t => t.taskType === job.taskType);
                  const successRate = job.runCount > 0 
                    ? ((job.successCount / job.runCount) * 100).toFixed(0) 
                    : '0';

                  return (
                    <tr key={job._id} className="hover:bg-purple-500/10 transition-colors duration-200">
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 bg-purple-600/30 rounded-lg flex items-center justify-center text-purple-300 font-bold text-sm border border-purple-500/30">
                            {jobs.indexOf(job) + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-xl shadow-md">
                            {template?.icon || '⚙️'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {job.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {job.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-300">
                        {template?.name || job.taskType}
                      </td>
                      <td className="px-2 py-8">
                        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-2">
                          <div className="text-sm font-medium text-white text-center">
                            {getCronDescription(job.schedule)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {job.lastRun ? new Date(job.lastRun).toLocaleString('fa-IR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 px-2 py-1 bg-gray-700/50 rounded text-xs">
                            <span className="text-gray-400">کل</span>
                            <span className="font-bold text-white">{job.runCount}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 px-2 py-1 bg-emerald-900/30 rounded border border-emerald-500/30 text-xs">
                            <span className="text-emerald-400">✓</span>
                            <span className="font-bold text-emerald-300">{job.successCount}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 px-2 py-1 bg-rose-900/30 rounded border border-rose-500/30 text-xs">
                            <span className="text-rose-400">✗</span>
                            <span className="font-bold text-rose-300">{job.failCount}</span>
                          </div>
                          <div className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded">
                            <div className="text-center">
                              <div className="text-sm font-bold text-white">{successRate}%</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => job._id && handleTrigger(job._id)}
                            className="px-3 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-1.5"
                            title="اجرای دستی"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                            </svg>
                            <span>اجرا</span>
                          </button>
                          <button
                            onClick={() => job._id && handleToggle(job._id, job.enabled)}
                            className={`px-3 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${
                              job.enabled 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/50' 
                                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-500/50'
                            }`}
                          >
                            {job.enabled ? (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                              </svg>
                            )}
                            <span>{job.enabled ? 'توقف' : 'فعال'}</span>
                          </button>
                          <Link
                            href={`/admin/cron-jobs/${job._id}`}
                            className="px-3 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>ویرایش</span>
                          </Link>
                          <button
                            onClick={() => job._id && showDeleteConfirmation(job._id, job.name)}
                            className="px-3 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center gap-1.5 col-span-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && jobToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-red-500/30">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                    ⚠️
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">تأیید حذف</h2>
                    <p className="text-red-100 text-sm mt-1">این عملیات غیرقابل بازگشت است</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 text-base mb-2">
                  آیا از حذف این وظیفه مطمئن هستید؟
                </p>
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-white font-semibold">{jobToDelete.name}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setJobToDelete(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50"
                  >
                    حذف قطعی
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-purple-500/30">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5 rounded-t-2xl flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">ایجاد وظیفه خودکار جدید</h2>
                    <p className="text-purple-100 text-sm mt-1">یک قالب را انتخاب کنید</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white text-xl transition-all duration-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Template Selection */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CRON_TASK_TEMPLATES.map((template) => (
                    <button
                      key={template.taskType}
                      onClick={() => {
                        setSelectedTemplate(template.taskType);
                        router.push(`/admin/cron-jobs/create?template=${template.taskType}`);
                      }}
                      className="group relative p-3 bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-lg hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 text-right overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative">
                        <div className="text-2xl mb-1.5">{template.icon}</div>
                        <div className="text-sm font-bold text-white mb-1">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-300 leading-relaxed mb-1.5 line-clamp-2">
                          {template.description}
                        </div>
                        <div className="mt-1.5 px-2 py-1 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded border border-purple-500/30">
                          <code className="text-[10px] text-purple-300 font-mono">
                            {template.defaultSchedule}
                          </code>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
