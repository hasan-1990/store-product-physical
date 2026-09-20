'use client';

import { useState, useEffect } from 'react';
import { useUrlTab } from '@/hooks/useUrlTab';
import { useSMSSettings, useSaveSMSSettings, useSMSCredit, useSendSMS, useLineNumbers } from '@/hooks/useApi';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  type: 'order' | 'shipping' | 'marketing' | 'verification';
  active: boolean;
}

interface SMSLog {
  id: string;
  recipient: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  type: string;
}

export default function SMSPage() {
  const [activeTab, setActiveTab] = useUrlTab('send');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLineNumber, setSelectedLineNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [templateIds, setTemplateIds] = useState({
    orderConfirmation: 0,
    shipping: 0,
    verificationCode: 0,
  });
  const [singleSMS, setSingleSMS] = useState({
    recipient: '',
    message: '',
    template: ''
  });
  const [creditModal, setCreditModal] = useState({
    show: false,
    credit: 0,
    message: '',
    isError: false
  });
  const [lineSaved, setLineSaved] = useState(false);

  // API hooks
  const { data: smsSettingsData, isLoading: settingsLoading } = useSMSSettings();
  const { data: creditData, isLoading: creditLoading, refetch: refetchCredit } = useSMSCredit();
  const { data: lineNumbersData } = useLineNumbers();
  const saveSMSSettingsMutation = useSaveSMSSettings();
  const sendSMSMutation = useSendSMS();

  // Extract data from queries
  const smsSettings = smsSettingsData?.success ? smsSettingsData.data : {
    provider: 'smsir',
    apiKey: '',
    lineNumber: '',
    templateIds: {
      verificationCode: 0,
      orderConfirmation: 0,
      passwordReset: 0,
      accountActivation: 0,
    },
    isActive: true
  };

  const credit = creditData?.success ? creditData.credit : null;
  const availableLineNumbers = lineNumbers.length > 0 ? lineNumbers : (lineNumbersData?.success ? lineNumbersData.lineNumbers : []);

  // همگام‌سازی مقادیر اولیه تنظیمات فقط زمانی که داده از API بارگذاری می‌شود
  useEffect(() => {
    if (!smsSettingsData?.success || !smsSettingsData.data) {
      return;
    }

    const data = smsSettingsData.data;

    setApiKey((prev) => {
      const next = data.apiKey || '';
      return prev === next ? prev : next;
    });

    setIsActive((prev) => {
      const next = Boolean(data.isActive);
      return prev === next ? prev : next;
    });

    const nextLineNumber = data.lineNumber || '';
    setSelectedLineNumber((prev) => (prev === nextLineNumber ? prev : nextLineNumber));
    setLineSaved((prev) => {
      const next = Boolean(nextLineNumber);
      return prev === next ? prev : next;
    });

    const nextTemplateIds = {
      orderConfirmation: data.templateIds?.orderConfirmation || 0,
      shipping: data.templateIds?.shipping || 0,
      verificationCode: data.templateIds?.verificationCode || 0,
    };

    setTemplateIds((prev) => {
      if (
        prev.orderConfirmation === nextTemplateIds.orderConfirmation &&
        prev.shipping === nextTemplateIds.shipping &&
        prev.verificationCode === nextTemplateIds.verificationCode
      ) {
        return prev;
      }
      return nextTemplateIds;
    });
  }, [smsSettingsData?.success, smsSettingsData?.data]);

  // بستن dropdown هنگام کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Static data که بعداً می‌توان از API آورد
  const [smsTemplates] = useState<SMSTemplate[]>([
    {
      id: '1',
      name: 'تایید سفارش',
      content: 'سفارش شما با کد {order_id} ثبت شد. مبلغ: {amount} تومان. تشکر از خرید شما.',
      type: 'order',
      active: true
    },
    {
      id: '2',
      name: 'ارسال محصول',
      content: 'محصول شما با کد رهگیری {tracking_code} ارسال شد. زمان تحویل: {delivery_time}',
      type: 'shipping',
      active: true
    },
    {
      id: '3',
      name: 'کد تایید',
      content: 'کد تایید شما: {verification_code}. این کد تا 5 دقیقه معتبر است.',
      type: 'verification',
      active: true
    },
    {
      id: '4',
      name: 'پیامک تبلیغاتی',
      content: 'فروش ویژه! تخفیف {discount}% روی تمام محصولات. کد تخفیف: {code}. تا {date} اعتبار دارد.',
      type: 'marketing',
      active: true
    }
  ]);

  const [smsLogs] = useState<SMSLog[]>([
    {
      id: '1',
      recipient: '09123456789',
      content: 'سفارش شما با کد 12345 ثبت شد',
      status: 'sent',
      sentAt: '2024-01-15T10:30:00',
      type: 'تایید سفارش'
    },
    {
      id: '2',
      recipient: '09987654321',
      content: 'محصول شما ارسال شد',
      status: 'pending',
      sentAt: '2024-01-15T11:15:00',
      type: 'ارسال محصول'
    }
  ]);

  const [bulkSMS, setBulkSMS] = useState({
    recipients: '',
    message: '',
    template: ''
  });

  // Function to fetch line numbers
  const fetchLineNumbers = async () => {
    try {
      if (!apiKey) {
        setCreditModal({
          show: true,
          credit: 0,
          message: 'لطفاً کلید API را وارد کنید',
          isError: true
        });
        return;
      }

      setCreditModal({
        show: true,
        credit: 0,
        message: 'در حال دریافت لیست خط‌ها...',
        isError: false
      });
      
      const response = await fetch('/api/admin/sms/get-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLineNumbers(result.lineNumbers);
        setCreditModal({
          show: true,
          credit: 0,
          message: `${result.lineNumbers?.length || 0} خط ارسال یافت شد`,
          isError: false
        });
      } else {
        setCreditModal({
          show: true,
          credit: 0,
          message: `خطا در دریافت خط‌ها: ${result.error}`,
          isError: true
        });
      }
    } catch (error) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'خطا در دریافت لیست خط‌ها',
        isError: true
      });
    }
  };

  // Function to test API connection
  const testApiConnection = async () => {
    try {
      if (!apiKey.trim()) {
        setCreditModal({
          show: true,
          credit: 0,
          message: 'لطفاً کلید API را وارد کنید',
          isError: true
        });
        return;
      }

      setCreditModal({
        show: true,
        credit: 0,
        message: 'در حال تست اتصال API...',
        isError: false
      });

      const response = await fetch('/api/admin/sms/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCreditModal({
          show: true,
          credit: result.credit,
          message: result.message,
          isError: false
        });
      } else {
        setCreditModal({
          show: true,
          credit: 0,
          message: `خطا در تست اتصال: ${result.error}`,
          isError: true
        });
      }
    } catch (error) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'خطا در تست اتصال API',
        isError: true
      });
    }
  };

  // Function to handle template change for single SMS
  const handleSingleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setSingleSMS(prev => ({ ...prev, template: templateId }));
    
    if (templateId) {
      const template = smsTemplates.find(t => {
        switch(templateId) {
          case 'orderConfirmation': return t.type === 'order';
          case 'shipping': return t.type === 'shipping';
          case 'verification': return t.type === 'verification';
          default: return false;
        }
      });
      
      if (template) {
        setSingleSMS(prev => ({ ...prev, message: template.content }));
      }
    } else {
      setSingleSMS(prev => ({ ...prev, message: '' }));
    }
  };

  // Function to handle template change for bulk SMS
  const handleBulkTemplateChange = (templateId: string) => {
    setBulkSMS(prev => ({ ...prev, template: templateId }));
    
    if (templateId) {
      const template = smsTemplates.find(t => {
        switch(templateId) {
          case 'orderConfirmation': return t.type === 'order';
          case 'shipping': return t.type === 'shipping';
          case 'verification': return t.type === 'verification';
          case 'marketing': return t.type === 'marketing';
          default: return false;
        }
      });
      
      if (template) {
        setBulkSMS(prev => ({ ...prev, message: template.content }));
      }
    } else {
      setBulkSMS(prev => ({ ...prev, message: '' }));
    }
  };

  const openTemplateModal = (template?: SMSTemplate) => {
    setEditingTemplate(template || {
      id: '',
      name: '',
      content: '',
      type: 'marketing',
      active: true
    });
    setShowTemplateModal(true);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;

    try {
      console.log('Saving template:', editingTemplate);
      setShowTemplateModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      apiKey: apiKey,
      lineNumber: selectedLineNumber,
      templateIds: {
        orderConfirmation: templateIds.orderConfirmation,
        shipping: templateIds.shipping,
        verificationCode: templateIds.verificationCode,
      },
      isActive: isActive
    };
    
    console.log('Submitting SMS settings:', data);
    
    try {
      await saveSMSSettingsMutation.mutateAsync(data);
      setCreditModal({
        show: true,
        credit: 0,
        message: 'تنظیمات با موفقیت ذخیره شد',
        isError: false
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setCreditModal({
        show: true,
        credit: 0,
        message: 'خطا در ذخیره تنظیمات',
        isError: true
      });
    }
  };

  const handleBulkSMSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkSMS.recipients || !bulkSMS.message) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'لطفاً تمام فیلدها را پر کنید',
        isError: true
      });
      return;
    }

    try {
      const recipients = bulkSMS.recipients.split('\n').filter((r: string) => r.trim());
      
      // ارسال به هر شماره به صورت جداگانه
      const results = [];
      for (const recipient of recipients) {
        try {
          await sendSMSMutation.mutateAsync({
            type: 'bulk',
            mobile: recipient.trim(),
            messageText: bulkSMS.message
          });
          results.push({ recipient: recipient.trim(), status: 'sent' });
        } catch (error) {
          results.push({ recipient: recipient.trim(), status: 'failed' });
        }
      }
      
      setBulkSMS({ recipients: '', message: '', template: '' });
      
      const sentCount = results.filter(r => r.status === 'sent').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      setCreditModal({
        show: true,
        credit: 0,
        message: `ارسال شد: ${sentCount}، خطا: ${failedCount}`,
        isError: failedCount > 0
      });
    } catch (error) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'خطا در ارسال پیامک‌ها',
        isError: true
      });
    }
  };

  const handleSingleSMSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!singleSMS.recipient || !singleSMS.message) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'لطفاً تمام فیلدها را پر کنید',
        isError: true
      });
      return;
    }

    try {
      await sendSMSMutation.mutateAsync({
        type: 'bulk',
        mobile: singleSMS.recipient,
        messageText: singleSMS.message
      });
      
      setSingleSMS({ recipient: '', message: '', template: '' });
      setSelectedTemplate('');
      
      setCreditModal({
        show: true,
        credit: 0,
        message: 'پیامک با موفقیت ارسال شد',
        isError: false
      });
    } catch (error) {
      setCreditModal({
        show: true,
        credit: 0,
        message: 'خطا در ارسال پیامک',
        isError: true
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">مدیریت پیامک</h1>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 mb-8 inline-flex">
          {[
            { key: 'send', label: 'ارسال تکی', icon: '📱' },
            { key: 'bulk', label: 'ارسال گروهی', icon: '📤' },
            { key: 'templates', label: 'قالب‌ها', icon: '📝' },
            { key: 'logs', label: 'لاگ‌ها', icon: '📊' },
            { key: 'settings', label: 'تنظیمات', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Single SMS Tab */}
        {activeTab === 'send' && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30">
            <h2 className="text-2xl font-bold text-white mb-6">ارسال پیامک تکی</h2>
            <form onSubmit={handleSingleSMSSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  value={singleSMS.recipient}
                  onChange={(e) => setSingleSMS(prev => ({ ...prev, recipient: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="09123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  انتخاب قالب
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleSingleTemplateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="" className="bg-purple-800">انتخاب قالب</option>
                  <option value="orderConfirmation" className="bg-purple-800">تایید سفارش</option>
                  <option value="shipping" className="bg-purple-800">ارسال محصول</option>
                  <option value="verification" className="bg-purple-800">کد تایید</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  متن پیامک
                </label>
                <textarea
                  rows={4}
                  value={singleSMS.message}
                  onChange={(e) => setSingleSMS(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                  placeholder="متن پیامک خود را وارد کنید..."
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                >
                  📤 ارسال پیامک
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk SMS Tab */}
        {activeTab === 'bulk' && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30">
            <h2 className="text-2xl font-bold text-white mb-6">ارسال گروهی پیامک</h2>
            <form onSubmit={handleBulkSMSSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  انتخاب قالب
                </label>
                <select
                  value={bulkSMS.template}
                  onChange={(e) => handleBulkTemplateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="" className="bg-purple-800">انتخاب قالب</option>
                  <option value="orderConfirmation" className="bg-purple-800">تایید سفارش</option>
                  <option value="shipping" className="bg-purple-800">ارسال محصول</option>
                  <option value="verification" className="bg-purple-800">کد تایید</option>
                  <option value="marketing" className="bg-purple-800">تبلیغاتی</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  شماره‌های موبایل (هر شماره در یک خط)
                </label>
                <textarea
                  rows={6}
                  value={bulkSMS.recipients}
                  onChange={(e) => setBulkSMS(prev => ({ ...prev, recipients: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                  placeholder="09123456789
09987654321
09111222333"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  متن پیامک
                </label>
                <textarea
                  rows={4}
                  value={bulkSMS.message}
                  onChange={(e) => setBulkSMS(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                  placeholder="متن پیامک خود را وارد کنید..."
                />
              </div>

              <button
                type="submit"
                disabled={sendSMSMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {sendSMSMutation.isPending ? 'در حال ارسال...' : '📤 ارسال گروهی'}
              </button>
            </form>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">مدیریت قالب‌ها</h2>
              <button
                onClick={() => openTemplateModal()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-lg"
              >
                ➕ افزودن قالب
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {smsTemplates.map((template) => (
                <div key={template.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      template.active 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {template.active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm mb-3 line-clamp-3">{template.content}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-purple-300 capitalize">{template.type}</span>
                    <button
                      onClick={() => openTemplateModal(template)}
                      className="text-purple-300 hover:text-white transition-colors"
                    >
                      ✏️ ویرایش
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30">
            <h2 className="text-2xl font-bold text-white mb-6">لاگ ارسال پیامک</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-purple-200">شماره موبایل</th>
                    <th className="text-left py-3 px-4 text-purple-200">متن پیامک</th>
                    <th className="text-left py-3 px-4 text-purple-200">وضعیت</th>
                    <th className="text-left py-3 px-4 text-purple-200">زمان ارسال</th>
                    <th className="text-left py-3 px-4 text-purple-200">نوع</th>
                  </tr>
                </thead>
                <tbody>
                  {smsLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{log.recipient}</td>
                      <td className="py-3 px-4 text-purple-200 max-w-xs truncate">{log.content}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'sent' 
                            ? 'bg-green-500/20 text-green-300'
                            : log.status === 'failed'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {log.status === 'sent' ? 'ارسال شده' : 
                           log.status === 'failed' ? 'ناموفق' : 'در انتظار'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-purple-200">
                        {new Date(log.sentAt).toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-4 text-purple-200">{log.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30">
            <h2 className="text-2xl font-bold text-white mb-6">تنظیمات پیامک</h2>
            
            <form id="settings" onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    کلید API
                  </label>
                  <input
                    type="text"
                    name="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="کلید API خود را وارد کنید"
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      خط ارسال
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 dropdown-container">
                        {/* نمایش خط انتخاب شده */}
                        <div
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent flex justify-between items-center"
                        >
                          <span>
                            {selectedLineNumber || 'انتخاب خط ارسال'}
                          </span>
                          <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* dropdown لیست */}
                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-purple-800 border border-white/30 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div
                              onClick={() => {
                                setSelectedLineNumber('');
                                setLineSaved(false);
                                setIsDropdownOpen(false);
                              }}
                              className="px-4 py-3 hover:bg-purple-700 cursor-pointer text-purple-200"
                            >
                              انتخاب خط ارسال
                            </div>
                            {availableLineNumbers.map((line: string) => (
                              <div
                                key={line}
                                onClick={() => {
                                  setSelectedLineNumber(line);
                                  setLineSaved(true);
                                  setIsDropdownOpen(false);
                                  setCreditModal({
                                    show: true,
                                    credit: 0,
                                    message: `خط ${line} انتخاب شد. اکنون "ذخیره تنظیمات" را بزنید`,
                                    isError: false
                                  });
                                }}
                                className={`px-4 py-3 hover:bg-purple-700 cursor-pointer ${
                                  selectedLineNumber === line ? 'bg-purple-600 text-white' : 'text-purple-200'
                                }`}
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Hidden input برای form submission */}
                        <input
                          type="hidden"
                          name="lineNumber"
                          value={selectedLineNumber}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={fetchLineNumbers}
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 shadow-lg whitespace-nowrap"
                        title="دریافت لیست خط‌ها"
                      >
                        📋 دریافت خط‌ها
                      </button>
                    </div>
                    {/* نمایش تیک سبز بعد از ذخیره شدن */}
                    {(lineSaved || smsSettings.lineNumber) && (
                      <div className="flex items-center mt-2 text-green-400">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">خط ارسال ذخیره شده</span>
                      </div>
                    )}
                  </div>
              </div>

              {/* Template IDs Section */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-lg font-medium text-white mb-4">کدهای قالب پیامک</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      کد قالب تایید سفارش
                    </label>
                    <input
                      type="number"
                      name="templateIds.orderConfirmation"
                      value={templateIds.orderConfirmation || ''}
                      onChange={(e) => setTemplateIds(prev => ({ ...prev, orderConfirmation: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="مثال: 123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      کد قالب ارسال سفارش
                    </label>
                    <input
                      type="number"
                      name="templateIds.shipping"
                      value={templateIds.shipping || ''}
                      onChange={(e) => setTemplateIds(prev => ({ ...prev, shipping: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="مثال: 789012"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      کد قالب کد تایید
                    </label>
                    <input
                      type="number"
                      name="templateIds.verificationCode"
                      value={templateIds.verificationCode || ''}
                      onChange={(e) => setTemplateIds(prev => ({ ...prev, verificationCode: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="مثال: 345678"
                    />
                  </div>
                </div>
                <p className="text-xs text-purple-300 mt-2">
                  این کدها از پنل SMS.ir دریافت می‌شوند و برای ارسال پیامک‌های خودکار سیستم استفاده می‌شوند
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={testApiConnection}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-lg"
                >
                  🔍 تست اتصال API
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-white/30 text-purple-600 bg-white/20 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-purple-200">فعال‌سازی سیستم پیامک</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={saveSMSSettingsMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saveSMSSettingsMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTemplate?.id ? 'ویرایش قالب' : 'افزودن قالب جدید'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  نام قالب
                </label>
                <input
                  type="text"
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="نام قالب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  نوع قالب
                </label>
                <select
                  value={editingTemplate?.type || 'marketing'}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="order" className="bg-purple-800">سفارش</option>
                  <option value="shipping" className="bg-purple-800">ارسال</option>
                  <option value="verification" className="bg-purple-800">تایید</option>
                  <option value="marketing" className="bg-purple-800">تبلیغاتی</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  متن قالب
                </label>
                <textarea
                  rows={4}
                  value={editingTemplate?.content || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                  placeholder="متن قالب..."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingTemplate?.active || false}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, active: e.target.checked } : null)}
                    className="rounded border-white/30 text-purple-600 bg-white/20 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="mr-2 text-sm text-purple-200">فعال</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
              >
                انصراف
              </button>
              <button
                onClick={saveTemplate}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {creditModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 max-w-md w-full">
            <div className="text-center">
              <div className={`text-6xl mb-4`}>
                {creditModal.isError ? '❌' : '✅'}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${creditModal.isError ? 'text-red-300' : 'text-green-300'}`}>
                {creditModal.isError ? 'خطا' : 'موفق'}
              </h3>
              <p className="text-white mb-4">{creditModal.message}</p>
              {creditModal.credit > 0 && (
                <p className="text-purple-200">
                  اعتبار فعلی: {creditModal.credit} پیامک
                </p>
              )}
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setCreditModal({ show: false, credit: 0, message: '', isError: false })}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200"
              >
                تأیید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
