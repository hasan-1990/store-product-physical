'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (faq: Partial<FAQItem>) => void;
  faq?: FAQItem | null;
  mode: 'create' | 'edit' | 'view';
  defaultCategory?: string;
  nextOrder?: number;
}

const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, onSave, faq, mode, defaultCategory, nextOrder }) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true
  });

  const [savedQuestions, setSavedQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (faq && mode !== 'create') {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || '',
        order: faq.order || 0,
        isActive: faq.isActive
      });
    } else {
      setFormData({
        question: '',
        answer: '',
        category: defaultCategory || '',
        order: nextOrder || 0,
        isActive: true
      });
      setSavedQuestions([]);
    }
  }, [faq, mode, defaultCategory, nextOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'view') {
      onSave(formData);
    }
  };

  const handleSaveAndAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create' && formData.question.trim() && formData.answer.trim()) {
      // Save current question
      try {
        const response = await fetch('/api/admin/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
          // Add to saved questions list
          setSavedQuestions(prev => [...prev, { ...formData, _id: data.faq._id }]);
          
          // Reset form for new question but keep category
          setFormData({
            question: '',
            answer: '',
            category: formData.category, // Keep the same category
            order: formData.order + 1, // Increment order
            isActive: true
          });
          
          alert('سوال با موفقیت اضافه شد! می‌توانید سوال بعدی را اضافه کنید.');
        } else {
          alert('خطا: ' + data.error);
        }
      } catch (error) {
        console.error('خطا در ذخیره:', error);
        alert('خطا در ذخیره اطلاعات');
      }
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-purple-500/30 flex-shrink-0">
          <h3 className="text-2xl font-bold text-white">
            {mode === 'create' ? 'افزودن سوال جدید' : 
             mode === 'edit' ? 'ویرایش سوال' : 'مشاهده سوال'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'create' && savedQuestions.length > 0 && (
            <div className="p-6 bg-green-500/10 border-b border-green-500/30">
              <h4 className="text-lg font-semibold text-green-300 mb-3">
                سوالات ذخیره شده ({savedQuestions.length} سوال)
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedQuestions.map((q, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 p-2 rounded text-sm text-white">
                    <strong>{q.question}</strong>
                    <span className="text-purple-300 mr-2">({q.category})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                دسته‌بندی
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="مثال: خرید و سفارش"
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                سوال *
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="سوال خود را وارد کنید..."
                required
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                پاسخ *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="پاسخ کامل را وارد کنید..."
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  وضعیت
                </label>
                <div className="flex items-center space-x-4 space-x-reverse text-white">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                      className="ml-2 text-purple-600 focus:ring-purple-500"
                      disabled={isReadOnly}
                    />
                    فعال
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={!formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                      className="ml-2 text-purple-600 focus:ring-purple-500"
                      disabled={isReadOnly}
                    />
                    غیرفعال
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-between space-x-4 space-x-reverse p-6 border-t border-purple-500/30 flex-shrink-0 bg-gray-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-purple-200 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            {isReadOnly ? 'بستن' : 'بستن و تمام'}
          </button>
          
          <div className="flex space-x-3 space-x-reverse">
            {!isReadOnly && mode === 'create' && (
              <button
                type="button"
                onClick={handleSaveAndAddNew}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                disabled={!formData.question.trim() || !formData.answer.trim()}
              >
                ذخیره و افزودن بعدی
              </button>
            )}
            {!isReadOnly && (
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                {mode === 'create' ? 'ذخیره و تمام' : 'ذخیره تغییرات'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    faq: FAQItem | null;
    defaultCategory?: string;
    nextOrder?: number;
  }>({
    isOpen: false,
    mode: 'create',
    faq: null
  });

  // Load FAQs
  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faq');
      const data = await response.json();
      
      if (data.success) {
        setFaqs(data.faqs);
      } else {
        console.error('خطا در دریافت FAQ:', data.error);
      }
    } catch (error) {
      console.error('خطا در دریافت FAQ:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  // Handle Create/Edit
  const handleSave = async (faqData: Partial<FAQItem>) => {
    try {
      const url = '/api/admin/faq';
      const method = modalState.mode === 'create' ? 'POST' : 'PUT';
      const body = modalState.mode === 'edit' ? { ...faqData, id: modalState.faq?._id } : faqData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        await loadFAQs();
        setModalState({ isOpen: false, mode: 'create', faq: null });
        alert(modalState.mode === 'create' ? 'سوال با موفقیت اضافه شد' : 'سوال با موفقیت ویرایش شد');
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('خطا در ذخیره:', error);
      alert('خطا در ذخیره اطلاعات');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این سوال اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/admin/faq?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadFAQs();
        alert('سوال با موفقیت حذف شد');
      } else {
        alert('خطا: ' + data.error);
      }
    } catch (error) {
      console.error('خطا در حذف:', error);
      alert('خطا در حذف سوال');
    }
  };

  // Group FAQs by category
  const groupedFAQs = faqs.reduce((groups: Record<string, FAQItem[]>, faq) => {
    const category = faq.category || 'بدون دسته‌بندی';
    if (!groups[category]) groups[category] = [];
    groups[category].push(faq);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت سوالات متداول</h2>
          <p className="text-purple-200 mt-2">سوالات و پاسخ‌های رایج مشتریان را مدیریت کنید</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create', faq: null })}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          افزودن سوال جدید
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold">کل سوالات</h3>
          <p className="text-3xl font-bold mt-2">{faqs.length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold">سوالات فعال</h3>
          <p className="text-3xl font-bold mt-2">{faqs.filter(f => f.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold">دسته‌بندی‌ها</h3>
          <p className="text-3xl font-bold mt-2">{Object.keys(groupedFAQs).length}</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
          <div key={category} className="border border-purple-500/30 rounded-xl p-6 bg-gray-800/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <div className="w-2 h-6 bg-purple-500 rounded-full ml-3"></div>
                {category}
                <span className="text-sm text-purple-300 mr-2">({categoryFAQs.length} سوال)</span>
              </h3>
              <button
                onClick={() => {
                  const maxOrder = categoryFAQs.length > 0 ? Math.max(...categoryFAQs.map(f => f.order)) : 0;
                  setModalState({
                    isOpen: true,
                    mode: 'create',
                    faq: null,
                    defaultCategory: category,
                    nextOrder: maxOrder + 1
                  });
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg transition-colors duration-200"
                title="افزودن سوال جدید به این دسته"
              >
                <PlusIcon className="h-4 w-4 ml-2" />
                افزودن سوال
              </button>
            </div>
            
            <div className="space-y-4">
              {categoryFAQs.map((faq) => (
                <div key={faq._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">{faq.question}</h4>
                      <p className="text-purple-200 text-sm line-clamp-2">{faq.answer}</p>
                      <div className="flex items-center mt-2 space-x-4 space-x-reverse text-xs text-purple-300">
                        <span>ترتیب: {faq.order}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          faq.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {faq.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse mr-4">
                      <button
                        onClick={() => setModalState({ isOpen: true, mode: 'view', faq })}
                        className="p-2 text-purple-200 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                        title="مشاهده"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setModalState({ isOpen: true, mode: 'edit', faq })}
                        className="p-2 text-purple-200 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors duration-200"
                        title="ویرایش"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq._id)}
                        className="p-2 text-purple-200 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                        title="حذف"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {faqs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
            <PlusIcon className="w-12 h-12 text-purple-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            هنوز سوالی اضافه نشده
          </h3>
          <p className="text-purple-200 mb-6">
            اولین سوال متداول خود را اضافه کنید
          </p>
          <button
            onClick={() => setModalState({ isOpen: true, mode: 'create', faq: null })}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors duration-200"
          >
            افزودن سوال جدید
          </button>
        </div>
      )}

      {/* Modal */}
      <FAQModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', faq: null })}
        onSave={handleSave}
        faq={modalState.faq}
        mode={modalState.mode}
        defaultCategory={modalState.defaultCategory}
        nextOrder={modalState.nextOrder}
      />
    </div>
  );
};

export default FAQManagement;