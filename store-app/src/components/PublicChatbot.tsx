'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Chatbot from '@/components/Chatbot';

function isAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function PublicChatbot() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isAdminPath(pathname)) {
    return null;
  }

  return <Chatbot />;
}
