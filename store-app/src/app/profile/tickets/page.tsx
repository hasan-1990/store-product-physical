'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
}

const categoryLabels: Record<string, string> = {
  technical: '🔧 فنی',
  sales: '💰 فروش',
  payment: '💳 پرداخت',
  shipping: '📦 ارسال',
  other: '📋 سایر'
};

const priorityLabels: Record<string, string> = {
  low: '🟢 کم',
  medium: '🟡 متوسط',
  high: '🟠 زیاد',
  urgent: '🔴 فوری'
};

const statusLabels: Record<string, string> = {
  open: '🆕 باز',
  in_progress: '⏳ در حال بررسی',
  answered: '✅ پاسخ داده شده',
  closed: '🔒 بسته شده'
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  answered: 'bg-green-500',
  closed: 'bg-gray-500'
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تیکت‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 mb-2">تیکت‌های پشتیبانی</h1>
              <p className="text-gray-600">مشاهده و مدیریت درخواست‌های پشتیبانی</p>
            </div>
            <Link
              href="/profile/tickets/new"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-bold flex items-center gap-2"
            >
              <span>➕</span>
              <span>تیکت جدید</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
              <div className="text-sm text-gray-600">کل تیکت‌ها</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">در حال بررسی</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'answered').length}
              </div>
              <div className="text-sm text-gray-600">پاسخ داده شده</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
              <div className="text-2xl font-bold text-gray-600">
                {tickets.filter(t => t.status === 'closed').length}
              </div>
              <div className="text-sm text-gray-600">بسته شده</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              همه ({tickets.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              باز ({tickets.filter(t => t.status === 'open').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'in_progress'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              در حال بررسی ({tickets.filter(t => t.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'answered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              پاسخ داده شده ({tickets.filter(t => t.status === 'answered').length})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === 'closed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              بسته شده ({tickets.filter(t => t.status === 'closed').length})
            </button>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">هیچ تیکتی یافت نشد</h3>
            <p className="text-gray-500 mb-6">برای ارسال درخواست جدید، روی دکمه "تیکت جدید" کلیک کنید</p>
            <Link
              href="/profile/tickets/new"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
            >
              ➕ ایجاد اولین تیکت
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket._id}
                href={`/profile/tickets/${ticket._id}`}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-r-4 border-purple-500"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full text-white ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{ticket.subject}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>{categoryLabels[ticket.category]}</span>
                      <span>•</span>
                      <span>{priorityLabels[ticket.priority]}</span>
                      <span>•</span>
                      <span>💬 {ticket.messages?.length || 0} پیام</span>
                      <span>•</span>
                      <span>🕐 {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600 font-medium">
                    <span>مشاهده جزئیات</span>
                    <span>←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
