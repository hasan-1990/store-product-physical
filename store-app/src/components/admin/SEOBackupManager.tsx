'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiUpload, 
  FiTrash2, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BackupFile {
  name: string;
  size: number;
  created: string;
  metadata?: {
    totalPages: number;
    activePages: number;
    inactivePages: number;
  };
}

/**
 * کامپوننت مدیریت پشتیبان‌های SEO
 */
export default function SEOBackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  /**
   * بارگذاری لیست پشتیبان‌ها
   */
  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/seo/backup?action=list');
      const data = await response.json();

      if (data.success) {
        setBackups(data.backups || []);
      } else {
        toast.error('خطا در بارگذاری پشتیبان‌ها');
      }
    } catch (error) {
      console.error('خطا در بارگذاری پشتیبان‌ها:', error);
      toast.error('خطا در بارگذاری پشتیبان‌ها');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ایجاد پشتیبان جدید
   */
  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/admin/seo/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('پشتیبان با موفقیت ایجاد شد');
        await loadBackups();
      } else {
        toast.error(data.error || 'خطا در ایجاد پشتیبان');
      }
    } catch (error) {
      console.error('خطا در ایجاد پشتیبان:', error);
      toast.error('خطا در ایجاد پشتیبان');
    } finally {
      setCreating(false);
    }
  };

  /**
   * بازگردانی از پشتیبان
   */
  const restoreBackup = async (fileName: string) => {
    const confirmed = confirm(
      `آیا مطمئن هستید که می‌خواهید از پشتیبان "${fileName}" بازگردانی کنید؟\n\n⚠️ تنظیمات فعلی جایگزین می‌شود!`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/seo/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', fileName })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('پشتیبان با موفقیت بازگردانی شد');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || 'خطا در بازگردانی پشتیبان');
      }
    } catch (error) {
      console.error('خطا در بازگردانی پشتیبان:', error);
      toast.error('خطا در بازگردانی پشتیبان');
    }
  };

  /**
   * حذف پشتیبان
   */
  const deleteBackup = async (fileName: string) => {
    const confirmed = confirm(
      `آیا مطمئن هستید که می‌خواهید پشتیبان "${fileName}" را حذف کنید؟`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/seo/backup?file=${encodeURIComponent(fileName)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('پشتیبان با موفقیت حذف شد');
        await loadBackups();
      } else {
        toast.error(data.error || 'خطا در حذف پشتیبان');
      }
    } catch (error) {
      console.error('خطا در حذف پشتیبان:', error);
      toast.error('خطا در حذف پشتیبان');
    }
  };

  /**
   * فرمت کردن حجم فایل
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * فرمت کردن تاریخ
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت پشتیبان‌های SEO</h2>
          <p className="text-gray-400 mt-1">
            ایجاد و بازگردانی پشتیبان از تنظیمات SEO
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBackups}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            بروزرسانی
          </button>
          <button
            onClick={createBackup}
            disabled={creating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FiDownload />
            {creating ? 'در حال ایجاد...' : 'ایجاد پشتیبان'}
          </button>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">تعداد پشتیبان‌ها</p>
              <p className="text-2xl font-bold text-white mt-1">{backups.length}</p>
            </div>
            <FiClock className="text-purple-500 text-3xl" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">آخرین پشتیبان</p>
              <p className="text-sm font-medium text-white mt-1">
                {backups.length > 0 
                  ? new Date(backups[0].created).toLocaleDateString('fa-IR')
                  : 'بدون پشتیبان'}
              </p>
            </div>
            <FiCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">حجم کل</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
              </p>
            </div>
            <FiAlertCircle className="text-blue-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* لیست پشتیبان‌ها */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  نام فایل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  تاریخ ایجاد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  حجم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  صفحات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin ml-2"></div>
                      در حال بارگذاری...
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    هیچ پشتیبانی وجود ندارد
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.name} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {backup.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(backup.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {backup.metadata ? (
                        <span>
                          {backup.metadata.totalPages} صفحه
                          <span className="text-green-400 mr-2">
                            ({backup.metadata.activePages} فعال)
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => restoreBackup(backup.name)}
                          className="p-2 text-green-400 hover:bg-green-900/30 rounded transition-colors"
                          title="بازگردانی"
                        >
                          <FiUpload />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.name)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                          title="حذف"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* راهنما */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
          <FiAlertCircle className="ml-2" />
          راهنما
        </h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• پشتیبان‌ها به صورت خودکار هر ۲۴ ساعت ایجاد می‌شوند</li>
          <li>• حداکثر ۳۰ پشتیبان نگهداری می‌شود</li>
          <li>• بازگردانی از پشتیبان، تنظیمات فعلی را جایگزین می‌کند</li>
          <li>• قبل از تغییرات مهم، حتماً پشتیبان بگیرید</li>
        </ul>
      </div>
    </div>
  );
}
