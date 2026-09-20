'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useState, useEffect, ReactNode } from 'react'

interface ConditionalNavFooterProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function ConditionalNavFooter({ children, footer }: ConditionalNavFooterProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // صفحاتی که navbar و footer نباید نمایش داده شود
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
  const hideNavFooter = authPages.includes(pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  // جلوگیری از hydration error
  if (!mounted) {
    return (
      <>
        <main className="flex-1" style={{ maxWidth: '100vw' }}>
          {children}
        </main>
        {footer}
      </>
    )
  }

  if (hideNavFooter) {
    return (
      <main className="flex-1" style={{ maxWidth: '100vw' }}>
        {children}
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1" style={{ maxWidth: '100vw' }}>
        {children}
      </main>
      {footer}
    </>
  )
}