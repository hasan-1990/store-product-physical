'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DownloadsPageSimple() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Page loaded!');
    
    // Check localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('📦 LocalStorage:', { hasToken: !!token, hasUser: !!userStr });
    
    if (token && userStr) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('✅ Token payload:', payload);
        setUserId(payload.userId);
      } catch (error) {
        console.error('❌ Error:', error);
        router.push('/login');
      }
    } else {
      console.log('❌ No auth found, redirecting...');
      router.push('/login');
    }
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Downloads Page</h1>
      <p className="text-xl">User ID: {userId}</p>
      <p className="mt-4">If you see this, authentication works! ✅</p>
    </div>
  );
}
