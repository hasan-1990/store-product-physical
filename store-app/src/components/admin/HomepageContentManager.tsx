'use client';

import React, { useState, useEffect } from 'react';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { FiSave, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';

const HomepageContentManager = () => {
  const { content, loading, updateContent } = useHomepageContent();
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('intro');

  useEffect(() => {
    if (content) {
      setFormData(content);
    }
  }, [content]);

  const handleSave = async () => {
    if (!formData) return;
    
    setSaving(true);
    try {
      const result = await updateContent(formData);
      if (result.success) {
        alert('محتوا با موفقیت ذخیره شد');
      } else {
        alert('خطا در ذخیره: ' + result.error);
      }
    } catch (error) {
      alert('خطا در ذخیره محتوا');
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    const newServices = [...formData.servicesSection.services, {
      title: '',
      description: '',
      icon: '🎯'
    }];
    setFormData({
      ...formData,
      servicesSection: {
        ...formData.servicesSection,
        services: newServices
      }
    });
  };

  const removeService = (index: number) => {
    const newServices = formData.servicesSection.services.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      servicesSection: {
        ...formData.servicesSection,
        services: newServices
      }
    });
  };

  const addFAQ = () => {
    const newFAQs = [...formData.faqSection.faqs, {
      question: '',
      answer: ''
    }];
    setFormData({
      ...formData,
      faqSection: {
        ...formData.faqSection,
        faqs: newFAQs
      }
    });
  };

  const removeFAQ = (index: number) => {
    const newFAQs = formData.faqSection.faqs.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      faqSection: {
        ...formData.faqSection,
        faqs: newFAQs
      }
    });
  };

  if (loading || !formData) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">مدیریت محتوای صفحه اصلی</h2>
          <p className="text-gray-400">ویرایش محتوای بخش‌های مختلف صفحه اصلی</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <FiSave />
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>

      {/* تب‌ها */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { id: 'intro', label: 'معرفی فروشگاه' },
          { id: 'services', label: 'خدمات' },
          { id: 'faq', label: 'سوالات متداول' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوای تب معرفی */}
      {activeTab === 'intro' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">بخش معرفی فروشگاه</h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.introSection.active}
                  onChange={(e) => setFormData({
                    ...formData,
                    introSection: {
                      ...formData.introSection,
                      active: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-white font-medium">نمایش این بخش</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                عنوان بخش
              </label>
              <input
                type="text"
                value={formData.introSection.title}
                onChange={(e) => setFormData({
                  ...formData,
                  introSection: {
                    ...formData.introSection,
                    title: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                محتوای معرفی
              </label>
              <textarea
                value={formData.introSection.content}
                onChange={(e) => setFormData({
                  ...formData,
                  introSection: {
                    ...formData.introSection,
                    content: e.target.value
                  }
                })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="محتوای معرفی فروشگاه را اینجا بنویسید..."
              />
              <p className="text-xs text-gray-400 mt-1">
                تعداد کلمات: {formData.introSection.content.split(' ').filter((word: string) => word.length > 0).length}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.introSection.showButtons}
                  onChange={(e) => setFormData({
                    ...formData,
                    introSection: {
                      ...formData.introSection,
                      showButtons: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-white">نمایش دکمه‌های عمل</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* محتوای تب خدمات */}
      {activeTab === 'services' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">بخش خدمات</h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.servicesSection.active}
                  onChange={(e) => setFormData({
                    ...formData,
                    servicesSection: {
                      ...formData.servicesSection,
                      active: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-white font-medium">نمایش این بخش</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان اصلی
                </label>
                <input
                  type="text"
                  value={formData.servicesSection.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    servicesSection: {
                      ...formData.servicesSection,
                      title: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  زیرعنوان
                </label>
                <input
                  type="text"
                  value={formData.servicesSection.subtitle}
                  onChange={(e) => setFormData({
                    ...formData,
                    servicesSection: {
                      ...formData.servicesSection,
                      subtitle: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.servicesSection.showStats}
                  onChange={(e) => setFormData({
                    ...formData,
                    servicesSection: {
                      ...formData.servicesSection,
                      showStats: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-white">نمایش آمار فروشگاه</span>
              </label>
            </div>

            {/* لیست خدمات */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">خدمات</h4>
                <button
                  onClick={addService}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiPlus size={16} />
                  افزودن خدمت
                </button>
              </div>

              <div className="space-y-4">
                {formData.servicesSection.services.map((service: any, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-white font-medium">خدمت {index + 1}</span>
                      <button
                        onClick={() => removeService(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">آیکون</label>
                        <input
                          type="text"
                          value={service.icon}
                          onChange={(e) => {
                            const newServices = [...formData.servicesSection.services];
                            newServices[index].icon = e.target.value;
                            setFormData({
                              ...formData,
                              servicesSection: {
                                ...formData.servicesSection,
                                services: newServices
                              }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-600 rounded bg-gray-600 text-white text-sm"
                          placeholder="🎯"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">عنوان</label>
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => {
                            const newServices = [...formData.servicesSection.services];
                            newServices[index].title = e.target.value;
                            setFormData({
                              ...formData,
                              servicesSection: {
                                ...formData.servicesSection,
                                services: newServices
                              }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-600 rounded bg-gray-600 text-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">توضیحات</label>
                        <textarea
                          value={service.description}
                          onChange={(e) => {
                            const newServices = [...formData.servicesSection.services];
                            newServices[index].description = e.target.value;
                            setFormData({
                              ...formData,
                              servicesSection: {
                                ...formData.servicesSection,
                                services: newServices
                              }
                            });
                          }}
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-600 rounded bg-gray-600 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* محتوای تب سوالات متداول */}
      {activeTab === 'faq' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">بخش سوالات متداول</h3>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.faqSection.active}
                  onChange={(e) => setFormData({
                    ...formData,
                    faqSection: {
                      ...formData.faqSection,
                      active: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-white font-medium">نمایش این بخش</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  عنوان اصلی
                </label>
                <input
                  type="text"
                  value={formData.faqSection.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    faqSection: {
                      ...formData.faqSection,
                      title: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  زیرعنوان
                </label>
                <input
                  type="text"
                  value={formData.faqSection.subtitle}
                  onChange={(e) => setFormData({
                    ...formData,
                    faqSection: {
                      ...formData.faqSection,
                      subtitle: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* لیست سوالات */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">سوالات و پاسخ‌ها</h4>
                <button
                  onClick={addFAQ}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiPlus size={16} />
                  افزودن سوال
                </button>
              </div>

              <div className="space-y-4">
                {formData.faqSection.faqs.map((faq: any, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-white font-medium">سوال {index + 1}</span>
                      <button
                        onClick={() => removeFAQ(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">سوال</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const newFAQs = [...formData.faqSection.faqs];
                            newFAQs[index].question = e.target.value;
                            setFormData({
                              ...formData,
                              faqSection: {
                                ...formData.faqSection,
                                faqs: newFAQs
                              }
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-600 rounded bg-gray-600 text-white text-sm"
                          placeholder="سوال خود را اینجا بنویسید"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">پاسخ</label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const newFAQs = [...formData.faqSection.faqs];
                            newFAQs[index].answer = e.target.value;
                            setFormData({
                              ...formData,
                              faqSection: {
                                ...formData.faqSection,
                                faqs: newFAQs
                              }
                            });
                          }}
                          rows={3}
                          className="w-full px-2 py-1 border border-gray-600 rounded bg-gray-600 text-white text-sm"
                          placeholder="پاسخ کامل را اینجا بنویسید"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageContentManager;
