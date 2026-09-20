'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', duration = 2000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // صبر کن تا انیمیشن خروج تمام شه
      setTimeout(() => {
        onClose();
      }, 400); // مدت زمان انیمیشن
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
    type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
    'bg-gradient-to-r from-blue-500 to-cyan-500';

  const icon =
    type === 'success' ? (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : type === 'error' ? (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

  return (
    <div className={`fixed top-20 left-4 z-[9999] ${isExiting ? 'animate-slide-out-left' : 'animate-slide-in-left'}`}>
      <div className={`${bgColor} text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 min-w-[260px] max-w-sm border border-white/20`}>
        <div className="flex-shrink-0 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <p className="font-medium text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
