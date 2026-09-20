'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CRON_TASK_TEMPLATES, CRON_PRESETS, type CronJob, type CronLog } from '@/types/cron';

export default function CronJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<CronJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CronJob>>({});

  // Fetch job details
  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.job);
        setFormData(data.job);
      } else {
        toast.error('خطا در بارگذاری وظیفه');
        router.push('/admin/cron-jobs');
      }
    } catch (error) {
      console.error('Fetch job error:', error);
      toast.error('خطا در برقراری ارتباط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('وظیفه با موفقیت به‌روز شد');
        setIsEditing(false);
        fetchJob();
      } else {
        toast.error(data.error || 'خطا در به‌روزرسانی وظیفه');
      }
    } catch (error) {
      console.error('Update job error:', error);
      toast.error('خطا در به‌روزرسانی وظیفه');
    }
  };

  const handleTrigger = async () => {
    try {
      const response = await fetch(`/api/admin/cron-jobs/${jobId}/trigger`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('وظیفه با موفقیت اجرا شد');
        setTimeout(fetchJob, 2000);
      } else {
        toast.error(data.error || 'خطا در اجرای وظیفه');
      }
    } catch (error) {
      console.error('Trigger job error:', error);
      toast.error('خطا در اجرای وظیفه');
    }
  };

  const handleConfigChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [fieldName]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return <div className="p-6 text-center">وظیفه یافت نشد</div>;
  }

  const template = CRON_TASK_TEMPLATES.find(t => t.taskType === job.taskType);
  const successRate = job.runCount > 0 ? ((job.successCount / job.runCount) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
        >
          ← بازگشت
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{template?.icon || '⚙️'}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
              <p className="text-gray-600 mt-1">{job.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTrigger}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ▶️ اجرای دستی
            </button>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                ✏️ ویرایش
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">کل اجراها</div>
          <div className="text-2xl font-bold text-gray-900">{job.runCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">موفقیت</div>
          <div className="text-2xl font-bold text-green-600">{job.successCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">خطا</div>
          <div className="text-2xl font-bold text-red-600">{job.failCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">نرخ موفقیت</div>
          <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">اطلاعات وظیفه</h2>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">زمان‌بندی</label>
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg font-mono"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {CRON_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, schedule: preset.value }))}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اولویت</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="low">کم</option>
                  <option value="medium">متوسط</option>
                  <option value="high">زیاد</option>
                  <option value="urgent">فوری</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled-edit"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="enabled-edit" className="text-sm font-medium text-gray-700">
                  فعال
                </label>
              </div>

              {/* Config Fields */}
              {template?.configFields && template.configFields.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">تنظیمات</h3>
                  {template.configFields.map((field) => (
                    <div key={field.name} className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={formData.config?.[field.name] || field.defaultValue || 0}
                          onChange={(e) => handleConfigChange(field.name, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      )}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={formData.config?.[field.name] || field.defaultValue || ''}
                          onChange={(e) => handleConfigChange(field.name, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      )}
                      {field.type === 'select' && field.options && (
                        <select
                          value={formData.config?.[field.name] || field.defaultValue}
                          onChange={(e) => handleConfigChange(field.name, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ذخیره تغییرات
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(job);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">نوع:</span>
                <span className="font-medium">{template?.name || job.taskType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">زمان‌بندی:</span>
                <span className="font-mono font-medium">{job.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">وضعیت:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  job.status === 'active' ? 'bg-green-100 text-green-800' :
                  job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">اولویت:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  job.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  job.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.priority}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">فعال:</span>
                <span>{job.enabled ? '✅ بله' : '❌ خیر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">آخرین اجرا:</span>
                <span>{job.lastRun ? new Date(job.lastRun).toLocaleString('fa-IR') : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">اجرای بعدی:</span>
                <span>{job.nextRun ? new Date(job.nextRun).toLocaleString('fa-IR') : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">میانگین زمان اجرا:</span>
                <span>{job.averageDuration ? `${job.averageDuration}ms` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ایجاد شده توسط:</span>
                <span>{job.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تاریخ ایجاد:</span>
                <span>{new Date(job.createdAt).toLocaleString('fa-IR')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">لاگ‌های اجرا</h2>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {job.logs && job.logs.length > 0 ? (
              [...job.logs].reverse().map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    log.status === 'success' ? 'bg-green-50 border border-green-200' :
                    log.status === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium ${
                      log.status === 'success' ? 'text-green-800' :
                      log.status === 'error' ? 'text-red-800' :
                      'text-yellow-800'
                    }`}>
                      {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️'} {log.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {log.duration}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(log.timestamp).toLocaleString('fa-IR')}
                  </div>
                  {log.details && (
                    <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                هنوز لاگی ثبت نشده است
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
