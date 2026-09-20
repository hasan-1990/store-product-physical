'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { SiteTemplate } from '@/types/site-provisioning';

export default function EditSiteTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [template, setTemplate] = useState<SiteTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/site-templates/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTemplate(d.template);
      });
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setSaving(true);
    const res = await fetch(`/api/admin/site-templates/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    setSaving(false);
    if ((await res.json()).success) router.push('/admin/site-templates');
  };

  if (!template) return <p className="p-6 text-white">در حال بارگذاری...</p>;

  return (
    <div className="p-6 max-w-3xl text-white">
      <Link href="/admin/site-templates" className="text-purple-400 text-sm hover:underline">
        ← بازگشت
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">ویرایش: {template.name}</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          value={template.name}
          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          placeholder="نام"
        />
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          rows={2}
          value={template.shortDescription}
          onChange={(e) => setTemplate({ ...template, shortDescription: e.target.value })}
          placeholder="توضیح کوتاه"
        />
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          rows={6}
          value={template.description}
          onChange={(e) => setTemplate({ ...template, description: e.target.value })}
          placeholder="توضیح کامل"
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          value={template.thumbnail || ''}
          onChange={(e) => setTemplate({ ...template, thumbnail: e.target.value })}
          placeholder="تصویر"
        />
        <h3 className="text-purple-300 font-semibold">SEO</h3>
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          value={template.seo?.title || ''}
          onChange={(e) =>
            setTemplate({ ...template, seo: { ...template.seo, title: e.target.value } })
          }
          placeholder="عنوان SEO"
        />
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          rows={3}
          value={template.seo?.description || ''}
          onChange={(e) =>
            setTemplate({ ...template, seo: { ...template.seo, description: e.target.value } })
          }
          placeholder="توضیح SEO"
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30"
          value={template.seo?.keywords || ''}
          onChange={(e) =>
            setTemplate({ ...template, seo: { ...template.seo, keywords: e.target.value } })
          }
          placeholder="کلمات کلیدی"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={template.active}
            onChange={(e) => setTemplate({ ...template, active: e.target.checked })}
          />
          فعال
        </label>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-purple-600 rounded-lg disabled:opacity-50"
        >
          {saving ? 'ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </form>
    </div>
  );
}
