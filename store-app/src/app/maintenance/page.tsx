'use client';

import { useState, useEffect } from 'react';

interface MaintenanceInfo {
  maintenanceMode: boolean;
  maintenanceEndTime: string;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  maintenanceContact?: string;
}

const MaintenancePage = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [progressPercentage, setProgressPercentage] = useState(5); // شروع از 5%
  const [totalDuration, setTotalDuration] = useState(0);
  const [maintenanceStartTime, setMaintenanceStartTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(5);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null);

  // بررسی وضعیت تعمیر از API
  const checkMaintenanceStatus = async () => {
    try {
      const response = await fetch('/api/maintenance/status');
      const result = await response.json();
      
      if (result.success && result.data) {
        setMaintenanceInfo({
          maintenanceMode: result.data.maintenanceMode || false,
          maintenanceEndTime: result.data.maintenanceEndTime || '',
          maintenanceTitle: result.data.maintenanceTitle || 'سایت در حال بروزرسانی',
          maintenanceMessage: result.data.maintenanceMessage || 'ما در حال بهبود سایت برای ارائه تجربه بهتر به شما هستیم',
          maintenanceContact: result.data.maintenanceContact || 'در صورت نیاز فوری می‌توانید با ما تماس بگیرید'
        });
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
    const interval = setInterval(checkMaintenanceStatus, 30000); // هر 30 ثانیه چک کن
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!maintenanceInfo?.maintenanceEndTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(maintenanceInfo.maintenanceEndTime).getTime();
      const difference = endTime - now;

      // محاسبه مدت کل تعمیر بر اساس تنظیمات API
      if (totalDuration === 0) {
        // بررسی تنظیمات maintenance از API برای محاسبه مدت کل
        const fetchMaintenanceSettings = async () => {
          try {
            const response = await fetch('/api/admin/settings');
            const result = await response.json();
            if (result.success && result.data) {
              const days = result.data.maintenanceDays || 0;
              const hours = result.data.maintenanceHours || 2;
              const minutes = result.data.maintenanceMinutes || 0;
              
              // محاسبه مدت کل بر اساس تنظیمات
              const totalMs = (days * 24 * 60 * 60 * 1000) + 
                            (hours * 60 * 60 * 1000) + 
                            (minutes * 60 * 1000);
              
              setTotalDuration(totalMs);
              
              // محاسبه زمان شروع تعمیر (زمان پایان - مدت کل)
              const startTime = endTime - totalMs;
              setMaintenanceStartTime(startTime);
            }
          } catch (error) {
            console.error('Error fetching maintenance settings:', error);
            // اگر خطا باشد، مدت پیش‌فرض 2 ساعت در نظر بگیر
            setTotalDuration(2 * 60 * 60 * 1000);
          }
        };
        
        fetchMaintenanceSettings();
      }

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });

        // فقط زمان countdown را محاسبه کن، progress از useEffect جداگانه می‌آید
        // محاسبه درصد پیشرفت در اینجا غیرفعال شد
        
      } else {
        setIsFinished(true);
        setProgressPercentage(100);
        // ارسال درخواست برای غیرفعال کردن حالت تعمیر
        fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              maintenanceMode: false,
              maintenanceEndTime: ''
            }
          })
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // اجرای فوری

    return () => clearInterval(timer);
  }, [maintenanceInfo, totalDuration]);

  // Progress بر اساس زمان واقعی - هر دقیقه حدود 9% پیشرفت
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgressPercentage(prev => {
        // هر دقیقه 9% اضافه کن (100% در 11 دقیقه)
        const incrementPerSecond = (100 / (11 * 60)); // حدود 0.15% در ثانیه
        const newProgress = prev + incrementPerSecond;
        return Math.min(newProgress, 99); // حداکثر 99%
      });
    }, 1000); // هر ثانیه

    return () => clearInterval(progressInterval);
  }, []);

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce mb-6">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">✅</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">سایت آماده است!</h1>
          <p className="text-green-200 mb-6">تعمیرات با موفقیت پایان یافت</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ورود به سایت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* انیمیشن پس‌زمینه */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-10 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* آیکون انیمیشنی */}
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-purple-400 rounded-full animate-spin animation-reverse"></div>
            <div className="absolute inset-4 border-4 border-pink-400 rounded-full animate-spin"></div>
            <div className="absolute inset-6 flex items-center justify-center">
              <span className="text-4xl animate-pulse">🔧</span>
            </div>
          </div>
        </div>

        {/* عنوان */}
        <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
          {maintenanceInfo?.maintenanceTitle || 'سایت در حال بروزرسانی'}
        </h1>
        
        <p className="text-xl text-blue-200 mb-12 animate-fade-in animation-delay-1000">
          {maintenanceInfo?.maintenanceMessage || 'ما در حال بهبود سایت برای ارائه تجربه بهتر به شما هستیم'}
        </p>

        {/* شمارنده زمان */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-500/30 animate-fade-in animation-delay-2000">
            <div className="text-4xl font-bold text-white mb-2">{timeLeft.days}</div>
            <div className="text-blue-200 text-sm uppercase tracking-wider">روز</div>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 animate-fade-in animation-delay-2500">
            <div className="text-4xl font-bold text-white mb-2">{timeLeft.hours}</div>
            <div className="text-purple-200 text-sm uppercase tracking-wider">ساعت</div>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-pink-500/30 animate-fade-in animation-delay-3000">
            <div className="text-4xl font-bold text-white mb-2">{timeLeft.minutes}</div>
            <div className="text-pink-200 text-sm uppercase tracking-wider">دقیقه</div>
          </div>
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-green-500/30 animate-fade-in animation-delay-3500">
            <div className="text-4xl font-bold text-white mb-2">{timeLeft.seconds}</div>
            <div className="text-green-200 text-sm uppercase tracking-wider">ثانیه</div>
          </div>
        </div>

        {/* پیام تماس */}
        <div className="backdrop-blur-lg bg-white/5 rounded-2xl p-6 border border-white/20 animate-fade-in animation-delay-4000">
          <p className="text-gray-300 mb-4">
            {maintenanceInfo?.maintenanceContact || 'در صورت نیاز فوری می‌توانید با ما تماس بگیرید:'}
          </p>
          <div className="flex justify-center gap-4 mt-6"></div>
        </div>

        {/* نوار پیشرفت انیمیشنی هوشمند */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">پیشرفت تعمیر</span>
            <span className="text-sm text-blue-400">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              تعمیر در حال انجام... لطفاً صبر کنید
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-2500 { animation-delay: 2.5s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-3500 { animation-delay: 3.5s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-reverse { animation-direction: reverse; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
