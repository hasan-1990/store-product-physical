'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@muse.local');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/admin');
        router.refresh();
      } else {
        alert(json.error || 'ورود ناموفق');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mx-auto max-w-md space-y-4 p-8">
      <h1 className="page-title text-center">ورود مدیر</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل"
        className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3"
        dir="ltr"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="رمز عبور"
        className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3"
        dir="ltr"
        required
      />
      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'در حال ورود...' : 'ورود به پنل'}
      </button>
    </form>
  );
}
