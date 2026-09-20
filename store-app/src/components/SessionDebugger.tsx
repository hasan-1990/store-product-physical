'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SessionDebugger() {
  const { data: session, status } = useSession();
  const [jwtUser, setJwtUser] = useState<any>(null);
  const [hasJWT, setHasJWT] = useState(false);

  useEffect(() => {
    // Check NextAuth session
    console.log('🔍 SessionDebugger NextAuth:', {
      status,
      hasSession: !!session,
      session: session,
      user: session?.user,
      timestamp: new Date().toISOString()
    });

    // Check JWT token from localStorage
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          setHasJWT(true);
          setJwtUser(user);
          console.log('🔍 SessionDebugger JWT:', {
            hasJWT: true,
            user: user,
            tokenExpiry: new Date(payload.exp * 1000).toLocaleString('fa-IR')
          });
        } else {
          console.log('⚠️ JWT token expired');
        }
      }
    } catch (error) {
      console.error('❌ Error checking JWT:', error);
    }
  }, [session, status]);

  // Show JWT user if available
  if (hasJWT && jwtUser) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border-2 border-green-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <p className="font-bold text-green-800">✅ کاربر لاگین است (JWT)</p>
        <div className="text-sm text-green-700 mt-2 space-y-1">
          <p><strong>نام:</strong> {jwtUser.name || 'ندارد'}</p>
          <p><strong>ایمیل:</strong> {jwtUser.email || 'ندارد'}</p>
          <p><strong>نقش:</strong> {jwtUser.role || 'USER'}</p>
        </div>
        <p className="text-xs text-green-600 mt-2">Auth: JWT Token</p>
      </div>
    );
  }

  // Show NextAuth session if available
  if (session?.user) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border-2 border-blue-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <p className="font-bold text-blue-800">✅ کاربر لاگین است (NextAuth)</p>
        <div className="text-sm text-blue-700 mt-2 space-y-1">
          <p><strong>نام:</strong> {session.user.name || 'ندارد'}</p>
          <p><strong>ایمیل:</strong> {session.user.email || 'ندارد'}</p>
          <p><strong>نقش:</strong> {session.user.role || 'ندارد'}</p>
        </div>
        <p className="text-xs text-blue-600 mt-2">Auth: NextAuth</p>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <p className="font-bold text-yellow-800">🔄 در حال بررسی احراز هویت...</p>
      </div>
    );
  }

  // Not authenticated
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border-2 border-red-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <p className="font-bold text-red-800">❌ کاربر لاگین نیست</p>
      <p className="text-sm text-red-600 mt-1">لطفاً ابتدا وارد شوید</p>
    </div>
  );
}
