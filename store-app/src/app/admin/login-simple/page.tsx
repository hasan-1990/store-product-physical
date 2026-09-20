'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleLogin() {
  const [email, setEmail] = useState('hasanmansouri1990@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.push('/admin');
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('ایمیل یا رمز عبور اشتباه است');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Session will be updated automatically
        router.push('/admin');
      }
    } catch (err) {
      setError('خطا در ورود');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-white">در حال بررسی...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          ورود به پنل مدیریت
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white mb-2">ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>

          <div className="text-center mt-4">
            <a
              href="/admin/forgot-password"
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
            >
              رمز عبور خود را فراموش کرده‌اید؟
            </a>
          </div>
        </form>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>Session Status: {status}</p>
          {session && <p>User: {session.user?.email}</p>}
        </div>
      </div>
    </div>
  );
}
