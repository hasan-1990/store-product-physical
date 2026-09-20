'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './faq-styles.css';

interface FAQ {
  _id?: string;
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
}

interface FAQSectionProps {
  initialFAQs?: FAQ[];
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  className?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ 
  initialFAQs = [],
  title = "سوالات متداول",
  subtitle = "پاسخ سوالات رایج شما در کمترین زمان",
  showSearch = true,
  className = ""
}) => {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs);
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!initialFAQs?.length);

  // Load FAQs from API if not provided
  useEffect(() => {
    if (!initialFAQs?.length) {
      loadFAQs();
    }
  }, [initialFAQs]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/faq');
      const data = await response.json();
      
      if (data.success) {
        // Filter only active FAQs and sort by order
        const activeFAQs = data.faqs
          .filter((faq: FAQ) => faq.isActive !== false)
          .sort((a: FAQ, b: FAQ) => (a.order || 0) - (b.order || 0));
        
        setFaqs(activeFAQs);
      }
    } catch (error) {
      console.error('خطا در دریافت سوالات متداول:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search FAQs
  const filteredFAQs = useMemo(() => {
    return faqs.filter(faq => {
      const searchableText = `${faq.question} ${faq.answer} ${faq.category || ''}`.toLowerCase();
      return searchableText.includes(searchTerm.toLowerCase());
    });
  }, [faqs, searchTerm]);

  // Group FAQs by category
  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    
    filteredFAQs.forEach(faq => {
      const category = faq.category || 'عمومی';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(faq);
    });
    
    return groups;
  }, [filteredFAQs]);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className={`faq-section ${className}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری سوالات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`faq-section ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Search Bar */}
        {showSearch && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در سوالات متداول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-4 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 shadow-lg"
              />
            </div>
          </div>
        )}

        {/* FAQ Content */}
        {Object.keys(groupedFAQs).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">❓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {searchTerm ? 'نتیجه‌ای یافت نشد' : 'سوالی موجود نیست'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm 
                ? 'لطفاً کلمات کلیدی دیگری را امتحان کنید'
                : 'در حال حاضر سوالی در این بخش موجود نیست'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                مشاهده همه سوالات
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-2 h-6 bg-purple-500 rounded-full ml-3"></div>
                    {category}
                    <span className="text-sm text-gray-500 mr-2">({categoryFAQs.length} سوال)</span>
                  </h2>
                </div>

                {/* FAQ Items */}
                <div className="divide-y divide-gray-100">
                  {categoryFAQs.map((faq) => {
                    const faqId = faq._id || faq.id || Math.random().toString();
                    const isOpen = openItems.has(faqId);
                    
                    return (
                      <div key={faqId} className="faq-item">
                        <button
                          onClick={() => toggleItem(faqId)}
                          className="w-full px-6 py-6 text-right hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1 ml-4">
                              {highlightText(faq.question, searchTerm)}
                            </h3>
                            <ChevronDownIcon
                              className={`w-5 h-5 text-purple-500 transition-transform duration-300 flex-shrink-0 ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        
                        <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
                          <div className="px-6 pb-6">
                            <div className="prose prose-gray max-w-none">
                              <p className="text-gray-700 leading-relaxed">
                                {highlightText(faq.answer, searchTerm)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">پاسخ سوال شما را پیدا نکردید؟</h3>
          <p className="text-purple-100 mb-6 text-lg">
            تیم پشتیبانی ما آماده کمک به شماست
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              تماس با پشتیبانی
            </a>
            <a
              href="tel:02112345678"
              className="px-8 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors duration-200"
            >
              تماس تلفنی: ۰۲۱-۱۲۳۴۵۶۷۸
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;