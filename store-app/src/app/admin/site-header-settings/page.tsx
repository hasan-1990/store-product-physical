"use client";
import React, { useEffect, useState } from 'react';

export default function SiteHeaderSettingsPage() {
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/site-header-settings')
      .then(res => res.json())
      .then(data => {
        // مقدار پیش‌فرض همان چیزی است که در صفحه اصلی نمایش داده می‌شود
        const defaultTitle = 'فروشگاه هاب';
        const defaultSubtitle = 'به فروشگاه ما خوش آمدید!';
        if (data.success && data.data) {
          setForm({
            title: data.data.title || defaultTitle,
            subtitle: data.data.subtitle || defaultSubtitle,
          });
        } else {
          setForm({ title: defaultTitle, subtitle: defaultSubtitle });
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/admin/site-header-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) setMessage('ذخیره شد');
    else setMessage('خطا در ذخیره');
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-purple-700">تنظیمات هدر سایت</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow p-8">
        <div>
          <label className="block mb-2 text-right font-bold">عنوان</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div>
          <label className="block mb-2 text-right font-bold">زیرعنوان</label>
          <textarea name="subtitle" value={form.subtitle} onChange={handleChange} rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300">
          {loading ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
        {message && <div className="text-center text-green-600 mt-4">{message}</div>}
      </form>
    </div>
  );
}
