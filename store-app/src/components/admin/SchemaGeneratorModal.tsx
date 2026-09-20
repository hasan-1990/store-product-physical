'use client';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SchemaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemaType: 'organization' | 'product' | 'article';
}

export default function SchemaGeneratorModal({ isOpen, onClose, schemaType }: SchemaGeneratorModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [generatedSchema, setGeneratedSchema] = useState<string>('');

  if (!isOpen) return null;

  const generateOrganizationSchema = (data: any) => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data.name || "",
      "url": data.url || "",
      "logo": data.logo || "",
      "description": data.description || "",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": data.phone || "",
        "contactType": "customer service",
        "email": data.email || ""
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": data.streetAddress || "",
        "addressLocality": data.city || "",
        "addressCountry": data.country || ""
      },
      "sameAs": data.socialMedia ? data.socialMedia.split(',').map((s: string) => s.trim()) : []
    };
  };

  const generateProductSchema = (data: any) => {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.name || "",
      "description": data.description || "",
      "image": data.image || "",
      "brand": {
        "@type": "Brand",
        "name": data.brand || ""
      },
      "offers": {
        "@type": "Offer",
        "price": data.price || "",
        "priceCurrency": data.currency || "IRR",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": data.seller || ""
        }
      },
      "aggregateRating": data.rating ? {
        "@type": "AggregateRating",
        "ratingValue": data.rating,
        "reviewCount": data.reviewCount || "1"
      } : undefined
    };
  };

  const generateArticleSchema = (data: any) => {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": data.headline || "",
      "description": data.description || "",
      "image": data.image || "",
      "author": {
        "@type": "Person",
        "name": data.author || ""
      },
      "publisher": {
        "@type": "Organization",
        "name": data.publisher || "",
        "logo": {
          "@type": "ImageObject",
          "url": data.publisherLogo || ""
        }
      },
      "datePublished": data.datePublished || new Date().toISOString(),
      "dateModified": data.dateModified || new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": data.url || ""
      }
    };
  };

  const handleGenerate = () => {
    let schema;
    switch (schemaType) {
      case 'organization':
        schema = generateOrganizationSchema(formData);
        break;
      case 'product':
        schema = generateProductSchema(formData);
        break;
      case 'article':
        schema = generateArticleSchema(formData);
        break;
      default:
        return;
    }
    
    setGeneratedSchema(JSON.stringify(schema, null, 2));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSchema);
    alert('Schema کپی شد!');
  };

  const renderForm = () => {
    switch (schemaType) {
      case 'organization':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="نام سازمان"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس وب‌سایت"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس لوگو"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, logo: e.target.value})}
            />
            <textarea
              placeholder="توضیحات"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="tel"
              placeholder="شماره تماس"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <input
              type="email"
              placeholder="ایمیل"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <input
              type="text"
              placeholder="آدرس (خیابان)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, streetAddress: e.target.value})}
            />
            <input
              type="text"
              placeholder="شهر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
            <input
              type="text"
              placeholder="کشور"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, country: e.target.value})}
            />
            <textarea
              placeholder="شبکه‌های اجتماعی (جدا شده با کاما)"
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, socialMedia: e.target.value})}
            />
          </div>
        );

      case 'product':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="نام محصول"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <textarea
              placeholder="توضیحات محصول"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس تصویر محصول"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <input
              type="text"
              placeholder="برند"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, brand: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="قیمت"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
              <select
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                <option value="IRR">تومان (IRR)</option>
                <option value="USD">دلار (USD)</option>
                <option value="EUR">یورو (EUR)</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="فروشنده"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, seller: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                placeholder="امتیاز (1-5)"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, rating: e.target.value})}
              />
              <input
                type="number"
                placeholder="تعداد نظرات"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, reviewCount: e.target.value})}
              />
            </div>
          </div>
        );

      case 'article':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="عنوان مقاله"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, headline: e.target.value})}
            />
            <textarea
              placeholder="توضیحات مقاله"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس تصویر مقاله"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس صفحه مقاله"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
            <input
              type="text"
              placeholder="نام نویسنده"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, author: e.target.value})}
            />
            <input
              type="text"
              placeholder="نام ناشر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, publisher: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس لوگو ناشر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, publisherLogo: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="datetime-local"
                placeholder="تاریخ انتشار"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, datePublished: e.target.value})}
              />
              <input
                type="datetime-local"
                placeholder="تاریخ آخرین ویرایش"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, dateModified: e.target.value})}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (schemaType) {
      case 'organization':
        return 'تولید Schema Organization';
      case 'product':
        return 'تولید Schema Product';
      case 'article':
        return 'تولید Schema Article';
      default:
        return 'تولید Schema';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div>
              <h3 className="text-lg font-medium mb-4">اطلاعات Schema</h3>
              {renderForm()}
              <button
                onClick={handleGenerate}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                تولید Schema
              </button>
            </div>

            {/* Generated Schema */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Schema تولید شده</h3>
                {generatedSchema && (
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    کپی
                  </button>
                )}
              </div>
              <textarea
                value={generatedSchema}
                readOnly
                className="w-full h-96 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm"
                placeholder="Schema اینجا نمایش داده می‌شود..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}