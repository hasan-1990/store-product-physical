'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { SiteInstance } from '@/types/site-provisioning';

export default function AdminSiteInstanceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [instance, setInstance] = useState<SiteInstance | null>(null);

  useEffect(() => {
    fetch(`/api/admin/site-instances/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInstance(d.instance);
      });
  }, [slug]);

  if (!instance) return <p className="p-6 text-white">بارگذاری...</p>;

  return (
    <div className="p-6 text-white max-w-3xl">
      <Link href="/admin/site-instances" className="text-purple-400 text-sm">
        ← بازگشت
      </Link>
      <h1 className="text-2xl font-bold mt-4">{instance.domain}</h1>
      <p className="text-gray-400">وضعیت: {instance.status}</p>

      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Slug</dt>
          <dd dir="ltr">{instance.slug}</dd>
        </div>
        <div>
          <dt className="text-gray-500">پوشه</dt>
          <dd dir="ltr">{instance.folderPath}</dd>
        </div>
        <div>
          <dt className="text-gray-500">دیتابیس</dt>
          <dd dir="ltr">{instance.databaseName}</dd>
        </div>
        <div>
          <dt className="text-gray-500">پورت</dt>
          <dd>{instance.port}</dd>
        </div>
        <div>
          <dt className="text-gray-500">DNS مورد انتظار</dt>
          <dd dir="ltr">{instance.dnsCheck?.expectedIp || instance.dnsRecords?.value}</dd>
        </div>
        <div>
          <dt className="text-gray-500">IPهای resolve شده</dt>
          <dd dir="ltr">{instance.dnsCheck?.resolvedIps?.join(', ') || '—'}</dd>
        </div>
      </dl>

      {instance.provisionLog && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">لاگ provisioning</h2>
          <ul className="text-xs text-gray-400 space-y-1">
            {instance.provisionLog.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {instance.errorLog && (
        <p className="mt-4 text-red-400 text-sm">{instance.errorLog}</p>
      )}
    </div>
  );
}
