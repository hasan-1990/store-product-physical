'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAuth();
  }, []);

  const testAuth = async () => {
    try {
      const response = await fetch('/api/admin/test-auth');
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8">در حال بررسی...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800 mb-4">⚠️ عدم احراز هویت</h1>
        <p className="text-red-700 mb-4">شما وارد نشده‌اید. لطفاً ابتدا <a href="/admin/login" className="underline font-bold">وارد شوید</a>.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-bold text-blue-800 mb-2">Client Session Info:</h2>
        <pre className="bg-white p-3 rounded border border-blue-100 text-sm overflow-auto">
          {JSON.stringify({
            status,
            user: {
              email: (session?.user as any)?.email,
              role: (session?.user as any)?.role,
              name: (session?.user as any)?.name,
            }
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="font-bold text-green-800 mb-2">Server Session Info:</h2>
        <pre className="bg-white p-3 rounded border border-green-100 text-sm overflow-auto">
          {JSON.stringify(apiResponse, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => testAuth()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        تست دوباره
      </button>

      <a
        href="/admin"
        className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        بازگشت به پنل
      </a>
    </div>
  );
}
