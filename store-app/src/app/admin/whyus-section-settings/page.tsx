"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const defaultSettings = {
  title: "چرا فروشگاه دیجیتال را انتخاب کنیم؟",
  subtitle: "ما بهترین تجربه خرید را با این مزایای شگفت‌انگیز فراهم می‌کنیم",
  items: [
    {
      icon: "fast",
      title: "ارسال سریع",
      description:
        "ارسال رایگان برای سفارش‌های بالای ۵۰ دلار. محصولات خود را سریع با گزینه‌های ارسال فوری دریافت کنید."
    },
    {
      icon: "quality",
      title: "تضمین کیفیت",
      description:
        "۱۰۰٪ تضمین رضایت. اگر کاملاً راضی نیستید، هر محصولی را ظرف ۳۰ روز بازگردانید."
    },
    {
      icon: "support",
      title: "پشتیبانی ۲۴/۷",
      description:
        "تیم پشتیبانی اختصاصی ما در هر زمان و هر مکان آماده کمک به شما است. هر وقت به کمک نیاز داشتید، با ما تماس بگیرید."
    }
  ]
};

export default function WhyUsSectionSettingsPage() {
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/whyus-section-settings");
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { _id, ...settingsToSend } = settings || {};
      const response = await fetch("/api/admin/whyus-section-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSend)
      });
      const data = await response.json();
      if (data.success) {
        alert("تنظیمات با موفقیت ذخیره شد");
      }
    } catch {
      alert("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="text-center text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">تنظیمات بخش چرا فروشگاه ما؟</h1>
          <Link href="/admin/content" className="text-blue-400 hover:underline">بازگشت</Link>
        </div>
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div>
            <label className="block text-gray-300 mb-2">عنوان اصلی</label>
            <input
              type="text"
              value={settings.title}
              onChange={e => setSettings({ ...settings, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">زیرعنوان</label>
            <input
              type="text"
              value={settings.subtitle}
              onChange={e => setSettings({ ...settings, subtitle: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">مزایا</label>
            {settings.items.map((item: any, idx: number) => (
              <div key={idx} className="mb-4 p-3 rounded-lg bg-gray-900/30">
                <input
                  type="text"
                  value={item.title}
                  onChange={e => {
                    const items = [...settings.items];
                    items[idx].title = e.target.value;
                    setSettings({ ...settings, items });
                  }}
                  className="w-full px-4 py-2 mb-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
                  placeholder="عنوان مزیت"
                />
                <textarea
                  value={item.description}
                  onChange={e => {
                    const items = [...settings.items];
                    items[idx].description = e.target.value;
                    setSettings({ ...settings, items });
                  }}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white"
                  placeholder="توضیحات مزیت"
                  rows={2}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              disabled={saving}
            >{saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
