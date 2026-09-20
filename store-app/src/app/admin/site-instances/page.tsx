'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteInstance } from '@/types/site-provisioning';

const statusLabel: Record<string, string> = {
  pending: 'در انتظار',
  provisioning: 'در حال ساخت',
  awaiting_dns: 'منتظر DNS',
  dns_mismatch: 'DNS اشتباه',
  dns_verified: 'DNS تأیید شد',
  active: 'فعال',
  suspended: 'معلق',
  failed: 'خطا',
};

export default function AdminSiteInstancesPage() {
  const [instances, setInstances] = useState<SiteInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/site-instances')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInstances(d.instances);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const checkDns = async (slug: string) => {
    await fetch(`/api/admin/site-instances/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-dns' }),
    });
    load();
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">سایت‌های مشتریان</h1>
      <p className="text-gray-400 text-sm mb-6">مدیریت instanceهای provisioned</p>

      {loading ? (
        <p>بارگذاری...</p>
      ) : instances.length === 0 ? (
        <p className="text-gray-400">هنوز سایتی ایجاد نشده.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-500/30 text-gray-400">
                <th className="text-right p-2">دامنه</th>
                <th className="text-right p-2">قالب</th>
                <th className="text-right p-2">وضعیت</th>
                <th className="text-right p-2">DB</th>
                <th className="text-right p-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr key={inst.slug} className="border-b border-white/5">
                  <td className="p-2" dir="ltr">
                    {inst.domain}
                  </td>
                  <td className="p-2">{inst.templateSlug}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        inst.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : inst.status === 'dns_mismatch'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {statusLabel[inst.status] || inst.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs" dir="ltr">
                    {inst.databaseName}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => checkDns(inst.slug)}
                      className="text-purple-400 hover:underline text-xs ml-2"
                    >
                      چک DNS
                    </button>
                    <Link
                      href={`/admin/site-instances/${inst.slug}`}
                      className="text-blue-400 hover:underline text-xs"
                    >
                      جزئیات
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
