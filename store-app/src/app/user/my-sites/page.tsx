'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteInstance } from '@/types/site-provisioning';

const statusMessages: Record<string, string> = {
  awaiting_dns:
    'DNS هنوز ست نشده. رکورد A را به IP سرور تنظیم کنید تا سایت بالا بیاید.',
  dns_mismatch:
    'DNS ست شده ولی IP اشتباه است. IP فعلی با IP سرور مطابقت ندارد.',
  provisioning: 'سایت در حال ساخت است...',
  active: 'سایت شما آماده است.',
  failed: 'خطا در ساخت سایت. با پشتیبانی تماس بگیرید.',
  suspended: 'سایت موقتاً غیرفعال شده است.',
};

export default function UserMySitesPage() {
  const [instances, setInstances] = useState<SiteInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

  const load = () => {
    fetch('/api/user/my-sites')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInstances(d.instances);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCheckDns = async (slug: string) => {
    setChecking(slug);
    await fetch(`/api/user/my-sites/${slug}/check-dns`, { method: 'POST' });
    load();
    setChecking(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">سایت‌های من</h1>
        <p className="text-gray-400 mb-8">وضعیت فروشگاه‌های ایجاد شده با قالب اختصاصی</p>

        {loading ? (
          <p>بارگذاری...</p>
        ) : instances.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center">
            <p className="text-gray-400">هنوز سایتی ندارید.</p>
            <Link href="/templates" className="text-purple-400 mt-4 inline-block hover:underline">
              مشاهده قالب‌ها
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {instances.map((inst) => (
              <div
                key={inst.slug}
                className="bg-white/5 border border-purple-500/20 rounded-xl p-6"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold" dir="ltr">
                      {inst.domain}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">قالب: {inst.templateSlug}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      inst.status === 'active'
                        ? 'bg-green-500/20 text-green-300'
                        : inst.status === 'dns_mismatch'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                <p className="mt-4 text-gray-300 text-sm">
                  {statusMessages[inst.status] || 'در حال پردازش...'}
                </p>

                {(inst.status === 'awaiting_dns' || inst.status === 'dns_mismatch') && (
                  <div className="mt-4 bg-black/30 rounded-lg p-4 text-sm">
                    <p className="font-semibold mb-2">تنظیم DNS:</p>
                    <p>
                      نوع: <code className="text-purple-300">A</code> — Host:{' '}
                      <code className="text-purple-300">@</code> — Value:{' '}
                      <code className="text-green-300" dir="ltr">
                        {inst.dnsCheck?.expectedIp || inst.dnsRecords?.value}
                      </code>
                    </p>
                    {inst.dnsCheck?.resolvedIps?.length ? (
                      <p className="mt-2 text-red-300" dir="ltr">
                        IP فعلی DNS: {inst.dnsCheck.resolvedIps.join(', ')}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleCheckDns(inst.slug)}
                      disabled={checking === inst.slug}
                      className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-sm disabled:opacity-50"
                    >
                      {checking === inst.slug ? 'در حال بررسی...' : 'بررسی مجدد DNS'}
                    </button>
                  </div>
                )}

                {inst.status === 'active' && (
                  <div className="mt-4 space-y-3">
                    <a
                      href={`https://${inst.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-purple-400 hover:underline"
                      dir="ltr"
                    >
                      https://{inst.domain}
                    </a>
                    {inst.tenantAdmin ? (
                      <div className="bg-black/30 rounded-lg p-4 text-sm">
                        <p className="font-semibold mb-2">ورود به پنل ادمین فروشگاه:</p>
                        <p dir="ltr">
                          آدرس:{' '}
                          <a
                            href={`https://${inst.domain}${inst.tenantAdmin.loginPath}`}
                            className="text-purple-300 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            https://{inst.domain}
                            {inst.tenantAdmin.loginPath}
                          </a>
                        </p>
                        <p className="mt-2" dir="ltr">
                          ایمیل: <code className="text-green-300">{inst.tenantAdmin.email}</code>
                        </p>
                        <p className="mt-1" dir="ltr">
                          رمز: <code className="text-green-300">{inst.tenantAdmin.password}</code>
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
