'use client';

import { useState } from 'react';
import { useSendSMS } from '@/hooks/useApi';

interface SingleSMSFormProps {
  smsSettings: {
    apiKey: string;
    lineNumber: string;
    isActive: boolean;
  };
}

const SingleSMSForm: React.FC<SingleSMSFormProps> = ({ smsSettings }) => {
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [successModal, setSuccessModal] = useState({
    show: false,
    message: '',
    isError: false
  });

  const sendSMSMutation = useSendSMS();

  const sendSingleSMS = async () => {
    // Validation
    if (!mobile.trim() || !message.trim()) {
      setSuccessModal({
        show: true,
        message: 'لطفاً شماره موبایل و متن پیامک را وارد کنید',
        isError: true
      });
      return;
    }

    if (!mobile.match(/^09[0-9]{9}$/)) {
      setSuccessModal({
        show: true,
        message: 'شماره موبایل نامعتبر است (مثال: 09121234567)',
        isError: true
      });
      return;
    }

    if (message.length > 70) {
      setSuccessModal({
        show: true,
        message: 'متن پیامک نباید بیش از 70 کاراکتر باشد',
        isError: true
      });
      return;
    }

    if (!smsSettings.apiKey || !smsSettings.isActive) {
      setSuccessModal({
        show: true,
        message: 'ابتدا تنظیمات پیامک را کامل کنید',
        isError: true
      });
      return;
    }

    try {
      await sendSMSMutation.mutateAsync({
        recipients: [mobile],
        message: message,
        type: 'single'
      });

      setMobile('');
      setMessage('');
      setSuccessModal({
        show: true,
        message: 'پیامک با موفقیت ارسال شد',
        isError: false
      });
    } catch (error) {
      setSuccessModal({
        show: true,
        message: 'خطا در ارسال پیامک',
        isError: true
      });
    }
  };

  const isDisabled = !smsSettings.apiKey || !smsSettings.lineNumber || !smsSettings.isActive || sendSMSMutation.isPending;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-white">ارسال پیامک تکی</h3>
        <p className="text-purple-200 text-sm">ارسال پیامک با متن دلخواه به یک شماره موبایل</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            شماره موبایل
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="مثال: 09121234567"
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            متن پیامک
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="متن پیامک خود را اینجا بنویسید..."
            className="w-full h-24 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
            maxLength={70}
          />
          <div className="flex justify-between text-xs text-purple-300 mt-1">
            <span>حداکثر 70 کاراکتر</span>
            <span>{message.length}/70</span>
          </div>
        </div>

        {!smsSettings.isActive && (
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-yellow-300">
                  سیستم پیامک غیرفعال است
                </h3>
                <p className="mt-1 text-sm text-yellow-200">
                  برای ارسال پیامک، ابتدا از بخش تنظیمات، سیستم پیامک را فعال کنید.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={sendSingleSMS}
            disabled={isDisabled}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {sendSMSMutation.isPending ? 'در حال ارسال...' : 'ارسال پیامک'}
          </button>
        </div>
      </div>

      {/* Success/Error Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  successModal.isError ? 'bg-red-500/20 border border-red-400/30' : 'bg-green-500/20 border border-green-400/30'
                }`}>
                  {successModal.isError ? (
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-white mb-2">
                  {successModal.isError ? 'خطا' : 'موفقیت'}
                </h3>
                
                <p className="text-gray-300 mb-4">{successModal.message}</p>
                
                <button
                  onClick={() => setSuccessModal({ show: false, message: '', isError: false })}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
                >
                  تایید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSMSForm;
