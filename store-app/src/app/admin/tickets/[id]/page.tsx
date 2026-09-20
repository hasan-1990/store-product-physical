'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TicketMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
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

export default function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ticketId, setTicketId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setTicketId(p.id);
      loadTicket(p.id);
    });
  }, []);

  useEffect(() => {
    if (ticket) {
      scrollToBottom();
    }
  }, [ticket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      console.log('🔄 [ADMIN] درخواست بارگذاری تیکت:', id);

      const response = await fetch(`/api/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📥 [ADMIN] داده دریافت شده:', {
        success: data.success,
        messagesCount: data.ticket?.messages?.length
      });

      if (data.success) {
        setTicket(data.ticket);
        console.log('✅ [ADMIN] تیکت بروزرسانی شد. تعداد پیام‌ها:', data.ticket.messages?.length);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('خطا در بارگذاری تیکت:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error('لطفاً پیام خود را وارد کنید');
      return;
    }

    if (!ticketId) {
      toast.error('شناسه تیکت یافت نشد');
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('لطفاً ابتدا وارد پنل ادمین شوید');
        router.push('/admin/login');
        return;
      }

      console.log('🔄 ارسال پاسخ ادمین به تیکت:', ticketId);
      
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      console.log('📡 پاسخ سرور:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ خطای سرور:', errorData);
        toast.error(errorData.error || 'مشکلی در ارسال پاسخ پیش آمد');
        return;
      }

      const data = await response.json();
      console.log('✅ پاسخ موفق:', data);

      if (data.success) {
        console.log('✅ [ADMIN] نتیجه ارسال:', data);
        setNewMessage('');
        
        // بارگذاری مجدد تیکت
        console.log('🔄 [ADMIN] بارگذاری مجدد تیکت...');
        await loadTicket(ticketId);
        
        toast.success('پاسخ شما با موفقیت ارسال شد');
      } else {
        toast.error(data.error || 'مشکلی در ارسال پاسخ پیش آمد');
      }
    } catch (error) {
      console.error('❌ خطا در ارسال پاسخ:', error);
      toast.error('خطا در ارسال پاسخ. لطفاً اتصال اینترنت خود را بررسی کنید');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId, status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        loadTicket(ticketId);
      }
    } catch (error) {
      console.error('خطا در بروزرسانی وضعیت:', error);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId, priority: newPriority })
      });

      const data = await response.json();
      if (data.success) {
        loadTicket(ticketId);
      }
    } catch (error) {
      console.error('خطا در بروزرسانی اولویت:', error);
    }
  };

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

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">تیکت یافت نشد</h2>
          <Link href="/admin/tickets" className="text-purple-400 hover:underline">
            بازگشت به لیست تیکت‌ها
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/tickets"
              className="text-white hover:text-purple-200 transition-colors"
            >
              ← بازگشت
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-sm bg-white/20 px-3 py-1 rounded-full">
                  {ticket.ticketNumber}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full text-white ${statusColors[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full text-white ${priorityColors[ticket.priority]}`}>
                  {priorityLabels[ticket.priority]}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20">
                  {categoryLabels[ticket.category]}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-3">{ticket.subject}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-purple-100">
                <span>👤 {ticket.userName}</span>
                <span>•</span>
                <span>📧 {ticket.userEmail}</span>
                <span>•</span>
                <span>🕐 {new Date(ticket.createdAt).toLocaleDateString('fa-IR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="open" className="text-gray-900">🆕 باز</option>
                <option value="in_progress" className="text-gray-900">⏳ در حال بررسی</option>
                <option value="answered" className="text-gray-900">✅ پاسخ داده شده</option>
                <option value="closed" className="text-gray-900">🔒 بسته شده</option>
              </select>

              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="low" className="text-gray-900">🟢 کم</option>
                <option value="medium" className="text-gray-900">🟡 متوسط</option>
                <option value="high" className="text-gray-900">🟠 زیاد</option>
                <option value="urgent" className="text-gray-900">🔴 فوری</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700" style={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto' }}>
          <h2 className="text-xl font-bold mb-4">گفتگو</h2>
          
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[70%] ${
                  msg.senderType === 'admin'
                    ? 'bg-purple-600/20 border-r-4 border-purple-500'
                    : 'bg-blue-600/20 border-l-4 border-blue-500'
                } p-4 rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {msg.senderType === 'admin' ? '👨‍💼 پشتیبانی (شما)' : '👤 ' + msg.senderName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' ? (
          <form onSubmit={handleSendMessage} className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">پاسخ به تیکت</h3>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              placeholder="پاسخ خود را بنویسید..."
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all ${
                sending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {sending ? '⏳ در حال ارسال...' : '📤 ارسال پاسخ'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-700">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">این تیکت بسته شده است</h3>
            <p className="text-gray-400">برای ادامه گفتگو، کاربر باید تیکت جدیدی ایجاد کند</p>
          </div>
        )}
      </div>
    </div>
  );
}
