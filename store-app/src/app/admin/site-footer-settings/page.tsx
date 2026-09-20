"use client";
import React, { useEffect, useState } from "react";

export default function SiteFooterSettingsPage() {
  const [form, setForm] = useState({
    about_text: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const defaultAbout =
          "محصولات شگفت‌انگیز را با قیمت‌های شکست‌ناپذیر کشف کنید. شریک مطمئن شما برای خرید با کیفیت همراه با تحویل سریع و خدمات عالی مشتریان.";
        if (data.success && data.data) {
          setForm({
            about_text: data.data.about_text || defaultAbout,
          });
        } else {
          setForm({ about_text: defaultAbout });
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) setMessage("ذخیره شد");
    else setMessage("خطا در ذخیره");
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-purple-700">تنظیمات متن فوتر سایت</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow p-8">
        <div>
          <label className="block mb-2 text-right font-bold">متن درباره ما (فوتر)</label>
          <textarea
            name="about_text"
            value={form.about_text}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </button>
        {message && <div className="text-center text-green-600 mt-4">{message}</div>}
      </form>
    </div>
  );
}
