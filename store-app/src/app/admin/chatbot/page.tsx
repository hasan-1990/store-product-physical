'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp, Trash2, Search, Calendar, ArrowUpDown, Settings } from 'lucide-react';

interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: any[];
}

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  topProducts: Array<{ name: string; count: number }>;
  recentActivity: number;
}

interface ChatbotSettings {
  enabled?: boolean;
  provider?: 'gemini' | 'openai';
  gemini_api_key?: string;
  openai_api_key?: string;
  system_prompt?: string;
}

function parseEnabledSetting(value: unknown): boolean {
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return true;
}

export default function ChatbotAdminPage() {
  const [activeTab, setActiveTab] = useState<'conversations' | 'settings' | 'prompts'>('conversations');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  
  // Settings state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState<ChatbotSettings>({
    enabled: true,
    provider: 'gemini',
    gemini_api_key: '',
    openai_api_key: '',
    system_prompt: ''
  });

  // Prompt runner state
  const [promptItems, setPromptItems] = useState<Array<{ id: string; text: string }>>([
    { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: '' },
  ]);
  const [promptRunning, setPromptRunning] = useState(false);
  const [promptResults, setPromptResults] = useState<Record<string, { response?: string; error?: string }>>({});

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, [dateFilter, sortOrder]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/chatbot-settings', {
        credentials: 'include',
      });
      const data = await res.json();
      
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          ...data.settings,
          enabled: parseEnabledSetting(data.settings?.enabled),
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    console.log('Saving:', { key, value }); // Debug

    try {
      const res = await fetch('/api/admin/chatbot-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      const data = await res.json();
      console.log('Response:', data); // Debug

      if (data.success) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد ✅' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در ذخیره' });
      }
    } catch (error) {
      console.error('Save error:', error); // Debug
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('آیا از حذف این تنظیم اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/admin/chatbot-settings?key=${key}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: '' }));
        setMessage({ type: 'success', text: 'تنظیم با موفقیت حذف شد' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در حذف تنظیم' });
    }
  };

  const handleProviderChange = (provider: 'gemini' | 'openai') => {
    setSettings(prev => ({ ...prev, provider }));
  };

  const handleToggleEnabled = async () => {
    const nextValue = !parseEnabledSetting(settings.enabled);
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/chatbot-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'enabled', value: nextValue }),
      });

      const data = await res.json();

      if (data.success) {
        setSettings((prev) => ({ ...prev, enabled: nextValue }));
        setMessage({
          type: 'success',
          text: nextValue ? 'چت‌بات در فروشگاه فعال شد ✅' : 'چت‌بات در فروشگاه غیرفعال شد',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'خطا در ذخیره' });
      }
    } catch {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setSaving(false);
    }
  };

  const addPromptRow = () => {
    setPromptItems(prev => ([
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: '' }
    ]));
  };

  const removePromptRow = (id: string) => {
    setPromptItems(prev => (prev.length <= 1 ? prev : prev.filter(p => p.id !== id)));
    setPromptResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updatePromptText = (id: string, text: string) => {
    setPromptItems(prev => prev.map(p => (p.id === id ? { ...p, text } : p)));
  };

  const runPrompts = async () => {
    setPromptRunning(true);
    setPromptResults({});

    try {
      for (const item of promptItems) {
        const promptText = item.text?.trim();
        if (!promptText) {
          setPromptResults(prev => ({
            ...prev,
            [item.id]: { error: 'پرامپت خالی است' }
          }));
          continue;
        }

        try {
          const res = await fetch('/api/chatbot', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptText })
          });
          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data?.success) {
            const errMsg = data?.error || data?.details || 'خطا در دریافت پاسخ';
            setPromptResults(prev => ({
              ...prev,
              [item.id]: { error: errMsg }
            }));
            continue;
          }

          setPromptResults(prev => ({
            ...prev,
            [item.id]: { response: data.response }
          }));
        } catch (error) {
          setPromptResults(prev => ({
            ...prev,
            [item.id]: { error: 'خطا در ارتباط با سرور' }
          }));
        }
      }
    } finally {
      setPromptRunning(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/chatbot?dateFilter=${dateFilter}&sortOrder=${sortOrder}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching chatbot data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOldMessages = async (days: number) => {
    if (!confirm(`آیا مطمئنید که می‌خواهید پیام‌های قدیمی‌تر از ${days} روز را حذف کنید؟`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/chatbot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });

      const data = await response.json();
      if (data.success) {
        alert(`${data.deletedCount} پیام حذف شد`);
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      alert('خطا در حذف پیام‌ها');
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.sessionId?.includes(searchQuery)
  );

  const groupedSessions = filteredMessages.reduce((acc, msg) => {
    if (!acc[msg.sessionId]) {
      acc[msg.sessionId] = [];
    }
    acc[msg.sessionId].push(msg);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            مدیریت چت‌بات هوشمند
          </h1>
          <p className="text-gray-300">تحلیل مکالمات و مدیریت سیستم پاسخگویی هوشمند</p>
        </div>

        <div className="mb-8 flex flex-col gap-4 bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">نمایش چت‌بات در فروشگاه</h2>
              <p className="text-sm text-gray-300">
                ویجت چت فقط در صفحات عمومی سایت نمایش داده می‌شود و در پنل مدیریت همیشه مخفی است.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleEnabled}
              disabled={saving}
              className={`px-6 py-3 rounded-xl font-bold transition-all min-w-[140px] ${
                parseEnabledSetting(settings.enabled)
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gray-600 text-gray-200'
              } disabled:opacity-50`}
              aria-pressed={parseEnabledSetting(settings.enabled)}
            >
              {saving
                ? 'در حال ذخیره...'
                : parseEnabledSetting(settings.enabled)
                  ? '✅ فعال'
                  : '⛔ غیرفعال'}
            </button>
          </div>
          {message.text && (
            <div className={`p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-400 text-green-100'
                : 'bg-red-500/20 border border-red-400 text-red-100'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'conversations'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            💬 مکالمات
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'prompts'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ✍️ پرامپت‌ها
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Settings className="w-5 h-5" />
            تنظیمات API
          </button>
        </div>

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">✍️ تست پرامپت‌ها</h2>
              <p className="text-sm text-purple-200 mb-6">
                چند پرامپت وارد کنید؛ برای هرکدام پاسخ چت‌بات نمایش داده می‌شود.
              </p>

              <div className="space-y-4">
                {promptItems.map((item, idx) => {
                  const result = promptResults[item.id];
                  return (
                    <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-bold">پرامپت {idx + 1}</div>
                        <button
                          onClick={() => removePromptRow(item.id)}
                          disabled={promptRunning || promptItems.length <= 1}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>

                      <textarea
                        value={item.text}
                        onChange={(e) => updatePromptText(item.id, e.target.value)}
                        placeholder="پرامپت را اینجا بنویسید..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      />

                      {(result?.response || result?.error) && (
                        <div className={`mt-3 p-3 rounded-xl border ${
                          result.error
                            ? 'bg-red-500/15 border-red-400 text-red-100'
                            : 'bg-green-500/15 border-green-400 text-green-100'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">
                            {result.error ? result.error : result.response}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={addPromptRow}
                  disabled={promptRunning}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  ➕ افزودن پرامپت
                </button>
                <button
                  onClick={runPrompts}
                  disabled={promptRunning}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {promptRunning ? 'در حال اجرا...' : '▶️ اجرای پرامپت‌ها'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="backdrop-blur-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-6 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <MessageSquare className="w-10 h-10 text-purple-400" />
                    <div className="text-3xl font-bold text-white">{stats.totalMessages}</div>
                  </div>
                  <p className="text-gray-300 text-sm">کل پیام‌ها</p>
                </div>

                <div className="backdrop-blur-lg bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-xl p-6 border border-pink-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="w-10 h-10 text-pink-400" />
                    <div className="text-3xl font-bold text-white">{stats.totalConversations}</div>
                  </div>
                  <p className="text-gray-300 text-sm">مکالمات</p>
                </div>

                <div className="backdrop-blur-lg bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-10 h-10 text-green-400" />
                    <div className="text-3xl font-bold text-white">{stats.averageMessagesPerSession.toFixed(1)}</div>
                  </div>
                  <p className="text-gray-300 text-sm">میانگین پیام/مکالمه</p>
                </div>

                <div className="backdrop-blur-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-6 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <Calendar className="w-10 h-10 text-orange-400" />
                    <div className="text-3xl font-bold text-white">{stats.recentActivity}</div>
                  </div>
                  <p className="text-gray-300 text-sm">فعالیت امروز</p>
                </div>
              </div>
            )}

        {/* Top Products */}
        {stats && stats.topProducts.length > 0 && (
          <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              محصولات پرجستجو
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topProducts.slice(0, 6).map((product, index) => (
                <div key={index} className="backdrop-blur-lg bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-200">{product.name}</span>
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {product.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در محتوا یا شناسه جلسه..."
                  className="w-full pr-10 pl-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">بازه زمانی</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(88, 28, 135, 0.1) 100%)'
                }}
              >
                <option value="all" style={{ background: '#5D3D83', color: 'white' }}>همه</option>
                <option value="today" style={{ background: '#5D3D83', color: 'white' }}>امروز</option>
                <option value="week" style={{ background: '#5D3D83', color: 'white' }}>هفته گذشته</option>
                <option value="month" style={{ background: '#5D3D83', color: 'white' }}>ماه گذشته</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">مرتب‌سازی</label>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'desc' ? 'جدیدترین' : 'قدیمی‌ترین'}
              </button>
            </div>
          </div>

          {/* Delete Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => deleteOldMessages(7)}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف پیام‌های +7 روز
            </button>
            <button
              onClick={() => deleteOldMessages(30)}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف پیام‌های +30 روز
            </button>
            <button
              onClick={() => deleteOldMessages(90)}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف پیام‌های +90 روز
            </button>
          </div>
        </div>

        {/* Conversations */}
        <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">مکالمات اخیر</h2>
          
          {Object.keys(groupedSessions).length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">هنوز مکالمه‌ای ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedSessions).map(([sessionId, sessionMessages]) => (
                <div key={sessionId} className="backdrop-blur-lg bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <div 
                    className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 cursor-pointer hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                    onClick={() => setSelectedSession(selectedSession === sessionId ? null : sessionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">جلسه: {sessionId.slice(0, 8)}...</p>
                        <p className="text-gray-400 text-sm">
                          {sessionMessages.length} پیام • 
                          {new Date(sessionMessages[0].timestamp).toLocaleDateString('fa-IR')} 
                          {' '}
                          {new Date(sessionMessages[0].timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-purple-400">
                        {selectedSession === sessionId ? '▼' : '◀'}
                      </div>
                    </div>
                  </div>
                  
                  {selectedSession === sessionId && (
                    <div className="p-4 space-y-3">
                      {sessionMessages.map((msg) => (
                        <div 
                          key={msg._id} 
                          className={`p-3 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-purple-500/20 border border-purple-500/30 mr-8' 
                              : 'bg-pink-500/20 border border-pink-500/30 ml-8'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-xs font-semibold ${
                              msg.role === 'user' ? 'text-purple-300' : 'text-pink-300'
                            }`}>
                              {msg.role === 'user' ? '👤 کاربر' : '🤖 چت‌بات'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm leading-relaxed">{msg.content}</p>
                          
                          {msg.products && msg.products.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-xs text-gray-400 mb-2">محصولات پیشنهادی:</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.products.map((product: any, idx: number) => (
                                  <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                                    {product.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            {/* پیام */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-400 text-green-100' 
                  : 'bg-red-500/20 border border-red-400 text-red-100'
              }`}>
                {message.text}
              </div>
            )}

            {/* پرامپت سیستم */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">🧠 پرامپت سیستم (داینامیک)</h2>
              <p className="text-sm text-purple-200 mb-6">
                این پرامپت در دیتابیس ذخیره می‌شود و برای پاسخ‌های چت‌بات استفاده می‌شود.
              </p>

              <textarea
                value={settings.system_prompt || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="پرامپت سیستم را اینجا وارد کنید..."
                rows={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
              />

              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => handleSave('system_prompt', settings.system_prompt || '')}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {saving ? 'در حال ذخیره...' : '💾 ذخیره پرامپت سیستم'}
                </button>
                {settings.system_prompt && (
                  <button
                    onClick={() => handleDelete('system_prompt')}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    title="حذف"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* انتخاب سرویس‌دهنده */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">🎯 انتخاب سرویس‌دهنده AI</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gemini */}
                <button
                  onClick={() => handleProviderChange('gemini')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.provider === 'gemini'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400 shadow-lg shadow-blue-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">🌟</div>
                  <div className="text-white font-bold">Gemini</div>
                  <div className="text-sm text-purple-200">سریع و قدرتمند</div>
                  <div className="text-xs text-purple-300 mt-2">1-2 ثانیه</div>
                </button>

                {/* OpenAI */}
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    settings.provider === 'openai'
                      ? 'bg-gradient-to-br from-green-500 to-teal-600 border-green-400 shadow-lg shadow-green-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-white font-bold">OpenAI</div>
                  <div className="text-sm text-purple-200">GPT-3.5/4</div>
                  <div className="text-xs text-purple-300 mt-2">2-3 ثانیه</div>
                </button>
              </div>
              
              {/* دکمه ذخیره Provider */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave('provider', settings.provider)}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  {saving ? 'در حال ذخیره...' : '💾 ذخیره سرویس‌دهنده'}
                </button>
              </div>
            </div>

            {/* تنظیمات Gemini */}
            {settings.provider === 'gemini' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">🌟 تنظیمات Gemini</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-200 mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.gemini_api_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, gemini_api_key: e.target.value }))}
                        placeholder="AIza..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-blue-400"
                      />
                      <button
                        onClick={() => handleSave('gemini_api_key', settings.gemini_api_key)}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {saving ? '...' : 'ذخیره'}
                      </button>
                      {settings.gemini_api_key && (
                        <button
                          onClick={() => handleDelete('gemini_api_key')}
                          className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-purple-300 mt-2">
                      دریافت API Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">aistudio.google.com/app/apikey</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* تنظیمات OpenAI */}
            {settings.provider === 'openai' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">🤖 تنظیمات OpenAI</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-200 mb-2">API Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.openai_api_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value }))}
                        placeholder="sk-..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-green-400"
                      />
                      <button
                        onClick={() => handleSave('openai_api_key', settings.openai_api_key)}
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        {saving ? '...' : 'ذخیره'}
                      </button>
                      {settings.openai_api_key && (
                        <button
                          onClick={() => handleDelete('openai_api_key')}
                          className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-purple-300 mt-2">
                      دریافت API Key: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-green-400 hover:underline">platform.openai.com/api-keys</a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
