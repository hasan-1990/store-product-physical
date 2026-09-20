'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteTemplate } from '@/types/site-provisioning';

export default function AdminSiteTemplatesPage() {
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const loadTemplates = () => {
    setLoading(true);
    fetch('/api/admin/site-templates')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTemplates(d.templates);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    const res = await fetch('/api/admin/site-templates/sync', { method: 'POST' });
    const data = await res.json();
    setSyncing(false);
    if (data.success) {
      setSyncMessage(data.message);
      loadTemplates();
    } else {
      setSyncMessage(data.error || 'خطا در همگام‌سازی');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('حذف این قالب؟')) return;
    await fetch(`/api/admin/site-templates/${slug}`, { method: 'DELETE' });
    setTemplates((t) => t.filter((x) => x.slug !== slug));
  };

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">قالب‌های فروشگاه (Managed Site)</h1>
          <p className="text-gray-400 text-sm mt-1">ثبت و مدیریت قالب‌های اختصاصی</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg disabled:opacity-50"
          >
            {syncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی از دیسک'}
          </button>
          <Link
            href="/admin/site-templates/add"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
          >
            + افزودن قالب
          </Link>
        </div>
      </div>

      {syncMessage && (
        <p className="mb-4 text-sm text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2">
          {syncMessage}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400">در حال بارگذاری...</p>
      ) : templates.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-8 text-center border border-purple-500/20">
          <p className="text-gray-300 mb-4">هنوز قالبی ثبت نشده است.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg disabled:opacity-50"
            >
              همگام‌سازی shop-starter-v1 از دیسک
            </button>
            <Link href="/admin/site-templates/add" className="text-purple-400 hover:underline py-2">
              یا دستی ثبت کنید
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.slug}
              className="bg-white/5 border border-purple-500/20 rounded-xl overflow-hidden"
            >
              {t.thumbnail && (
                <img src={t.thumbnail} alt={t.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h2 className="font-bold text-lg">{t.name}</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      t.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {t.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2">{t.shortDescription}</p>
                <p className="text-xs text-gray-500 mt-2" dir="ltr">
                  {t.folderPath}
                </p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/admin/site-templates/${t.slug}/edit`}
                    className="text-sm px-3 py-1 bg-purple-600/50 rounded hover:bg-purple-600"
                  >
                    ویرایش
                  </Link>
                  <Link
                    href={`/templates/${t.slug}`}
                    target="_blank"
                    className="text-sm px-3 py-1 bg-white/10 rounded hover:bg-white/20"
                  >
                    پیش‌نمایش
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.slug)}
                    className="text-sm px-3 py-1 bg-red-600/30 rounded hover:bg-red-600/50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
