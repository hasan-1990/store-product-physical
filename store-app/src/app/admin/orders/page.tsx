'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { isOrderPaidForInvoice } from '@/lib/order-status';

interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  _id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'completed';
  total: number;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  notes?: string;
}

const OrdersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [sortBy, setSortBy] = useState('orderDate');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders from API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token from localStorage:', token ? 'Found' : 'Not found');
        
        if (!token) {
          console.warn('⚠️ No admin token found in localStorage. Falling back to session cookies.');
        } else {
          // Decode and log token info when available
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            console.log('👤 Token info:', { userId: decoded.userId, role: decoded.role, email: decoded.email });
          } catch (e) {
            console.error('❌ Failed to decode token');
          }
        }

        console.log('📡 Fetching orders from API...');
        const response = await fetch('/api/admin/orders', {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          credentials: 'include',
          cache: 'no-store'
        });

        console.log('📦 API Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Orders loaded:', data.orders?.length || 0);
          setOrders(data.orders);
          setFilteredOrders(data.orders);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Failed to load orders:', response.status, errorData);
          if (response.status === 401) {
            console.warn('🔒 Redirecting to admin login due to unauthorized response');
            window.location.href = '/admin/login';
          }
        }
      } catch (error) {
        console.error('❌ Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus;
      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'orderDate':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'total':
          return b.total - a.total;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, selectedStatus, selectedPaymentStatus, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'delivered':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'shipped':
        return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      case 'processing':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
      case 'pending':
        return 'bg-orange-900/20 text-orange-400 border-orange-500/30';
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'paid':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-900/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری سفارش‌ها...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت سفارش‌ها</h1>
            <p className="text-gray-300">مشاهده و مدیریت سفارش‌های مشتریان</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">جستجو</label>
              <input
                type="text"
                placeholder="شماره سفارش، نام یا ایمیل مشتری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">وضعیت سفارش</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="all">همه</option>
                <option value="pending">در انتظار</option>
                <option value="processing">در حال پردازش</option>
                <option value="shipped">ارسال شده</option>
                <option value="delivered">تحویل شده</option>
                <option value="cancelled">لغو شده</option>
                <option value="refunded">مرجوع شده</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">وضعیت پرداخت</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="all">همه</option>
                <option value="paid">پرداخت شده</option>
                <option value="pending">در انتظار پرداخت</option>
                <option value="failed">ناموفق</option>
                <option value="refunded">مرجوع شده</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">مرتب‌سازی</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="orderDate">تاریخ سفارش</option>
                <option value="total">مبلغ کل</option>
                <option value="customer">نام مشتری</option>
                <option value="status">وضعیت</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-gray-300">
              {filteredOrders.length} سفارش از {orders.length} سفارش
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-500/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">کاربر</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">تاریخ سفارش</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">مبلغ کل</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">تعداد اقلام</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">وضعیت سفارش</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">وضعیت پرداخت</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="relative w-10 h-10">
                          <Image
                            src={order.customerAvatar || '/images/products/placeholder.svg'}
                            alt={order.customerName}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-white font-medium">{order.customerName}</div>
                          <div className="text-gray-400 text-sm">{order.customerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-medium">
                        {formatPrice(order.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-900/20 text-blue-400 px-2 py-1 rounded text-sm border border-blue-500/30">
                        {order.items.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusColor(order.status)}`}>
                        {order.status === 'completed' ? 'تکمیل شده' :
                         order.status === 'delivered' ? 'تحویل شده' :
                         order.status === 'shipped' ? 'ارسال شده' :
                         order.status === 'processing' ? 'در حال پردازش' :
                         order.status === 'pending' ? 'در انتظار' :
                         order.status === 'cancelled' ? 'لغو شده' :
                         order.status === 'refunded' ? 'مرجوع شده' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm border ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus === 'completed' ? 'تکمیل شده' :
                         order.paymentStatus === 'paid' ? 'پرداخت شده' :
                         order.paymentStatus === 'pending' ? 'در انتظار' :
                         order.paymentStatus === 'failed' ? 'ناموفق' :
                         order.paymentStatus === 'refunded' ? 'مرجوع شده' : order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 bg-blue-900/20 text-blue-400 rounded-lg hover:bg-blue-900/40 transition-colors border border-blue-500/30"
                          title="مشاهده جزئیات"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {isOrderPaidForInvoice(order.paymentStatus) && (
                          <button
                            onClick={() => {
                              window.open(`/api/invoice/${order._id}`, '_blank', 'noopener,noreferrer');
                            }}
                            className="p-2 bg-purple-900/20 text-purple-400 rounded-lg hover:bg-purple-900/40 transition-colors border border-purple-500/30"
                            title="مشاهده فاکتور"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        {isOrderPaidForInvoice(order.paymentStatus) && (
                          <button
                            className="p-2 bg-green-900/20 text-green-400 rounded-lg hover:bg-green-900/40 transition-colors border border-green-500/30"
                            title="ارسال ایمیل فاکتور"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">هیچ سفارشی یافت نشد</div>
              <div className="text-gray-500">فیلترهای خود را تغییر دهید تا سفارش‌های بیشتری ببینید</div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">جزئیات سفارش {selectedOrder.id}</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">اطلاعات مشتری</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse mb-3">
                      <div className="relative w-12 h-12">
                        <Image
                          src={selectedOrder.customerAvatar || '/images/products/placeholder.svg'}
                          alt={selectedOrder.customerName}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">{selectedOrder.customerName}</div>
                        <div className="text-gray-400">{selectedOrder.customerEmail}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">اقلام سفارش</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="bg-gray-900/50 p-4 rounded-lg flex items-center space-x-4 space-x-reverse">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-400">تعداد: {item.quantity}</div>
                        </div>
                        <div className="text-green-400 font-medium">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">آدرس ارسال</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="text-gray-300">
                      {selectedOrder.shippingAddress.street}<br/>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br/>
                      {selectedOrder.shippingAddress.country}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">خلاصه سفارش</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">تاریخ سفارش:</span>
                      <span className="text-white">{formatDate(selectedOrder.orderDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">وضعیت:</span>
                      <span className={`px-2 py-1 rounded text-sm border ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status === 'delivered' ? 'تحویل شده' :
                         selectedOrder.status === 'shipped' ? 'ارسال شده' :
                         selectedOrder.status === 'processing' ? 'در حال پردازش' :
                         selectedOrder.status === 'pending' ? 'در انتظار' :
                         selectedOrder.status === 'cancelled' ? 'لغو شده' :
                         selectedOrder.status === 'refunded' ? 'مرجوع شده' : selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">وضعیت پرداخت:</span>
                      <span className={`px-2 py-1 rounded text-sm border ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus === 'paid' ? 'پرداخت شده' :
                         selectedOrder.paymentStatus === 'pending' ? 'در انتظار پرداخت' :
                         selectedOrder.paymentStatus === 'failed' ? 'ناموفق' :
                         selectedOrder.paymentStatus === 'refunded' ? 'مرجوع شده' : selectedOrder.paymentStatus}
                      </span>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">شماره پیگیری:</span>
                        <span className="text-white">{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-700 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-medium">
                        <span className="text-white">مجموع:</span>
                        <span className="text-green-400">{formatPrice(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersAdmin;
