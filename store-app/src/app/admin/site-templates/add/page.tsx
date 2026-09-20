'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const emptyForm = {
  slug: '',
  name: '',
  folderPath: '',
  shortDescription: '',
  description: '',
  thumbnail: '',
  features: '' as string,
  version: '1.0.0',
  demoUrl: '',
  active: true,
  basePrice: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImage: '',
};

export default function AddSiteTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [folders, setFolders] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/site-templates/scan-folders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFolders(d.folders);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const folderPath = form.folderPath
      ? `site-templates/${form.folderPath}`
      : `site-templates/${form.slug}`;

    const res = await fetch('/api/admin/site-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        folderPath,
        shortDescription: form.shortDescription,
        description: form.description,
        thumbnail: form.thumbnail,
        features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
        version: form.version,
        demoUrl: form.demoUrl,
        active: form.active,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        seo: {
          title: form.seoTitle || form.name,
          description: form.seoDescription || form.shortDescription,
          keywords: form.seoKeywords,
          ogImage: form.ogImage || form.thumbnail,
          canonicalUrl: `/templates/${form.slug}`,
        },
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (data.success) {
      router.push('/admin/site-templates');
    } else {
      setError(data.error || 'خطا در ذخیره');
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', rows?: number) => (
    <div className="mb-4">
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={String(form[key])}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30 text-white"
        />
      ) : (
        <input
          type={type}
          value={String(form[key])}
          onChange={(e) =>
            setForm({ ...form, [key]: type === 'checkbox' ? e.target.checked : e.target.value })
          }
          checked={type === 'checkbox' ? Boolean(form[key]) : undefined}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30 text-white"
          dir={key === 'slug' || key === 'folderPath' ? 'ltr' : undefined}
        />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-3xl text-white">
      <Link href="/admin/site-templates" className="text-purple-400 text-sm hover:underline">
        ← بازگشت به لیست
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">افزودن قالب فروشگاه</h1>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-2">
        <h2 className="text-lg font-semibold text-purple-300 mt-4">اطلاعات پایه</h2>
        {field('نام قالب', 'name')}
        {field('Slug (یکتا)', 'slug')}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">پوشه کد</label>
          <select
            value={form.folderPath}
            onChange={(e) => setForm({ ...form, folderPath: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-purple-500/30 text-white"
          >
            <option value="">— انتخاب یا استفاده از slug —</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        {field('توضیح کوتاه', 'shortDescription')}
        {field('توضیح کامل', 'description', 'text', 5)}
        {field('تصویر شاخص (URL)', 'thumbnail')}
        {field('ویژگی‌ها (هر خط یک مورد)', 'features', 'text', 4)}
        {field('نسخه', 'version')}
        {field('لینک دمو', 'demoUrl')}
        {field('قیمت پیشنهادی (تومان)', 'basePrice', 'number')}

        <h2 className="text-lg font-semibold text-purple-300 mt-6">SEO</h2>
        {field('عنوان SEO', 'seoTitle')}
        {field('توضیحات SEO', 'seoDescription', 'text', 3)}
        {field('کلمات کلیدی', 'seoKeywords')}
        {field('تصویر OG', 'ogImage')}

        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span>فعال (قابل نمایش و فروش)</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg disabled:opacity-50"
        >
          {saving ? 'در حال ذخیره...' : 'ذخیره قالب'}
        </button>
      </form>
    </div>
  );
}
