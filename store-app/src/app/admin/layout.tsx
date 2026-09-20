'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModules } from '@/hooks/useModules';
import Head from 'next/head';

interface SubMenuItem {
  name: string;
  href: string;
  current: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current: boolean;
  isExpandable?: boolean;
  subItems?: SubMenuItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { modules } = useModules();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Don't show sidebar for login and public auth pages
  const isLoginPage = pathname === '/admin/login' || 
                      pathname === '/admin/login-token' || 
                      pathname === '/admin/login-simple' ||
                      pathname === '/admin/forgot-password' ||
                      pathname?.startsWith('/admin/reset-password');

  // Set body background for admin pages - MUST be before any conditional returns
  useEffect(() => {
    if (isLoginPage) return; // Don't apply styles to login page
    
    // Hide navbar and footer for admin pages
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (main) {
      main.style.background = 'linear-gradient(135deg, #111827 0%, #581c87 50%, #111827 100%)';
      main.style.minHeight = '100vh';
    }
    
    // Create style element for body override
    let styleElement = document.getElementById('admin-body-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'admin-body-style';
      document.head.appendChild(styleElement);
    }
    
    // Add CSS with highest priority
    styleElement.innerHTML = `
      body {
        background: linear-gradient(135deg, #111827 0%, #581c87 50%, #111827 100%) !important;
        min-height: 100vh !important;
      }
      main {
        background: linear-gradient(135deg, #111827 0%, #581c87 50%, #111827 100%) !important;
        min-height: 100vh !important;
      }
    `;
    
    return () => {
      // Show navbar and footer when leaving admin
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      if (main) {
        main.style.background = '';
        main.style.minHeight = '';
      }
      
      // Clean up style element
      const element = document.getElementById('admin-body-style');
      if (element) {
        element.remove();
      }
    };
  }, [isLoginPage]);

  // Auto-expand menu if current page is within that section
  useEffect(() => {
    if (pathname.startsWith('/admin/seo') || pathname === '/admin/modules') {
      setExpandedMenus(prev => new Set(prev).add('ماژول'));
    }
    if (pathname.startsWith('/admin/shipping') || pathname === '/admin/provinces') {
      setExpandedMenus(prev => new Set(prev).add('حمل و نقل'));
    }
    if (pathname.startsWith('/admin/licenses') || pathname === '/admin/auto-license') {
      setExpandedMenus(prev => new Set(prev).add('ماژول'));
    }
  }, [pathname]);

  // Redirect to login if not authenticated - MUST be after all hooks
  useEffect(() => {
    // Allow login pages to be shown
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    
    let cancelled = false;

    const ensureAdminLocalAuth = async () => {
      let token = localStorage.getItem('token');
      let userStr = localStorage.getItem('user');

      // If localStorage was cleared (or never set), try to rehydrate from NextAuth cookie session.
      if (!token || !userStr) {
        try {
          const sessionRes = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
          });

          if (sessionRes.ok) {
            const session = await sessionRes.json();
            const role = session?.user?.role;
            const isAdmin = typeof role === 'string' && role.toLowerCase() === 'admin';

            if (isAdmin) {
              const email = session?.user?.email || 'admin@local';
              const name = session?.user?.name || 'ادمین';

              const fakeJWT =
                btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) +
                '.' +
                btoa(
                  JSON.stringify({
                    email,
                    role: 'admin',
                    exp: Math.floor(Date.now() / 1000) + 86400,
                  })
                ) +
                '.' +
                btoa('signature');

              const userData = { email, role: 'admin', name };

              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('token', fakeJWT);
              localStorage.setItem('admin_authenticated', 'true');

              token = fakeJWT;
              userStr = JSON.stringify(userData);
            }
          }
        } catch (e) {
          console.warn('Admin auth rehydrate from session failed:', e);
        }
      }

      return { token, userStr };
    };

    (async () => {
      try {
        const { token, userStr } = await ensureAdminLocalAuth();

        if (!token || !userStr) {
          router.push('/admin/login');
          return;
        }

        const userData = JSON.parse(userStr);

        // Check if user is admin
        if (userData.role !== 'ADMIN' && userData.role !== 'admin') {
          router.push('/admin/login');
          return;
        }

        // Verify token is not expired (skip for fake JWT tokens)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp && payload.exp * 1000 < Date.now();

          if (isExpired) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/admin/login');
            return;
          }
        } catch (e) {
          // Token parsing failed, but that's ok for fake tokens
          console.log('Token validation skipped (likely fake JWT for backward compatibility)');
        }

        if (cancelled) return;
        setUser(userData);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname, isLoginPage]);
  
  // Show loading screen while checking authentication
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white">در حال بررسی احراز هویت...</p>
          </div>
        </div>
      </div>
    );
  }

  // If it's login page, show simple layout without sidebar
  if (isLoginPage) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </Head>
        {children}
      </>
    );
  }

  // If not authenticated and not on login page, don't render anything (will redirect)
  if (!user && !isLoginPage) {
    return null;
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const navigation = [
    {
      name: 'داشبورد',
      href: '/admin',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#8B5CF6"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#EC4899"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#10B981"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#F59E0B"/>
        </svg>
      ),
      current: pathname === '/admin'
    },
    {
      name: 'محصولات',
      href: '/admin/products',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="url(#grad1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="grad1" x1="4" y1="3" x2="20" y2="21">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="100%" stopColor="#EC4899"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/products'
    },
    {
      name: 'دسته‌بندی‌ها',
      href: '/admin/categories',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="7" cy="7" r="1" fill="#F59E0B"/>
          <defs>
            <linearGradient id="grad2" x1="3" y1="3" x2="21" y2="21">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#06B6D4"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/categories'
    },
    {
      name: 'مگامنو',
      href: '/admin/mega-menu-settings',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 10h16M4 14h10M4 18h6" stroke="url(#grad3)" strokeWidth="2.5" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad3" x1="4" y1="6" x2="20" y2="18">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="50%" stopColor="#EC4899"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/mega-menu-settings'
    },
    {
      name: 'کاربران',
      href: '/admin/users',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="7" r="4" fill="#8B5CF6"/>
          <path d="M3 21v-1a6 6 0 0112 0v1" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="17" cy="7" r="3" fill="#EC4899"/>
          <path d="M21 21v-1a5 5 0 00-4-4.9" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      current: pathname === '/admin/users'
    },
    {
      name: 'سفارش‌ها',
      href: '/admin/orders',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="url(#grad4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="14" r="1.5" fill="#10B981"/>
          <circle cx="15" cy="14" r="1.5" fill="#F59E0B"/>
          <defs>
            <linearGradient id="grad4" x1="5" y1="7" x2="19" y2="21">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/orders'
    },
    {
      name: 'نظرات',
      href: '/admin/reviews',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#grad5)"/>
          <defs>
            <linearGradient id="grad5" x1="12" y1="2" x2="12" y2="21">
              <stop offset="0%" stopColor="#F59E0B"/>
              <stop offset="100%" stopColor="#EF4444"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/reviews'
    },
    {
      name: 'تیکت‌های پشتیبانی',
      href: '/admin/tickets',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="14" rx="2" stroke="url(#grad6)" strokeWidth="2"/>
          <path d="M7 8h10M7 12h4" stroke="url(#grad6)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="17" cy="19" r="4" fill="#EF4444"/>
          <path d="M15.5 19h3M17 17.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad6" x1="3" y1="4" x2="21" y2="18">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/tickets' || pathname.startsWith('/admin/tickets/')
    },
    // ماژول‌های قابل کنترل
    ...(modules.shipping?.enabled ? [{
      name: 'حمل و نقل',
      href: '/admin/shipping',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M13 16V6a1 1 0 011-1h4l3 4v7a1 1 0 01-1 1h-1" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M13 16H3V6a1 1 0 011-1h9v11z" fill="#EC4899" opacity="0.3"/>
          <path d="M13 16H3V6a1 1 0 011-1h9" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="8.5" cy="18" r="2" fill="#10B981"/>
          <circle cx="16.5" cy="18" r="2" fill="#10B981"/>
        </svg>
      ),
      current: pathname === '/admin/shipping' || pathname.startsWith('/admin/shipping/'),
      subItems: [
        {
          name: 'تنظیمات حمل و نقل',
          href: '/admin/shipping',
          current: pathname === '/admin/shipping'
        },
        {
          name: 'مدیریت استان‌ها',
          href: '/admin/provinces',
          current: pathname === '/admin/provinces'
        }
      ]
    }] : []),
    ...(modules.blog?.enabled ? [{
      name: 'بلاگ',
      href: '/admin/blog',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="4" width="14" height="16" rx="2" fill="url(#grad7)"/>
          <path d="M9 8h6M9 12h6M9 16h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad7" x1="5" y1="4" x2="19" y2="20">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/blog' || pathname.startsWith('/admin/blog/')
    }] : []),
    ...(modules.content?.enabled ? [{
      name: 'صفحه اصلی',
      href: '/admin/content',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#grad8)"/>
          <rect x="7" y="7" width="4" height="4" rx="1" fill="white" opacity="0.9"/>
          <rect x="13" y="7" width="4" height="4" rx="1" fill="white" opacity="0.7"/>
          <rect x="7" y="13" width="10" height="2" rx="1" fill="white" opacity="0.5"/>
          <rect x="7" y="16" width="7" height="2" rx="1" fill="white" opacity="0.5"/>
          <defs>
            <linearGradient id="grad8" x1="3" y1="3" x2="21" y2="21">
              <stop offset="0%" stopColor="#EC4899"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/content' || pathname.startsWith('/admin/content/')
    }] : []),
    ...(modules.analytics?.enabled ? [{
      name: 'آمار و تحلیل',
      href: '/admin/analytics',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="14" width="4" height="6" rx="1" fill="#10B981"/>
          <rect x="10" y="8" width="4" height="12" rx="1" fill="#06B6D4"/>
          <rect x="16" y="4" width="4" height="16" rx="1" fill="#8B5CF6"/>
          <path d="M3 20h18" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      current: pathname === '/admin/analytics'
    }] : []),
    {
      name: 'چت‌بات هوشمند',
      href: '/admin/chatbot',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="14" rx="3" fill="url(#gradChatbot)"/>
          <circle cx="9" cy="10" r="1.5" fill="white"/>
          <circle cx="15" cy="10" r="1.5" fill="white"/>
          <path d="M8.5 13.5c0 0 1 2 3.5 2s3.5-2 3.5-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="8" y="18" width="3" height="4" rx="1" fill="#8B5CF6" opacity="0.7"/>
          <rect x="13" y="18" width="3" height="4" rx="1" fill="#EC4899" opacity="0.7"/>
          <circle cx="18" cy="6" r="3" fill="#10B981"/>
          <path d="M17 6h2M18 5v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="gradChatbot" x1="4" y1="4" x2="20" y2="18">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="50%" stopColor="#EC4899"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/chatbot'
    },
    {
      name: 'مدیریت لایسنس‌ها',
      href: '/admin/licenses',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#licenseMainGrad)" stroke="url(#licenseMainStroke)" strokeWidth="1"/>
          <circle cx="8" cy="12" r="2" fill="white" opacity="0.9"/>
          <rect x="12" y="10" width="6" height="1.5" rx="0.5" fill="white" opacity="0.8"/>
          <rect x="12" y="13" width="4" height="1.5" rx="0.5" fill="white" opacity="0.6"/>
          <path d="M17 7l2-1.5L21 7v4l-2-1.5L17 11V7z" fill="#F59E0B"/>
          <circle cx="19" cy="9" r="1" fill="#EF4444"/>
          <defs>
            <linearGradient id="licenseMainGrad" x1="3" y1="6" x2="21" y2="18">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="50%" stopColor="#EC4899"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
            <linearGradient id="licenseMainStroke" x1="3" y1="6" x2="21" y2="18">
              <stop offset="0%" stopColor="#A855F7"/>
              <stop offset="100%" stopColor="#F97316"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/licenses' || pathname.startsWith('/admin/licenses/')
    },
    {
      name: 'قالب‌های فروشگاه',
      href: '/admin/site-templates',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="url(#tplGrad)" />
          <rect x="6" y="8" width="12" height="2" rx="1" fill="white" opacity="0.8" />
          <rect x="6" y="12" width="8" height="2" rx="1" fill="white" opacity="0.5" />
          <defs>
            <linearGradient id="tplGrad" x1="3" y1="4" x2="21" y2="20">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      ),
      current:
        pathname === '/admin/site-templates' ||
        pathname.startsWith('/admin/site-templates/'),
    },
    {
      name: 'سایت‌های مشتریان',
      href: '/admin/site-instances',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth="2" />
          <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>
      ),
      current:
        pathname === '/admin/site-instances' ||
        pathname.startsWith('/admin/site-instances/'),
    },
    {
      name: 'A/B Testing',
      href: '/admin/ab-testing',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill="url(#grad9)"/>
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="grad9" x1="3" y1="3" x2="21" y2="21">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#06B6D4"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/ab-testing'
    },
    {
      name: 'تنظیمات',
      href: '/admin/settings',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="#8B5CF6"/>
          <path d="M12 1v4M12 19v4M23 12h-4M5 12H1M20.49 3.51l-2.83 2.83M6.34 17.66l-2.83 2.83M20.49 20.49l-2.83-2.83M6.34 6.34L3.51 3.51" stroke="url(#grad10)" strokeWidth="2" strokeLinecap="round"/>
          <defs>
            <linearGradient id="grad10" x1="1" y1="1" x2="23" y2="23">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="50%" stopColor="#EC4899"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/settings'
    },
    {
      name: 'مدیریت فونت‌ها',
      href: '/admin/fonts',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" fill="url(#grad11)"/>
          <path d="M13 2v7h7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="9" y="17" fontSize="8" fontWeight="bold" fill="white">Aa</text>
          <defs>
            <linearGradient id="grad11" x1="4" y1="2" x2="20" y2="22">
              <stop offset="0%" stopColor="#F59E0B"/>
              <stop offset="100%" stopColor="#EF4444"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/fonts'
    },
    ...(modules.sms?.enabled ? [
    {
      name: 'ارسال پیامک',
      href: '/admin/sms',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="3" width="12" height="18" rx="2" fill="url(#grad12)"/>
          <rect x="9" y="6" width="6" height="1" rx="0.5" fill="white" opacity="0.8"/>
          <rect x="9" y="8.5" width="6" height="1" rx="0.5" fill="white" opacity="0.6"/>
          <rect x="9" y="11" width="4" height="1" rx="0.5" fill="white" opacity="0.4"/>
          <circle cx="12" cy="18" r="1.5" fill="white"/>
          <defs>
            <linearGradient id="grad12" x1="6" y1="3" x2="18" y2="21">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#8B5CF6"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/sms',
    },
    {
      name: 'تنظیمات ایمیل',
      href: '/admin/email-settings',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#emailMenuGrad)" stroke="currentColor" strokeWidth="1"/>
          <path d="M3 8l9 6 9-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="emailMenuGrad" x1="3" y1="6" x2="21" y2="18">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#10B981"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/email-settings',
    },
    ] : []),
    {
      name: 'درگاه پرداخت',
      href: '/admin/payment-gateway',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#grad13)"/>
          <rect x="2" y="10" width="20" height="3" fill="#1F2937" opacity="0.5"/>
          <rect x="6" y="15" width="3" height="2" rx="0.5" fill="white"/>
          <rect x="10" y="15" width="3" height="2" rx="0.5" fill="white" opacity="0.7"/>
          <defs>
            <linearGradient id="grad13" x1="2" y1="6" x2="22" y2="18">
              <stop offset="0%" stopColor="#10B981"/>
              <stop offset="100%" stopColor="#059669"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/payment-gateway'
    },
    {
      name: 'تنظیمات فاکتور',
      href: '/admin/invoice-settings',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M8 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="url(#grad14)"/>
          <path d="M16 2v4h4" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          <rect x="8" y="10" width="8" height="1.5" rx="0.5" fill="white" opacity="0.9"/>
          <rect x="8" y="13" width="8" height="1.5" rx="0.5" fill="white" opacity="0.7"/>
          <rect x="8" y="16" width="5" height="1.5" rx="0.5" fill="white" opacity="0.5"/>
          <defs>
            <linearGradient id="grad14" x1="4" y1="2" x2="20" y2="22">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="100%" stopColor="#6366F1"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/invoice-settings'
    },
    ...(modules.seo?.enabled ? [{
      name: 'سئو',
      href: '/admin/seo',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" fill="url(#grad15)"/>
          <text x="12" y="16" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">SEO</text>
          <defs>
            <linearGradient id="grad15" x1="3" y1="3" x2="21" y2="21">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#3B82F6"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname === '/admin/seo'
    }] : []),
    {
      name: 'وظایف خودکار',
      href: '/admin/cron-jobs',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="url(#grad16)" strokeWidth="2" fill="none"/>
          <path d="M12 6v6l4 2" stroke="url(#grad16)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="4" r="1" fill="#10B981"/>
          <circle cx="20" cy="12" r="1" fill="#F59E0B"/>
          <circle cx="12" cy="20" r="1" fill="#EF4444"/>
          <circle cx="4" cy="12" r="1" fill="#8B5CF6"/>
          <defs>
            <linearGradient id="grad16" x1="3" y1="3" x2="21" y2="21">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="50%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#10B981"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      current: pathname.startsWith('/admin/cron-jobs')
    },
    {
      name: 'ماژول',
      href: '/admin/modules',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#8B5CF6"/>
          <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#EC4899"/>
          <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#10B981"/>
          <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#F59E0B"/>
          <circle cx="7" cy="7" r="2" fill="white" opacity="0.3"/>
          <circle cx="17" cy="7" r="2" fill="white" opacity="0.3"/>
          <circle cx="7" cy="17" r="2" fill="white" opacity="0.3"/>
          <circle cx="17" cy="17" r="2" fill="white" opacity="0.3"/>
        </svg>
      ),
      current: pathname === '/admin/modules',
      isExpandable: true,
      subItems: [
        {
          name: 'تنظیمات ماژول‌ها',
          href: '/admin/modules',
          current: pathname === '/admin/modules'
        },
        ...(modules.seo?.enabled ? [{
          name: 'سئو',
          href: '/admin/seo',
          current: pathname === '/admin/seo'
        }] : []),
        {
          name: 'مدیریت لایسنس‌ها',
          href: '/admin/licenses',
          current: pathname === '/admin/licenses' || pathname.startsWith('/admin/licenses/'),
          icon: (
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#licenseGrad)" stroke="url(#licenseStroke)" strokeWidth="1"/>
              <circle cx="8" cy="12" r="2" fill="white" opacity="0.9"/>
              <rect x="12" y="10" width="6" height="1.5" rx="0.5" fill="white" opacity="0.8"/>
              <rect x="12" y="13" width="4" height="1.5" rx="0.5" fill="white" opacity="0.6"/>
              <path d="M16 8l2-1.5L20 8v3l-2-1.5L16 11V8z" fill="#F59E0B"/>
              <defs>
                <linearGradient id="licenseGrad" x1="3" y1="6" x2="21" y2="18">
                  <stop offset="0%" stopColor="#8B5CF6"/>
                  <stop offset="50%" stopColor="#EC4899"/>
                  <stop offset="100%" stopColor="#F59E0B"/>
                </linearGradient>
                <linearGradient id="licenseStroke" x1="3" y1="6" x2="21" y2="18">
                  <stop offset="0%" stopColor="#A855F7"/>
                  <stop offset="100%" stopColor="#F97316"/>
                </linearGradient>
              </defs>
            </svg>
          )
        },
        {
          name: 'تزریق خودکار لایسنس',
          href: '/admin/auto-license',
          current: pathname === '/admin/auto-license'
        }
      ]
    },
    ...(modules.cache?.enabled !== false ? [{
      name: 'مدیریت کش Redis',
      href: '/admin/cache',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="7" rx="8" ry="3" fill="#EF4444"/>
          <path d="M4 7v5c0 1.657 3.582 3 8 3s8-1.343 8-3V7" fill="#DC2626"/>
          <ellipse cx="12" cy="12" rx="8" ry="3" fill="#DC2626"/>
          <path d="M4 12v5c0 1.657 3.582 3 8 3s8-1.343 8-3v-5" fill="#B91C1C"/>
          <ellipse cx="12" cy="17" rx="8" ry="3" fill="#B91C1C"/>
        </svg>
      ),
      current: pathname === '/admin/cache'
    }] : [])
  ];

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex" style={{backgroundColor: '#1a1b23'}} data-admin-page>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-lg border-l border-purple-500/20 transition-transform duration-300 lg:translate-x-0 lg:relative lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700/50">
          <h1 className="text-xl font-bold text-white">پنل مدیریت</h1>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                          item.current
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className={`${item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleMenu(item.name);
                        }}
                        className={`px-2 py-3 text-sm transition-all duration-200 ${
                          item.current
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedMenus.has(item.name) ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {expandedMenus.has(item.name) && item.subItems && (
                      <div className="mt-1 mr-6 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                              subItem.current
                                ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border-r-2 border-purple-400 shadow-lg'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {/* نمایش آیکون مخصوص تزریق خودکار */}
                            {subItem.name === 'تزریق خودکار لایسنس' && (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" fill="url(#autoInjectGrad)" stroke="currentColor" strokeWidth="1"/>
                                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="16" cy="8" r="2" fill="#F59E0B"/>
                                <path d="M14.5 7.5l3-3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
                                <defs>
                                  <linearGradient id="autoInjectGrad" x1="3" y1="3" x2="21" y2="21">
                                    <stop offset="0%" stopColor="#10B981"/>
                                    <stop offset="100%" stopColor="#06B6D4"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            {/* نمایش آیکون مخصوص لایسنس */}
                            {subItem.name === 'مدیریت لایسنس‌ها' && (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <rect x="4" y="7" width="16" height="10" rx="2" fill="url(#licenseCardGrad)" stroke="currentColor" strokeWidth="1"/>
                                <circle cx="8" cy="12" r="1.5" fill="white" opacity="0.9"/>
                                <rect x="11" y="10.5" width="5" height="1" rx="0.5" fill="white" opacity="0.8"/>
                                <rect x="11" y="12.5" width="3" height="1" rx="0.5" fill="white" opacity="0.6"/>
                                <path d="M18 6l1.5-1L21 6v2l-1.5-1L18 8V6z" fill="#F59E0B"/>
                                <defs>
                                  <linearGradient id="licenseCardGrad" x1="4" y1="7" x2="20" y2="17">
                                    <stop offset="0%" stopColor="#8B5CF6"/>
                                    <stop offset="100%" stopColor="#EC4899"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            {/* نمایش آیکون مخصوص سئو */}
                            {subItem.name === 'سئو' && (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="8" fill="url(#seoGrad)"/>
                                <text x="12" y="15" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">SEO</text>
                                <defs>
                                  <linearGradient id="seoGrad" x1="4" y1="4" x2="20" y2="20">
                                    <stop offset="0%" stopColor="#06B6D4"/>
                                    <stop offset="100%" stopColor="#3B82F6"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            {/* نمایش آیکون مخصوص ارسال پیامک */}
                            {subItem.name === 'ارسال پیامک' && (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="5" width="18" height="14" rx="2" fill="url(#smsGrad)" stroke="currentColor" strokeWidth="1"/>
                                <path d="M7 9h10M7 13h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="17" cy="17" r="4" fill="#10B981"/>
                                <path d="M15.5 17l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <defs>
                                  <linearGradient id="smsGrad" x1="3" y1="5" x2="21" y2="19">
                                    <stop offset="0%" stopColor="#8B5CF6"/>
                                    <stop offset="100%" stopColor="#3B82F6"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            {/* نمایش آیکون مخصوص تنظیمات ایمیل */}
                            {subItem.name === 'تنظیمات ایمیل' && (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#emailGrad)" stroke="currentColor" strokeWidth="1"/>
                                <path d="M3 8l9 6 9-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="18" cy="8" r="3" fill="#10B981"/>
                                <path d="M16.5 8l.75.75 1.5-1.5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                                <defs>
                                  <linearGradient id="emailGrad" x1="3" y1="6" x2="21" y2="18">
                                    <stop offset="0%" stopColor="#06B6D4"/>
                                    <stop offset="100%" stopColor="#10B981"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            )}
                            {/* آیکون پیش‌فرض برای سایر موارد */}
                            {subItem.name !== 'مدیریت لایسنس‌ها' && subItem.name !== 'سئو' && subItem.name !== 'تزریق خودکار لایسنس' && subItem.name !== 'ارسال پیامک' && subItem.name !== 'تنظیمات ایمیل' && (
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      item.current
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`${item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Admin info */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name || 'مدیر سیستم'}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {user?.email || 'admin@store.com'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between bg-white/10 backdrop-blur-lg border-b border-purple-500/20 px-6 shrink-0">
          <button
            className="lg:hidden text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative hidden md:block">
              <input
                type="search"
                name="admin-search"
                placeholder="جستجو..."
                autoComplete="new-password"
                className="w-64 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <button className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 4h7l5 5H4V4z" />
                </svg>
              </button>
              <button className="p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm font-medium"
              >
                مشاهده فروشگاه
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default AdminLayout;
