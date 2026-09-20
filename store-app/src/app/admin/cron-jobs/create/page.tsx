'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CRON_TASK_TEMPLATES, CRON_PRESETS, type CronTaskTemplate } from '@/types/cron';

export default function CreateCronJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateType = searchParams.get('template');

  const [template, setTemplate] = useState<CronTaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    taskType: templateType || 'custom',
    schedule: '0 * * * *',
    enabled: true,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    config: {} as Record<string, any>,
    maxLogs: 100
  });

  const [loading, setLoading] = useState(false);
  const [schedulePreview, setSchedulePreview] = useState('');

  useEffect(() => {
    if (templateType) {
      const foundTemplate = CRON_TASK_TEMPLATES.find(t => t.taskType === templateType);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        setFormData(prev => ({
          ...prev,
          name: foundTemplate.name,
          description: foundTemplate.description,
          schedule: foundTemplate.defaultSchedule,
          taskType: foundTemplate.taskType
        }));

        // Set default config values
        if (foundTemplate.configFields) {
          const defaultConfig: Record<string, any> = {};
          foundTemplate.configFields.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultConfig[field.name] = field.defaultValue;
            }
          });
          setFormData(prev => ({ ...prev, config: defaultConfig }));
        }
      }
    }
  }, [templateType]);

  const handleConfigChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [fieldName]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/cron-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('وظیفه با موفقیت ایجاد شد');
        router.push('/admin/cron-jobs');
      } else {
        toast.error(data.error || 'خطا در ایجاد وظیفه');
      }
    } catch (error) {
      console.error('Create job error:', error);
      toast.error('خطا در ایجاد وظیفه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg mb-6 border border-purple-500/30"
          >
            <svg className="w-5 h-5 text-purple-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-purple-300 font-medium">بازگشت</span>
          </button>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl font-bold text-white mb-2">
              ایجاد وظیفه خودکار جدید
            </h1>
            {template && (
              <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <span className="text-5xl">{template.icon}</span>
                <div>
                  <div className="text-xl font-bold text-white">{template.name}</div>
                  <div className="text-purple-100 text-sm">{template.description}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-8 border border-purple-500/30">
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📝</span>
            <span>اطلاعات پایه</span>
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              نام وظیفه *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900/50 border-2 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-500"
              placeholder="نام وظیفه را وارد کنید..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              توضیحات
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900/50 border-2 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-500"
              placeholder="توضیحات وظیفه..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                اولویت
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-900/50 border-2 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white"
              >
                <option value="low">🟢 کم</option>
                <option value="medium">🟡 متوسط</option>
                <option value="high">🟠 زیاد</option>
                <option value="urgent">🔴 فوری</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                حداکثر لاگ‌ها
              </label>
              <input
                type="number"
                value={formData.maxLogs}
                onChange={(e) => setFormData(prev => ({ ...prev, maxLogs: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-gray-900/50 border-2 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white"
                min="10"
                max="1000"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-xl border-2 border-emerald-500/30">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 text-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <label htmlFor="enabled" className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span>✓</span>
              <span>فعال کردن وظیفه بعد از ایجاد</span>
            </label>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900">زمان‌بندی</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الگوهای از پیش تعریف شده
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, schedule: preset.value }))}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    formData.schedule === preset.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs text-gray-500 font-mono">{preset.value}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cron Expression *
            </label>
            <input
              type="text"
              value={formData.schedule}
              onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="* * * * *"
              required
            />
            <div className="mt-2 text-sm text-gray-600">
              فرمت: دقیقه ساعت روز ماه روز_هفته
            </div>
          </div>
        </div>

        {/* Task Configuration */}
        {template && template.configFields && template.configFields.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900">تنظیمات وظیفه</h2>
            
            {template.configFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData.config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={formData.config[field.name] || field.defaultValue || 0}
                    onChange={(e) => handleConfigChange(field.name, parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
                
                {field.type === 'select' && field.options && (
                  <select
                    value={formData.config[field.name] || field.defaultValue}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    value={formData.config[field.name] || ''}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    rows={6}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ایجاد...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>ایجاد وظیفه</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 text-lg font-bold rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600"
          >
            انصراف
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
