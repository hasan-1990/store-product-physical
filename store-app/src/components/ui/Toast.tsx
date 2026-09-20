'use client';

import React, { useEffect, useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animation entrance
    setTimeout(() => setIsVisible(true), 10);

    // Auto remove
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FiCheck className="w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5" />;
      case 'info':
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 shadow-green-100/50';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 shadow-red-100/50';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100/50';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100/50';
    }
  };

  const getIconStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
    >
      <div className={`
        relative p-4 rounded-xl border shadow-lg backdrop-blur-sm
        max-w-md w-full
        ${getStyles()}
      `}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconStyles()}`}>
            {getIcon()}
          </div>
          
          <div className="mr-3 flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm leading-5">
              {toast.message}
            </p>
          </div>
          
          <button
            onClick={handleRemove}
            className="flex-shrink-0 mr-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 right-0 left-0 h-1 bg-black/10 rounded-b-xl overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{
              animation: `shrink ${toast.duration || 5000}ms linear`
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'success', message, title, duration });
  };

  const error = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'error', message, title, duration });
  };

  const warning = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'warning', message, title, duration });
  };

  const info = (message: string, title?: string, duration?: number) => {
    return addToast({ type: 'info', message, title, duration });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};