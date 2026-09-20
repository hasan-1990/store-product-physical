'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
  _id: string;
  ticketNumber: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  answered: number;
  closed: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
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

const priorityColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<{ id: string; number: string; subject: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  // ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal && !isDeleting) {
        closeDeleteModal();
      }
    };

    if (showDeleteModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDeleteModal, isDeleting]);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🎫 Loading tickets with token:', token ? 'Yes' : 'No');
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.priority !== 'all') params.append('priority', filters.priority);

      const url = `/api/admin/tickets?${params.toString()}`;
      console.log('🌐 Fetching:', url);

      const requestHeaders: Record<string, string> = {};
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: Object.keys(requestHeaders).length ? requestHeaders : undefined,
        credentials: 'include',
        cache: 'no-store'
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        console.log('✅ Tickets loaded:', data.tickets.length);
        setTickets(data.tickets);
        setStats(data.stats);
      } else {
        console.error('❌ API returned error:', data.error);
        if (response.status === 401 || response.status === 403) {
          router.push('/admin/login');
        }
        alert(`خطا: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ خطا در بارگذاری تیکت‌ها:', error);
      alert('خطا در بارگذاری تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ ticketId, status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        loadTickets();
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('خطا در بروزرسانی وضعیت:', error);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ ticketId, priority: newPriority })
      });

      const data = await response.json();
      if (data.success) {
        loadTickets();
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('خطا در بروزرسانی اولویت:', error);
    }
  };

  const openDeleteModal = (ticket: Ticket) => {
    setTicketToDelete({
      id: ticket._id,
      number: ticket.ticketNumber,
      subject: ticket.subject
    });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTicketToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/tickets?ticketId=${ticketToDelete.id}`, {
        method: 'DELETE',
        headers: Object.keys(headers).length ? headers : undefined,
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        closeDeleteModal();
        setShowSuccessToast(true);
        loadTickets();
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
      } else {
        alert(`خطا: ${data.error}`);
      }
    } catch (error) {
      console.error('خطا در حذف تیکت:', error);
      alert('خطا در حذف تیکت');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">مدیریت تیکت‌های پشتیبانی</h1>
          <p className="text-purple-100">مدیریت و پاسخ به درخواست‌های کاربران</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
              <div className="text-sm text-gray-400">کل تیکت‌ها</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-blue-500/30">
              <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
              <div className="text-sm text-gray-400">باز</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
              <div className="text-sm text-gray-400">در حال بررسی</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">{stats.answered}</div>
              <div className="text-sm text-gray-400">پاسخ داده شده</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-500/30">
              <div className="text-2xl font-bold text-gray-400">{stats.closed}</div>
              <div className="text-sm text-gray-400">بسته شده</div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 جستجو در تیکت‌ها (شماره، موضوع، نام، ایمیل)..."
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">وضعیت</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">همه</option>
                <option value="open">باز</option>
                <option value="in_progress">در حال بررسی</option>
                <option value="answered">پاسخ داده شده</option>
                <option value="closed">بسته شده</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">دسته‌بندی</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">همه</option>
                <option value="technical">فنی</option>
                <option value="sales">فروش</option>
                <option value="payment">پرداخت</option>
                <option value="shipping">ارسال</option>
                <option value="other">سایر</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">اولویت</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">همه</option>
                <option value="urgent">فوری</option>
                <option value="high">زیاد</option>
                <option value="medium">متوسط</option>
                <option value="low">کم</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold mb-2">هیچ تیکتی یافت نشد</h3>
            <p className="text-gray-400">تیکتی با فیلترهای انتخابی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="font-mono text-sm bg-gray-700 px-3 py-1 rounded-full">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full text-white ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full text-white ${priorityColors[ticket.priority]}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-gray-700">
                        {categoryLabels[ticket.category]}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mb-2">{ticket.subject}</h3>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                      <span>👤 {ticket.userName}</span>
                      <span>•</span>
                      <span>📧 {ticket.userEmail}</span>
                      <span>•</span>
                      <span>💬 {ticket.messages?.length || 0} پیام</span>
                      <span>•</span>
                      <span>🕐 {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2">
                    <Link
                      href={`/admin/tickets/${ticket._id}`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all text-center text-sm font-medium"
                    >
                      📝 مشاهده و پاسخ
                    </Link>

                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="open">باز</option>
                      <option value="in_progress">در حال بررسی</option>
                      <option value="answered">پاسخ داده شده</option>
                      <option value="closed">بسته شده</option>
                    </select>

                    <select
                      value={ticket.priority}
                      onChange={(e) => handlePriorityChange(ticket._id, e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">زیاد</option>
                      <option value="urgent">فوری</option>
                    </select>

                    <button
                      onClick={() => openDeleteModal(ticket)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-sm font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              closeDeleteModal();
            }
          }}
        >
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500/30 animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">حذف تیکت</h3>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6 text-center">
                <p className="text-gray-300 mb-4">
                  آیا از حذف این تیکت اطمینان دارید؟
                </p>
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">شماره تیکت:</span>
                    <span className="font-mono text-purple-400">{ticketToDelete.number}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-400">موضوع:</span>
                    <span className="text-sm text-white text-right max-w-[200px]">{ticketToDelete.subject}</span>
                  </div>
                </div>
                <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-300">
                    ⚠️ این عملیات غیرقابل بازگشت است
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>در حال حذف...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>حذف تیکت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-slideDown">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-400/30">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold">حذف موفق</p>
              <p className="text-sm text-green-100">تیکت با موفقیت حذف شد</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
