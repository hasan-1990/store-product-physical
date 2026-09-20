'use client';

import Image from 'next/image';

interface ProfileHeaderProps {
  user: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    createdAt?: string;
    lastLogin?: string;
  };
  showActions?: boolean;
  compact?: boolean;
}

export default function ProfileHeader({ user, showActions = false, compact = false }: ProfileHeaderProps) {
  // استخراج نام کامل
  let fullName = '';
  if (user.name) {
    fullName = user.name;
  } else if (user.firstName || user.lastName) {
    fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  } else if (user.email) {
    fullName = user.email.split('@')[0];
  } else {
    fullName = 'کاربر گرامی';
  }

  const firstName = user.firstName || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'کاربر';
  const lastName = user.lastName || user.name?.split(' ').slice(1).join(' ') || '';
  const initials = `${firstName[0] || 'ک'}${lastName[0] || ''}`.toUpperCase();

  if (compact) {
    // نسخه کامپکت برای منوی dropdown
    return (
      <div className="px-4 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/20 text-right">
        <div className="flex items-center justify-between gap-3">
          {/* متن سمت راست */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">خوش آمدید</p>
            <p className="text-white font-bold text-base truncate">{fullName}</p>
            
            {/* آخرین ورود */}
            <div className="flex items-center text-xs text-gray-400 mt-2">
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate">
                {new Date(user.lastLogin || Date.now()).toLocaleDateString('fa-IR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* آواتار سمت چپ */}
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={fullName}
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // نسخه کامل برای صفحه پروفایل
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
      {/* Cover Image با Gradient Animation */}
      <div className="h-32 md:h-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8">
        {/* همه چیز در یک ردیف */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 -mt-16 md:-mt-20">
          {/* آواتار */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={fullName}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl md:text-6xl text-white font-bold drop-shadow-lg">
                  {initials}
                </span>
              )}
            </div>
          </div>

          {/* بخش راست: نام + اطلاعات */}
          <div className="flex-1 w-full">
            {/* نام و وضعیت */}
            <div className="text-center lg:text-right mb-4">
              <p className="text-sm text-gray-500 mb-1">خوش آمدید</p>
              <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  {fullName}
                </h1>
                <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-white">آنلاین</span>
                </div>
              </div>
            </div>

            {/* اطلاعات تماس */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200/50">
              <h3 className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                اطلاعات تماس
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {user.email && (
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">ایمیل</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">تلفن</p>
                    <p className="text-sm font-bold text-gray-800">{user.phone}</p>
                  </div>
                </div>
              )}

              {user.createdAt && (
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">عضویت</p>
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(user.createdAt).toLocaleDateString('fa-IR', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {user.lastLogin && (
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">آخرین ورود</p>
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(user.lastLogin).toLocaleDateString('fa-IR', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
