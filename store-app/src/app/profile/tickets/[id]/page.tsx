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

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
        router.push('/login');
        return;
      }

      console.log('🔄 درخواست بارگذاری تیکت:', id);

      const response = await fetch(`/api/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📥 داده دریافت شده:', {
        success: data.success,
        messagesCount: data.ticket?.messages?.length
      });

      if (data.success) {
        setTicket(data.ticket);
        console.log('✅ تیکت بروزرسانی شد. تعداد پیام‌ها:', data.ticket.messages?.length);
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
        toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
        router.push('/login');
        return;
      }

      console.log('🔄 ارسال پیام به تیکت:', ticketId);
      
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
        toast.error(errorData.error || 'مشکلی در ارسال پیام پیش آمد');
        return;
      }

      const data = await response.json();
      console.log('✅ پاسخ موفق:', data);

      if (data.success) {
        console.log('✅ نتیجه ارسال:', data);
        setNewMessage('');
        
        // بارگذاری مجدد تیکت
        console.log('🔄 بارگذاری مجدد تیکت...');
        await loadTicket(ticketId);
        
        toast.success('پیام شما با موفقیت ارسال شد');
      } else {
        toast.error(data.error || 'مشکلی در ارسال پیام پیش آمد');
      }
    } catch (error) {
      console.error('❌ خطا در ارسال پیام:', error);
      toast.error('خطا در ارسال پیام. لطفاً اتصال اینترنت خود را بررسی کنید');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تیکت را ببندید؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'closed' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('تیکت با موفقیت بسته شد');
        loadTicket(ticketId);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('خطا در بستن تیکت:', error);
      toast.error('خطا در بستن تیکت');
    }
  };

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

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">تیکت یافت نشد</h2>
          <Link
            href="/profile/tickets"
            className="text-purple-600 hover:underline"
          >
            بازگشت به لیست تیکت‌ها
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/profile/tickets"
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              ← بازگشت
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {ticket.ticketNumber}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full text-white ${statusColors[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{ticket.subject}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span>{categoryLabels[ticket.category]}</span>
                <span>•</span>
                <span>{priorityLabels[ticket.priority]}</span>
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

            {ticket.status !== 'closed' && (
              <button
                onClick={handleCloseTicket}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all"
              >
                🔒 بستن تیکت
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6" style={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto' }}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">پیام‌ها</h2>
          
          <div className="space-y-4">
            {ticket.messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[70%] ${
                  msg.senderType === 'admin'
                    ? 'bg-purple-50 border-r-4 border-purple-500'
                    : 'bg-blue-50 border-l-4 border-blue-500'
                } p-4 rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">
                      {msg.senderType === 'admin' ? '👨‍💼 پشتیبانی' : '👤 ' + msg.senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleDateString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' ? (
          <form onSubmit={handleSendMessage} className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">پاسخ به تیکت</h3>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
              placeholder="پیام خود را بنویسید..."
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all ${
                sending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
            >
              {sending ? '⏳ در حال ارسال...' : '📤 ارسال پیام'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-100 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">این تیکت بسته شده است</h3>
            <p className="text-gray-600">برای ادامه گفتگو، لطفاً تیکت جدیدی ایجاد کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}
