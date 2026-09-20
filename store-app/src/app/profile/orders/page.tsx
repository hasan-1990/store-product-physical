'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { isOrderPaidForInvoice } from '@/lib/order-status';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  productType: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  contactInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  shippingAddress?: {
    address: string;
    provinceId: string;
    cityId: string;
    zipCode: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  discountAmount: number;
  discountCode?: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode JWT to get userId
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      const userIdFromToken = decoded.userId;
      setUserId(userIdFromToken);
      
      if (userIdFromToken) {
        fetchOrders(userIdFromToken);
      }
    } catch (error) {
      console.error('خطا در decode token:', error);
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  const fetchOrders = async (userIdParam: string) => {
    try {
      console.log('📦 Fetching orders for user:', userIdParam);
      
      const response = await fetch(`/api/orders?userId=${userIdParam}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📡 Orders API Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Orders API Response:', data);

      if (data.success) {
        setOrders(data.data || []);
        console.log('✅ Loaded orders:', data.data?.length || 0);
      } else {
        console.error('❌ Failed to load orders:', data.error);
      }
    } catch (error) {
      console.error('خطا در دریافت سفارشات:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'pending') return order.status === 'pending';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            ✅ تکمیل شده
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            ⏳ در انتظار
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            ❌ لغو شده
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'online':
        return '💳 پرداخت آنلاین';
      case 'free':
        return '🎉 رایگان (تخفیف 100%)';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-12 h-12 text-white mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">در حال بارگذاری سفارشات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/profile"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">سفارشات من</h1>
              <p className="text-gray-300 mt-1">مدیریت و پیگیری سفارشات شما</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-2 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            همه ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            تکمیل شده ({orders.filter(o => o.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            در انتظار ({orders.filter(o => o.status === 'pending').length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-6xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              هیچ سفارشی یافت نشد
            </h3>
            <p className="text-gray-300 mb-6">
              شما هنوز هیچ سفارشی ثبت نکرده‌اید
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
            >
              🛍️ شروع خرید
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400">شماره سفارش</p>
                      <p className="text-white font-mono font-bold">{order.orderNumber}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-400">تاریخ ثبت</p>
                    <p className="text-white">
                      {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {item.productType === 'DIGITAL' ? '📥' : '📦'}
                        </span>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.productType === 'DIGITAL' ? 'محصول دیجیتال' : 'محصول فیزیکی'}
                            {' • '}
                            تعداد: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="text-white font-medium">
                        {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">روش پرداخت:</span>
                      <span className="text-white">{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">تخفیف:</span>
                        <span className="text-green-400">
                          {order.discountAmount.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm text-gray-400">مبلغ کل</p>
                      <p className="text-2xl font-bold text-white">
                        {order.totalAmount.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOrderPaidForInvoice(order.paymentStatus) && (
                        <button
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            window.open(`/api/invoice/${order._id}?token=${token}`, '_blank');
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                          title="دانلود فاکتور"
                        >
                          <span>🧾</span>
                          <span>فاکتور</span>
                        </button>
                      )}
                      
                      {order.items.some(item => item.productType === 'DIGITAL') && order.status === 'completed' && (
                        <Link
                          href="/profile/downloads"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <span>📥</span>
                          <span>دانلود</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
