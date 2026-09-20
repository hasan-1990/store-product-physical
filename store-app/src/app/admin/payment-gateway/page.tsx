'use client';

import { useState, useEffect } from 'react';
import { useUrlTab } from '@/hooks/useUrlTab';

interface PaymentGateway {
  _id?: string;
  id?: string;
  name: string;
  type: 'zarinpal' | 'mellat' | 'parsian' | 'saderat' | 'crypto';
  merchantId: string;
  apiKey: string;
  active: boolean;
  commissionRate: number;
  testMode: boolean;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  gateway: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  transactionId?: string;
  createdAt: Date;
  customerName: string;
}

const PaymentGatewayPage = () => {
  const [activeTab, setActiveTab] = useUrlTab('gateways');
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      amount: 250000,
      gateway: 'زرین‌پال',
      status: 'success',
      transactionId: 'TXN-2024-001',
      createdAt: new Date(Date.now() - 3600000),
      customerName: 'علی احمدی'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      amount: 180000,
      gateway: 'زرین‌پال',
      status: 'failed',
      createdAt: new Date(Date.now() - 7200000),
      customerName: 'سارا کریمی'
    },
    {
      id: '3',
      orderId: 'ORD-003',
      amount: 420000,
      gateway: 'بانک ملت',
      status: 'pending',
      createdAt: new Date(Date.now() - 1800000),
      customerName: 'محمد رضایی'
    }
  ]);

  const [paymentSettings, setPaymentSettings] = useState({
    currency: 'IRR',
    minAmount: 10000,
    maxAmount: 50000000,
    autoCapture: true,
    enableRefund: true,
    refundTimeLimit: 30
  });

  // Load gateways from API
  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/payment-gateways');
      const data = await response.json();
      if (data.success) {
        setPaymentGateways(data.gateways);
      } else {
        console.error('Failed to fetch gateways:', data.error);
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGatewayModal = (gateway?: PaymentGateway) => {
    setEditingGateway(gateway || {
      name: '',
      type: 'zarinpal',
      merchantId: '',
      apiKey: '',
      active: false,
      commissionRate: 0,
      testMode: true
    });
    setShowGatewayModal(true);
  };

  const saveGateway = async () => {
    if (!editingGateway) return;

    try {
      const method = editingGateway._id || editingGateway.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/payment-gateways', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGateway)
      });

      const data = await response.json();
      if (data.success) {
        await fetchGateways(); // Reload list
        setShowGatewayModal(false);
        setEditingGateway(null);
        alert('✅ درگاه با موفقیت ذخیره شد');
      } else {
        alert('❌ خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving gateway:', error);
      alert('❌ خطا در ذخیره درگاه');
    }
  };

  const deleteGateway = async (id: string) => {
    if (!confirm('آیا از حذف این درگاه مطمئن هستید؟')) return;

    try {
      const response = await fetch(`/api/admin/payment-gateways?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchGateways();
        alert('✅ درگاه حذف شد');
      } else {
        alert('❌ خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting gateway:', error);
      alert('❌ خطا در حذف درگاه');
    }
  };

  const toggleGatewayActive = async (id: string) => {
    const gateway = paymentGateways.find(g => g._id === id || g.id === id);
    if (!gateway) return;

    try {
      const response = await fetch(`/api/admin/payment-gateways/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !gateway.active })
      });

      const data = await response.json();
      if (data.success) {
        await fetchGateways();
      } else {
        alert('❌ خطا: ' + data.error);
      }
    } catch (error) {
      console.error('Error toggling gateway:', error);
      alert('❌ خطا در تغییر وضعیت');
    }
  };

  const testGateway = async (gateway: PaymentGateway) => {
    const gatewayId = gateway._id || gateway.id;
    setTestingGateway(gatewayId || null);

    try {
      const response = await fetch('/api/payment/test-connection');
      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\n` +
              `📦 منبع تنظیمات: ${data.details.configSource || 'نامشخص'}\n` +
              `🔑 Authority: ${data.details.authority}\n` +
              `🧪 Sandbox: ${data.details.sandboxMode ? 'بله' : 'خیر'}`);
      } else {
        alert(`❌ تست اتصال ناموفق!\n\n` +
              `خطا: ${data.error}\n` +
              `جزئیات: ${data.details}\n` +
              `${data.code ? `کد خطا: ${data.code}` : ''}`);
      }
    } catch (error) {
      console.error('Error testing gateway:', error);
      alert('❌ خطا در اتصال به سرور');
    } finally {
      setTestingGateway(null);
    }
  };

  const savePaymentSettings = () => {
    alert('تنظیمات پرداخت ذخیره شد!');
  };

  const getGatewayIcon = (type: PaymentGateway['type']) => {
    switch (type) {
      case 'zarinpal':
        return '🟢';
      case 'mellat':
        return '🏦';
      case 'parsian':
        return '🏛️';
      case 'saderat':
        return '🏪';
      case 'crypto':
        return '₿';
      default:
        return '💳';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'موفق';
      case 'failed':
        return 'ناموفق';
      case 'pending':
        return 'در انتظار';
      case 'cancelled':
        return 'لغو شده';
      default:
        return 'نامشخص';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">مدیریت درگاه‌های پرداخت</h1>
        <p className="text-gray-300">تنظیمات و مدیریت درگاه‌های پرداخت آنلاین</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center ml-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">342</p>
              <p className="text-gray-400 text-sm">پرداخت موفق</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center ml-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">28</p>
              <p className="text-gray-400 text-sm">پرداخت ناموفق</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center ml-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">85.2M</p>
              <p className="text-gray-400 text-sm">کل مبلغ پرداخت</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center ml-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">92.4%</p>
              <p className="text-gray-400 text-sm">نرخ موفقیت</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="flex border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('gateways')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'gateways'
                ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            درگاه‌های پرداخت
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            تراکنش‌ها
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-purple-500/20 text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            تنظیمات
          </button>
        </div>

        <div className="p-6">
          {/* Gateways Tab */}
          {activeTab === 'gateways' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">درگاه‌های پرداخت</h2>
                <button
                  onClick={() => openGatewayModal()}
                  className="btn-primary"
                >
                  افزودن درگاه جدید
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-gray-400 mt-2">در حال بارگذاری...</p>
                </div>
              ) : paymentGateways.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">هیچ درگاه پرداختی یافت نشد</p>
                  <p className="text-gray-500 text-sm mt-2">از دکمه "افزودن درگاه جدید" استفاده کنید</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {paymentGateways.map((gateway) => (
                    <div
                      key={gateway._id || gateway.id}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50"
                    >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">{getGatewayIcon(gateway.type)}</span>
                        <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            gateway.active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {gateway.active ? 'فعال' : 'غیرفعال'}
                        </span>
                        {gateway.testMode ? (
                          <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                            🧪 Sandbox
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
                            🔴 Production
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => testGateway(gateway)}
                          disabled={testingGateway === (gateway._id || gateway.id)}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingGateway === (gateway._id || gateway.id) ? '⏳ در حال تست...' : 'تست اتصال'}
                        </button>
                        <button
                          onClick={() => toggleGatewayActive(gateway._id || gateway.id || '')}
                          className="text-green-400 hover:text-green-300"
                        >
                          {gateway.active ? 'غیرفعال کردن' : 'فعال کردن'}
                        </button>
                        <button
                          onClick={() => openGatewayModal(gateway)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => deleteGateway(gateway._id || gateway.id || '')}
                          className="text-red-400 hover:text-red-300"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">شناسه پذیرنده:</span>
                        <p className="text-white font-mono">{gateway.merchantId}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">نرخ کمیسیون:</span>
                        <p className="text-white font-medium">{gateway.commissionRate}%</p>
                      </div>
                      <div>
                        <span className="text-gray-400">نوع درگاه:</span>
                        <p className="text-white">{gateway.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">تاریخچه تراکنش‌ها</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">شماره سفارش</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">مشتری</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">مبلغ</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">درگاه</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">وضعیت</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">شناسه تراکنش</th>
                      <th className="text-right py-3 px-4 text-gray-300 font-medium">زمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-700/30">
                        <td className="py-4 px-4 text-white font-mono">{transaction.orderId}</td>
                        <td className="py-4 px-4 text-gray-300">{transaction.customerName}</td>
                        <td className="py-4 px-4 text-white font-medium">
                          {transaction.amount.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="py-4 px-4 text-gray-300">{transaction.gateway}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(transaction.status)}`}>
                            {getStatusText(transaction.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300 font-mono">
                          {transaction.transactionId || '-'}
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {transaction.createdAt.toLocaleString('fa-IR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">تنظیمات پرداخت</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">تنظیمات عمومی</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        واحد پول
                      </label>
                      <select
                        value={paymentSettings.currency}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                        className="input-field"
                      >
                        <option value="IRR">تومان (IRR)</option>
                        <option value="USD">دلار (USD)</option>
                        <option value="EUR">یورو (EUR)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        حداقل مبلغ پرداخت (تومان)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.minAmount}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, minAmount: parseInt(e.target.value) || 0 })}
                        className="input-field"
                        placeholder="10000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        حداکثر مبلغ پرداخت (تومان)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.maxAmount}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, maxAmount: parseInt(e.target.value) || 0 })}
                        className="input-field"
                        placeholder="50000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">تنظیمات پیشرفته</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="autoCapture"
                        checked={paymentSettings.autoCapture}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, autoCapture: e.target.checked })}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <label htmlFor="autoCapture" className="text-gray-300">
                        تسویه خودکار پرداخت
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        id="enableRefund"
                        checked={paymentSettings.enableRefund}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, enableRefund: e.target.checked })}
                        className="w-4 h-4 text-purple-500 rounded"
                      />
                      <label htmlFor="enableRefund" className="text-gray-300">
                        امکان استرداد وجه
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        مهلت استرداد (روز)
                      </label>
                      <input
                        type="number"
                        value={paymentSettings.refundTimeLimit}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, refundTimeLimit: parseInt(e.target.value) || 0 })}
                        className="input-field"
                        placeholder="30"
                        disabled={!paymentSettings.enableRefund}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={savePaymentSettings} className="btn-primary">
                  ذخیره تنظیمات
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gateway Modal */}
      {showGatewayModal && editingGateway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingGateway.id ? 'ویرایش درگاه پرداخت' : 'افزودن درگاه پرداخت'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نام درگاه</label>
                <input
                  type="text"
                  value={editingGateway.name}
                  onChange={(e) => setEditingGateway({ ...editingGateway, name: e.target.value })}
                  className="input-field"
                  placeholder="نام درگاه"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نوع درگاه</label>
                <select
                  value={editingGateway.type}
                  onChange={(e) => setEditingGateway({ ...editingGateway, type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="zarinpal">زرین‌پال</option>
                  <option value="mellat">بانک ملت</option>
                  <option value="parsian">بانک پارسیان</option>
                  <option value="saderat">بانک صادرات</option>
                  <option value="crypto">ارز دیجیتال</option>
                </select>
              </div>
              
              {/* Sandbox Mode Checkbox */}
              <div className="flex items-center space-x-3 space-x-reverse bg-gray-700/30 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="testModeTop"
                  checked={editingGateway.testMode}
                  onChange={(e) => setEditingGateway({ ...editingGateway, testMode: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded"
                />
                <label htmlFor="testModeTop" className="text-gray-300 flex items-center">
                  {editingGateway.testMode ? '🧪 Sandbox (تست)' : '🔴 Production (واقعی)'}
                </label>
              </div>

              {/* Merchant ID - Changes based on mode */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingGateway.testMode ? '🧪 شناسه پذیرنده Sandbox' : '🔴 شناسه پذیرنده Production'}
                </label>
                <input
                  type="text"
                  value={editingGateway.merchantId}
                  onChange={(e) => setEditingGateway({ ...editingGateway, merchantId: e.target.value })}
                  className="input-field"
                  placeholder={editingGateway.testMode 
                    ? "12345678-1234-1234-1234-123456789012" 
                    : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
                />
                {editingGateway.testMode ? (
                  <p className="text-xs text-yellow-400 mt-1">
                    💡 برای تست از Sandbox Merchant ID استفاده کنید
                  </p>
                ) : (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ از Merchant ID واقعی خود استفاده کنید - پول واقعی!
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">کلید API</label>
                <input
                  type="password"
                  value={editingGateway.apiKey}
                  onChange={(e) => setEditingGateway({ ...editingGateway, apiKey: e.target.value })}
                  className="input-field"
                  placeholder="API Key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">نرخ کمیسیون (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingGateway.commissionRate}
                  onChange={(e) => setEditingGateway({ ...editingGateway, commissionRate: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="1.5"
                />
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="gatewayActive"
                  checked={editingGateway.active}
                  onChange={(e) => setEditingGateway({ ...editingGateway, active: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded"
                />
                <label htmlFor="gatewayActive" className="text-gray-300">فعال</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowGatewayModal(false)}
                className="btn-secondary"
              >
                انصراف
              </button>
              <button onClick={saveGateway} className="btn-primary">
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGatewayPage;
