"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { useAdvancedSchema } from '@/hooks/useAdvancedSchema';

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url?: string;
}

export default function AdvancedSchemaManager() {
  const {
    loading,
    error,
    generatedSchema,
    jsonLD,
    availableSchemas,
    getAvailableSchemas,
    generateWebSiteSchema,
    generateOrganizationSchema,
    generateLocalBusinessSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    generateEventSchema,
    generateReviewSchema,
    copyJsonLD,
    clearData
  } = useAdvancedSchema();

  const [copied, setCopied] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [activeTab, setActiveTab] = useState('generator');
  const [savedSchemas, setSavedSchemas] = useState<any[]>([]);
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);
  const [schemaName, setSchemaName] = useState('');
  const [schemaPage, setSchemaPage] = useState('/');
  
  // Form states for different schema types
  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: '', answer: '' }]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: '', url: '' }]);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    organizer: '',
    price: '',
    currency: 'IRR'
  });
  const [reviewData, setReviewData] = useState({
    reviewText: '',
    rating: 5,
    authorName: '',
    itemName: '',
    itemUrl: '',
    datePublished: ''
  });
  const [localBusinessData, setLocalBusinessData] = useState({
    businessType: 'Store',
    latitude: '',
    longitude: '',
    openingHours: '',
    priceRange: '$$'
  });

  useEffect(() => {
    getAvailableSchemas();
    loadSavedSchemas();
  }, [getAvailableSchemas]);

  const loadSavedSchemas = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fakeAdminToken = typeof window !== 'undefined' ? localStorage.getItem('fakeAdminToken') : null;

      const headers: HeadersInit = {};
      if (token || fakeAdminToken) {
        headers.Authorization = `Bearer ${token || fakeAdminToken}`;
      }

      const response = await fetch('/api/admin/schemas', {
        credentials: 'include',
        cache: 'no-store',
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setSavedSchemas(data.schemas || []);
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized to load schemas:', data.message);
      }
    } catch (error) {
      console.error('خطا در بارگیری schema های ذخیره شده:', error);
    }
  };

  const saveSchema = async () => {
    if (!jsonLD || !schemaName || !schemaPage) {
      alert('لطفاً نام و صفحه schema را وارد کنید');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fakeAdminToken = typeof window !== 'undefined' ? localStorage.getItem('fakeAdminToken') : null;

      const method = editingSchemaId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/schemas', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token || fakeAdminToken ? { Authorization: `Bearer ${token || fakeAdminToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          id: editingSchemaId,
          name: schemaName,
          page: schemaPage,
          type: selectedSchema,
          jsonLD,
          data: selectedSchema === 'faq' ? faqs : 
                selectedSchema === 'breadcrumb' ? breadcrumbs :
                selectedSchema === 'event' ? eventData :
                selectedSchema === 'review' ? reviewData :
                selectedSchema === 'localbusiness' ? localBusinessData : {}
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(editingSchemaId ? 'Schema با موفقیت به‌روزرسانی شد' : 'Schema با موفقیت ذخیره شد');
        loadSavedSchemas();
        setEditingSchemaId(null);
        setSchemaName('');
        setSchemaPage('/');
        clearData();
        setActiveTab('saved');
      }
    } catch (error) {
      console.error('خطا در ذخیره schema:', error);
      alert('خطا در ذخیره schema');
    }
  };

  const deleteSchema = async (id: string) => {
    if (!confirm('آیا از حذف این schema اطمینان دارید؟')) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fakeAdminToken = typeof window !== 'undefined' ? localStorage.getItem('fakeAdminToken') : null;

      const response = await fetch(`/api/admin/schemas?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token || fakeAdminToken ? { Authorization: `Bearer ${token || fakeAdminToken}` } : undefined,
      });

      const data = await response.json();
      if (data.success) {
        alert('Schema با موفقیت حذف شد');
        loadSavedSchemas();
      }
    } catch (error) {
      console.error('خطا در حذف schema:', error);
      alert('خطا در حذف schema');
    }
  };

  const editSchema = (schema: any) => {
    setEditingSchemaId(schema._id);
    setSchemaName(schema.name);
    setSchemaPage(schema.page);
    setSelectedSchema(schema.type);
    
    // بارگذاری داده‌های schema
    if (schema.data) {
      if (schema.type === 'faq' && Array.isArray(schema.data)) {
        setFaqs(schema.data);
      } else if (schema.type === 'breadcrumb' && Array.isArray(schema.data)) {
        setBreadcrumbs(schema.data);
      } else if (schema.type === 'event') {
        setEventData(schema.data);
      } else if (schema.type === 'review') {
        setReviewData(schema.data);
      } else if (schema.type === 'localbusiness') {
        setLocalBusinessData(schema.data);
      }
    }
    
    setActiveTab('generator');
  };

  const cancelEdit = () => {
    setEditingSchemaId(null);
    setSchemaName('');
    setSchemaPage('/');
    clearData();
  };

  const handleCopy = () => {
    copyJsonLD();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const addBreadcrumb = () => {
    setBreadcrumbs([...breadcrumbs, { name: '', url: '' }]);
  };

  const removeBreadcrumb = (index: number) => {
    setBreadcrumbs(breadcrumbs.filter((_, i) => i !== index));
  };

  const updateBreadcrumb = (index: number, field: 'name' | 'url', value: string) => {
    const newBreadcrumbs = [...breadcrumbs];
    newBreadcrumbs[index][field] = value;
    setBreadcrumbs(newBreadcrumbs);
  };

  const handleGenerate = async () => {
    clearData();
    
    switch (selectedSchema) {
      case 'website':
        await generateWebSiteSchema();
        break;
      case 'organization':
        await generateOrganizationSchema();
        break;
      case 'localbusiness':
        const coordinates = localBusinessData.latitude && localBusinessData.longitude ? {
          latitude: parseFloat(localBusinessData.latitude),
          longitude: parseFloat(localBusinessData.longitude)
        } : undefined;
        const openingHours = localBusinessData.openingHours ? 
          localBusinessData.openingHours.split('\n').filter(h => h.trim()) : undefined;
        
        await generateLocalBusinessSchema(
          localBusinessData.businessType,
          coordinates,
          openingHours,
          localBusinessData.priceRange
        );
        break;
      case 'faq':
        const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
        if (validFaqs.length === 0) {
          alert('لطفاً حداقل یک سوال و جواب وارد کنید');
          return;
        }
        await generateFAQSchema(validFaqs);
        break;
      case 'breadcrumb':
        const validBreadcrumbs = breadcrumbs.filter(b => b.name.trim());
        if (validBreadcrumbs.length === 0) {
          alert('لطفاً حداقل یک مرحله breadcrumb وارد کنید');
          return;
        }
        await generateBreadcrumbSchema(validBreadcrumbs);
        break;
      case 'event':
        if (!eventData.name || !eventData.description || !eventData.startDate) {
          alert('لطفاً فیلدهای الزامی را پر کنید');
          return;
        }
        const offers = eventData.price ? [{ price: eventData.price, currency: eventData.currency }] : undefined;
        await generateEventSchema(
          eventData.name,
          eventData.description,
          eventData.startDate,
          eventData.endDate || undefined,
          eventData.location || undefined,
          eventData.organizer || undefined,
          offers
        );
        break;
      case 'review':
        if (!reviewData.reviewText || !reviewData.authorName || !reviewData.itemName) {
          alert('لطفاً فیلدهای الزامی را پر کنید');
          return;
        }
        await generateReviewSchema(
          reviewData.reviewText,
          reviewData.rating,
          reviewData.authorName,
          reviewData.itemName,
          reviewData.itemUrl || undefined,
          reviewData.datePublished || undefined
        );
        break;
    }
  };

  const renderSchemaForm = () => {
    switch (selectedSchema) {
      case 'faq':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">سوالات متداول</label>
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`question-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      سوال {index + 1}
                    </label>
                    <input
                      id={`question-${index}`}
                      type="text"
                      value={faq.question}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateFAQ(index, 'question', e.target.value)}
                      placeholder="سوال خود را وارد کنید"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`answer-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      پاسخ {index + 1}
                    </label>
                    <textarea
                      id={`answer-${index}`}
                      value={faq.answer}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateFAQ(index, 'answer', e.target.value)}
                      placeholder="پاسخ سوال را وارد کنید"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFAQ(index)}
                    disabled={faqs.length === 1}
                    className="px-4 py-2 text-sm bg-red-700 text-red-200 rounded-md hover:bg-red-600 disabled:opacity-50"
                  >
                    حذف سوال
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addFAQ}
              className="px-4 py-2 bg-purple-700 text-purple-200 rounded-md hover:bg-purple-600"
            >
              افزودن سوال جدید
            </button>
          </div>
        );

      case 'breadcrumb':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">مسیر صفحه (Breadcrumb)</label>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`breadcrumb-name-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      نام مرحله {index + 1}
                    </label>
                    <input
                      id={`breadcrumb-name-${index}`}
                      type="text"
                      value={breadcrumb.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateBreadcrumb(index, 'name', e.target.value)}
                      placeholder="نام مرحله"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`breadcrumb-url-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                      آدرس (اختیاری)
                    </label>
                    <input
                      id={`breadcrumb-url-${index}`}
                      type="text"
                      value={breadcrumb.url || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => updateBreadcrumb(index, 'url', e.target.value)}
                      placeholder="/products"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBreadcrumb(index)}
                  disabled={breadcrumbs.length === 1}
                  className="mt-3 px-4 py-2 text-sm bg-red-700 text-red-200 rounded-md hover:bg-red-600 disabled:opacity-50"
                >
                  حذف مرحله
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBreadcrumb}
              className="px-4 py-2 bg-purple-700 text-purple-200 rounded-md hover:bg-purple-600"
            >
              افزودن مرحله جدید
            </button>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-name" className="block text-sm font-medium text-gray-300 mb-1">
                  نام رویداد *
                </label>
                <input
                  id="event-name"
                  type="text"
                  value={eventData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, name: e.target.value})}
                  placeholder="تخفیف ویژه"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="event-organizer" className="block text-sm font-medium text-gray-300 mb-1">
                  برگزارکننده
                </label>
                <input
                  id="event-organizer"
                  type="text"
                  value={eventData.organizer}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, organizer: e.target.value})}
                  placeholder="نام فروشگاه"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-gray-300 mb-1">
                توضیحات *
              </label>
              <textarea
                id="event-description"
                value={eventData.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEventData({...eventData, description: e.target.value})}
                placeholder="توضیحات رویداد"
                rows={3}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-start" className="block text-sm font-medium text-gray-300 mb-1">
                  تاریخ شروع *
                </label>
                <input
                  id="event-start"
                  type="datetime-local"
                  value={eventData.startDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, startDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="event-end" className="block text-sm font-medium text-gray-300 mb-1">
                  تاریخ پایان
                </label>
                <input
                  id="event-end"
                  type="datetime-local"
                  value={eventData.endDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, endDate: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="event-location" className="block text-sm font-medium text-gray-300 mb-1">
                مکان
              </label>
              <input
                id="event-location"
                type="text"
                value={eventData.location}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, location: e.target.value})}
                placeholder="آنلاین یا آدرس فیزیکی"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-price" className="block text-sm font-medium text-gray-300 mb-1">
                  قیمت (تومان)
                </label>
                <input
                  id="event-price"
                  type="text"
                  value={eventData.price}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventData({...eventData, price: e.target.value})}
                  placeholder="100000"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="event-currency" className="block text-sm font-medium text-gray-300 mb-1">
                  واحد پول
                </label>
                <select
                  id="event-currency"
                  value={eventData.currency}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setEventData({...eventData, currency: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="IRR">تومان (IRR)</option>
                  <option value="USD">دلار (USD)</option>
                  <option value="EUR">یورو (EUR)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="review-author" className="block text-sm font-medium text-gray-300 mb-1">
                  نام نویسنده *
                </label>
                <input
                  id="review-author"
                  type="text"
                  value={reviewData.authorName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setReviewData({...reviewData, authorName: e.target.value})}
                  placeholder="احمد رضایی"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="review-item" className="block text-sm font-medium text-gray-300 mb-1">
                  نام محصول/خدمت *
                </label>
                <input
                  id="review-item"
                  type="text"
                  value={reviewData.itemName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setReviewData({...reviewData, itemName: e.target.value})}
                  placeholder="محصول نمونه"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="review-text" className="block text-sm font-medium text-gray-300 mb-1">
                متن نظر *
              </label>
              <textarea
                id="review-text"
                value={reviewData.reviewText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReviewData({...reviewData, reviewText: e.target.value})}
                placeholder="نظر خود را بنویسید"
                rows={4}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="review-rating" className="block text-sm font-medium text-gray-300 mb-1">
                  امتیاز (1-5) *
                </label>
                <select
                  id="review-rating"
                  value={reviewData.rating.toString()}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setReviewData({...reviewData, rating: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1">1 ستاره</option>
                  <option value="2">2 ستاره</option>
                  <option value="3">3 ستاره</option>
                  <option value="4">4 ستاره</option>
                  <option value="5">5 ستاره</option>
                </select>
              </div>
              <div>
                <label htmlFor="review-url" className="block text-sm font-medium text-gray-300 mb-1">
                  آدرس محصول
                </label>
                <input
                  id="review-url"
                  type="text"
                  value={reviewData.itemUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setReviewData({...reviewData, itemUrl: e.target.value})}
                  placeholder="/products/sample"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="review-date" className="block text-sm font-medium text-gray-300 mb-1">
                تاریخ انتشار
              </label>
              <input
                id="review-date"
                type="datetime-local"
                value={reviewData.datePublished}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setReviewData({...reviewData, datePublished: e.target.value})}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        );

      case 'localbusiness':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="business-type" className="block text-sm font-medium text-gray-300 mb-1">
                  نوع کسب و کار
                </label>
                <select
                  id="business-type"
                  value={localBusinessData.businessType}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocalBusinessData({...localBusinessData, businessType: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Store">فروشگاه</option>
                  <option value="Restaurant">رستوران</option>
                  <option value="LocalBusiness">کسب و کار محلی</option>
                  <option value="ShoppingCenter">مرکز خرید</option>
                </select>
              </div>
              <div>
                <label htmlFor="price-range" className="block text-sm font-medium text-gray-300 mb-1">
                  رنج قیمت
                </label>
                <select
                  id="price-range"
                  value={localBusinessData.priceRange}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocalBusinessData({...localBusinessData, priceRange: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="$">ارزان ($)</option>
                  <option value="$$">متوسط ($$)</option>
                  <option value="$$$">گران ($$$)</option>
                  <option value="$$$$">خیلی گران ($$$$)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-300 mb-1">
                  عرض جغرافیایی
                </label>
                <input
                  id="latitude"
                  type="text"
                  value={localBusinessData.latitude}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalBusinessData({...localBusinessData, latitude: e.target.value})}
                  placeholder="35.6892"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-300 mb-1">
                  طول جغرافیایی
                </label>
                <input
                  id="longitude"
                  type="text"
                  value={localBusinessData.longitude}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalBusinessData({...localBusinessData, longitude: e.target.value})}
                  placeholder="51.3890"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="opening-hours" className="block text-sm font-medium text-gray-300 mb-1">
                ساعات کاری (هر خط یک روز)
              </label>
              <textarea
                id="opening-hours"
                value={localBusinessData.openingHours}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocalBusinessData({...localBusinessData, openingHours: e.target.value})}
                placeholder="Mo-Fr 08:00-17:00&#10;Sa 09:00-14:00"
                rows={4}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-blue-900 border border-blue-700 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <div className="text-sm text-blue-200">
                  ℹ️ این نوع Schema به صورت خودکار از تنظیمات عمومی سایت تولید می‌شود.
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">مدیریت Schema های پیشرفته</h1>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
          JSON-LD Schema Generator
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('generator')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generator'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            تولید Schema
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            Schema های ذخیره شده
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
            }`}
          >
            راهنمای Schema ها
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Schema Selection */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-white mb-4">انتخاب نوع Schema</h3>
              <select
                value={selectedSchema}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSchema(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">نوع Schema را انتخاب کنید</option>
                {availableSchemas.map((schema) => (
                  <option key={schema.type} value={schema.type}>
                    {schema.name} - {schema.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schema Form */}
          {selectedSchema && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-white mb-4">تنظیمات Schema</h3>
                {renderSchemaForm()}
                
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedSchema}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        در حال تولید...
                      </>
                    ) : (
                      'تولید Schema'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border border-red-700 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <div className="text-sm text-red-200">
                    ⚠️ {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Schema */}
          {jsonLD && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">JSON-LD تولید شده</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!jsonLD}
                      className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      {copied ? '✓ کپی شد' : '📋 کپی کردن'}
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border border-gray-600 text-gray-300">
                  {jsonLD}
                </pre>
                
                {/* فرم ذخیره Schema */}
                <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        نام Schema {editingSchemaId && '(در حال ویرایش)'}
                      </label>
                      <input
                        type="text"
                        value={schemaName}
                        onChange={(e) => setSchemaName(e.target.value)}
                        placeholder="مثلاً: FAQ صفحه اصلی"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        صفحه مربوطه
                      </label>
                      <input
                        type="text"
                        value={schemaPage}
                        onChange={(e) => setSchemaPage(e.target.value)}
                        placeholder="مثلاً: / یا /about"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveSchema}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      💾 {editingSchemaId ? 'به‌روزرسانی Schema' : 'ذخیره Schema'}
                    </button>
                    {editingSchemaId && (
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        انصراف
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 bg-blue-900 border border-blue-700 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <div className="text-sm text-blue-200">
                        ℹ️ این کد JSON-LD را در تگ script صفحه مورد نظر قرار دهید.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Schemas Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Schema های ذخیره شده</h3>
            {savedSchemas.length === 0 ? (
              <p className="text-gray-400 text-center py-8">هنوز هیچ schema ای ذخیره نشده است</p>
            ) : (
              <div className="space-y-3">
                {savedSchemas.map((schema) => (
                  <div key={schema._id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{schema.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">صفحه: {schema.page}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900 text-purple-200 mt-2">
                          {schema.type}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editSchema(schema)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          ✏️ ویرایش
                        </button>
                        <button
                          onClick={() => deleteSchema(schema._id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                    <details className="mt-3">
                      <summary className="text-sm text-gray-300 cursor-pointer hover:text-white">
                        مشاهده JSON-LD
                      </summary>
                      <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-x-auto border border-gray-600 text-gray-300">
                        {schema.jsonLD}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schema List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {availableSchemas.map((schema) => (
            <div key={schema.type} className="bg-gray-800 border border-gray-700 rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">{schema.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{schema.description}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                    {schema.type}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {schema.required.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-300">فیلدهای الزامی: </span>
                      <span className="text-sm text-red-400">
                        {schema.required.join(', ')}
                      </span>
                    </div>
                  )}
                  {schema.optional.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-300">فیلدهای اختیاری: </span>
                      <span className="text-sm text-gray-400">
                        {schema.optional.join(', ')}
                      </span>
                    </div>
                  )}
                  {schema.example && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                        نمونه داده
                      </summary>
                      <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-x-auto border border-gray-600 text-gray-300">
                        {JSON.stringify(schema.example, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}