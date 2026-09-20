'use client';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MetaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metaType: 'basic' | 'opengraph' | 'twitter';
}

export default function MetaGeneratorModal({ isOpen, onClose, metaType }: MetaGeneratorModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [generatedMeta, setGeneratedMeta] = useState<string>('');

  if (!isOpen) return null;

  const generateBasicMeta = (data: any) => {
    const meta = [];
    
    if (data.title) {
      meta.push(`<title>${data.title}</title>`);
    }
    
    if (data.description) {
      meta.push(`<meta name="description" content="${data.description}" />`);
    }
    
    if (data.keywords) {
      meta.push(`<meta name="keywords" content="${data.keywords}" />`);
    }
    
    if (data.author) {
      meta.push(`<meta name="author" content="${data.author}" />`);
    }
    
    if (data.robots) {
      meta.push(`<meta name="robots" content="${data.robots}" />`);
    }
    
    if (data.canonical) {
      meta.push(`<link rel="canonical" href="${data.canonical}" />`);
    }
    
    // Language and charset
    meta.push(`<meta charset="UTF-8" />`);
    meta.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`);
    meta.push(`<meta http-equiv="X-UA-Compatible" content="IE=edge" />`);
    
    if (data.language) {
      meta.push(`<meta http-equiv="Content-Language" content="${data.language}" />`);
    }
    
    return meta.join('\n');
  };

  const generateOpenGraphMeta = (data: any) => {
    const meta = [];
    
    if (data.title) {
      meta.push(`<meta property="og:title" content="${data.title}" />`);
    }
    
    if (data.description) {
      meta.push(`<meta property="og:description" content="${data.description}" />`);
    }
    
    if (data.image) {
      meta.push(`<meta property="og:image" content="${data.image}" />`);
    }
    
    if (data.url) {
      meta.push(`<meta property="og:url" content="${data.url}" />`);
    }
    
    if (data.type) {
      meta.push(`<meta property="og:type" content="${data.type}" />`);
    }
    
    if (data.siteName) {
      meta.push(`<meta property="og:site_name" content="${data.siteName}" />`);
    }
    
    if (data.locale) {
      meta.push(`<meta property="og:locale" content="${data.locale}" />`);
    }
    
    // Additional image properties
    if (data.imageWidth) {
      meta.push(`<meta property="og:image:width" content="${data.imageWidth}" />`);
    }
    
    if (data.imageHeight) {
      meta.push(`<meta property="og:image:height" content="${data.imageHeight}" />`);
    }
    
    if (data.imageAlt) {
      meta.push(`<meta property="og:image:alt" content="${data.imageAlt}" />`);
    }
    
    return meta.join('\n');
  };

  const generateTwitterMeta = (data: any) => {
    const meta = [];
    
    meta.push(`<meta name="twitter:card" content="${data.cardType || 'summary_large_image'}" />`);
    
    if (data.title) {
      meta.push(`<meta name="twitter:title" content="${data.title}" />`);
    }
    
    if (data.description) {
      meta.push(`<meta name="twitter:description" content="${data.description}" />`);
    }
    
    if (data.image) {
      meta.push(`<meta name="twitter:image" content="${data.image}" />`);
    }
    
    if (data.site) {
      meta.push(`<meta name="twitter:site" content="${data.site}" />`);
    }
    
    if (data.creator) {
      meta.push(`<meta name="twitter:creator" content="${data.creator}" />`);
    }
    
    if (data.imageAlt) {
      meta.push(`<meta name="twitter:image:alt" content="${data.imageAlt}" />`);
    }
    
    return meta.join('\n');
  };

  const handleGenerate = () => {
    let meta;
    switch (metaType) {
      case 'basic':
        meta = generateBasicMeta(formData);
        break;
      case 'opengraph':
        meta = generateOpenGraphMeta(formData);
        break;
      case 'twitter':
        meta = generateTwitterMeta(formData);
        break;
      default:
        return;
    }
    
    setGeneratedMeta(meta);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMeta);
    alert('Meta tags کپی شدند!');
  };

  const renderForm = () => {
    switch (metaType) {
      case 'basic':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="عنوان صفحه"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <textarea
              placeholder="توضیحات صفحه"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="text"
              placeholder="کلمات کلیدی (جدا شده با کاما)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, keywords: e.target.value})}
            />
            <input
              type="text"
              placeholder="نام نویسنده"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, author: e.target.value})}
            />
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, robots: e.target.value})}
            >
              <option value="">انتخاب دستورات Robots</option>
              <option value="index, follow">index, follow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
              <option value="index, nofollow">index, nofollow</option>
              <option value="noindex, follow">noindex, follow</option>
            </select>
            <input
              type="url"
              placeholder="URL کانونیکال"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, canonical: e.target.value})}
            />
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, language: e.target.value})}
            >
              <option value="">انتخاب زبان</option>
              <option value="fa">فارسی (fa)</option>
              <option value="en">انگلیسی (en)</option>
              <option value="ar">عربی (ar)</option>
            </select>
          </div>
        );

      case 'opengraph':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="عنوان Open Graph"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <textarea
              placeholder="توضیحات Open Graph"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس تصویر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <input
              type="url"
              placeholder="URL صفحه"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, url: e.target.value})}
            />
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="">نوع محتوا</option>
              <option value="website">وب‌سایت</option>
              <option value="article">مقاله</option>
              <option value="product">محصول</option>
              <option value="profile">پروفایل</option>
            </select>
            <input
              type="text"
              placeholder="نام سایت"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, siteName: e.target.value})}
            />
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, locale: e.target.value})}
            >
              <option value="">زبان محلی</option>
              <option value="fa_IR">فارسی ایران</option>
              <option value="en_US">انگلیسی آمریکا</option>
              <option value="ar_SA">عربی عربستان</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="عرض تصویر"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, imageWidth: e.target.value})}
              />
              <input
                type="number"
                placeholder="ارتفاع تصویر"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                onChange={(e) => setFormData({...formData, imageHeight: e.target.value})}
              />
            </div>
            <input
              type="text"
              placeholder="متن جایگزین تصویر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, imageAlt: e.target.value})}
            />
          </div>
        );

      case 'twitter':
        return (
          <div className="space-y-4">
            <select
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, cardType: e.target.value})}
            >
              <option value="summary_large_image">Summary Large Image</option>
              <option value="summary">Summary</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
            <input
              type="text"
              placeholder="عنوان Twitter"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <textarea
              placeholder="توضیحات Twitter"
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="url"
              placeholder="آدرس تصویر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <input
              type="text"
              placeholder="نام کاربری سایت (مثل @mysite)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, site: e.target.value})}
            />
            <input
              type="text"
              placeholder="نام کاربری نویسنده (مثل @author)"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, creator: e.target.value})}
            />
            <input
              type="text"
              placeholder="متن جایگزین تصویر"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              onChange={(e) => setFormData({...formData, imageAlt: e.target.value})}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (metaType) {
      case 'basic':
        return 'تولید Basic Meta Tags';
      case 'opengraph':
        return 'تولید Open Graph Tags';
      case 'twitter':
        return 'تولید Twitter Cards';
      default:
        return 'تولید Meta Tags';
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
              <h3 className="text-lg font-medium mb-4">اطلاعات Meta Tags</h3>
              {renderForm()}
              <button
                onClick={handleGenerate}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                تولید Meta Tags
              </button>
            </div>

            {/* Generated Meta */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Meta Tags تولید شده</h3>
                {generatedMeta && (
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    کپی
                  </button>
                )}
              </div>
              <textarea
                value={generatedMeta}
                readOnly
                className="w-full h-96 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-mono text-sm"
                placeholder="Meta Tags اینجا نمایش داده می‌شوند..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}