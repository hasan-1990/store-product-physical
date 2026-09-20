'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SharedImageGallery } from '@/components';

interface SliderFormData {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  backgroundType: 'image' | 'video' | 'gradient';
  videoUrl: string;
  gradientColors: string[];
  buttonText: string;
  buttonLink: string;
  buttonStyle: 'default' | 'outline' | 'ghost' | 'gradient';
  buttonColor: string;
  order: number;
  active: boolean;
  theme: 'light' | 'dark';
  animation: {
    entrance: 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'zoom' | 'zoomOut' | 'bounce' | 'flip' | 'flipX' | 'flipY' | 'rotate' | 'rotateX' | 'rotateY' | 'shake' | 'pulse' | 'swing' | 'rubberBand' | 'wobble' | 'jello';
    exit: 'fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'zoom' | 'zoomOut' | 'bounce' | 'flip' | 'flipX' | 'flipY' | 'rotate' | 'rotateX' | 'rotateY' | 'shake' | 'pulse' | 'swing' | 'rubberBand' | 'wobble' | 'jello';
    duration: number;
    delay: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'back';
    loop: boolean;
    direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  };
  textPosition: 'left' | 'center' | 'right' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  textColor: string;
  textShadow: boolean;
  overlay: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  parallax: boolean;
  autoHeight: boolean;
}

const NewSliderPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [formData, setFormData] = useState<SliderFormData>({
    title: 'فروش ویژه محصولات',
    subtitle: 'تا ۵۰٪ تخفیف',
    description: 'بهترین محصولات با کیفیت عالی و قیمت مناسب',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    backgroundType: 'image',
    videoUrl: '',
    gradientColors: ['#667eea', '#764ba2'],
    buttonText: 'مشاهده محصولات',
    buttonLink: '/products',
    buttonStyle: 'default',
    buttonColor: '#6366f1',
    order: 1,
    active: true,
    theme: 'dark',
    animation: {
      entrance: 'slideLeft',
      exit: 'slideRight',
      duration: 1.2,
      delay: 0.3,
      easing: 'ease-out',
      loop: false,
      direction: 'normal'
    },
    textPosition: 'center',
    textColor: '#ffffff',
    textShadow: true,
    overlay: {
      enabled: true,
      color: '#000000',
      opacity: 0.4
    },
    parallax: false,
    autoHeight: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/slider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('اسلاید جدید با موفقیت ایجاد شد');
        router.push('/admin/content');
      } else {
        alert('خطا در ایجاد اسلاید: ' + (data.message || 'خطای نامشخص'));
      }
    } catch (error) {
      console.error('Error creating slider:', error);
      alert('خطا در ایجاد اسلاید');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SliderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const previewAnimation = (type: 'entrance' | 'exit') => {
    const previewElement = document.getElementById('animation-preview');
    if (previewElement) {
      previewElement.style.animation = 'none';
      setTimeout(() => {
        const animationType = type === 'entrance' ? formData.animation.entrance : formData.animation.exit;
        const animationName = getAnimationCSS(animationType);
        previewElement.style.animation = `${animationName} ${formData.animation.duration}s ${formData.animation.easing} ${formData.animation.delay}s ${formData.animation.loop ? 'infinite' : '1'} ${formData.animation.direction}`;
      }, 10);
    }
  };

  // Animation CSS generator
  const getAnimationCSS = (animationType: string) => {
    const animations: Record<string, string> = {
      fade: 'fadeIn',
      slideLeft: 'slideInLeft',
      slideRight: 'slideInRight', 
      slideUp: 'slideInUp',
      slideDown: 'slideInDown',
      zoom: 'zoomIn',
      zoomOut: 'zoomOut',
      bounce: 'bounceIn',
      flip: 'flip',
      flipX: 'flipInX',
      flipY: 'flipInY',
      rotate: 'rotateIn',
      rotateX: 'rotateInX',
      rotateY: 'rotateInY',
      shake: 'shake',
      pulse: 'pulse',
      swing: 'swing',
      rubberBand: 'rubberBand',
      wobble: 'wobble',
      jello: 'jello'
    };
    return animations[animationType] || 'fadeIn';
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInDown {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes zoomOut {
          from { transform: scale(2); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flip {
          from { transform: perspective(400px) rotateY(-360deg); }
          to { transform: perspective(400px) rotateY(0deg); }
        }
        @keyframes flipInX {
          from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
          to { transform: perspective(400px) rotateX(0deg); opacity: 1; }
        }
        @keyframes flipInY {
          from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
          to { transform: perspective(400px) rotateY(0deg); opacity: 1; }
        }
        @keyframes rotateIn {
          from { transform: rotate(-200deg); opacity: 0; }
          to { transform: rotate(0); opacity: 1; }
        }
        @keyframes rotateInX {
          from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
          to { transform: perspective(400px) rotateX(0deg); opacity: 1; }
        }
        @keyframes rotateInY {
          from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
          to { transform: perspective(400px) rotateY(0deg); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes swing {
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes rubberBand {
          0% { transform: scale(1); }
          30% { transform: scaleX(1.25) scaleY(0.75); }
          40% { transform: scaleX(0.75) scaleY(1.25); }
          60% { transform: scaleX(1.15) scaleY(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes wobble {
          0% { transform: translateX(0%); }
          15% { transform: translateX(-25%) rotate(-5deg); }
          30% { transform: translateX(20%) rotate(3deg); }
          45% { transform: translateX(-15%) rotate(-3deg); }
          60% { transform: translateX(10%) rotate(2deg); }
          75% { transform: translateX(-5%) rotate(-1deg); }
          100% { transform: translateX(0%); }
        }
        @keyframes jello {
          0%, 11.1%, 100% { transform: translateX(0); }
          22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
          33.3% { transform: skewX(6.25deg) skewY(6.25deg); }
          44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); }
          55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); }
          66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
          77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); }
          88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); }
        }
      `}</style>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">ایجاد اسلاید جدید</h1>
          <p className="text-gray-300 mt-1">اسلاید جدید برای صفحه اصلی ایجاد کنید</p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Link
            href="/admin/content"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            انصراف
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📝 اطلاعات پایه</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  عنوان اصلی *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="عنوان اصلی اسلاید"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  زیرعنوان
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="زیرعنوان اسلاید"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  توضیحات
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="توضیحات اسلاید"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Background Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🎨 تنظیمات پس‌زمینه</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  نوع پس‌زمینه
                </label>
                <select
                  value={formData.backgroundType}
                  onChange={(e) => handleInputChange('backgroundType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="image">تصویر</option>
                  <option value="video">ویدیو</option>
                  <option value="gradient">گرادیانت</option>
                </select>
              </div>

              {formData.backgroundType === 'image' && (
                <div className="space-y-4">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    تصویر پس‌زمینه *
                  </label>
                  
                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-600">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/products/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setShowImageGallery(true)}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                        >
                          تغییر تصویر
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Selection Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowImageGallery(true)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white rounded-lg transition-all duration-300 font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formData.imageUrl ? 'تغییر از گالری' : 'انتخاب از گالری'}
                    </button>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                        placeholder="یا آدرس تصویر را وارد کنید..."
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {!formData.imageUrl && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                      <div className="text-gray-400 text-4xl mb-2">🖼️</div>
                      <p className="text-gray-400 mb-4">تصویر پس‌زمینه انتخاب کنید</p>
                      <button
                        type="button"
                        onClick={() => setShowImageGallery(true)}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                      >
                        باز کردن گالری
                      </button>
                    </div>
                  )}
                </div>
              )}

              {formData.backgroundType === 'video' && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    آدرس ویدیو *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              )}

              {formData.backgroundType === 'gradient' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      رنگ اول گرادیانت
                    </label>
                    <input
                      type="color"
                      value={formData.gradientColors[0]}
                      onChange={(e) => {
                        const newColors = [...formData.gradientColors];
                        newColors[0] = e.target.value;
                        handleInputChange('gradientColors', newColors);
                      }}
                      className="w-full h-12 bg-gray-800/50 border border-gray-600 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      رنگ دوم گرادیانت
                    </label>
                    <input
                      type="color"
                      value={formData.gradientColors[1]}
                      onChange={(e) => {
                        const newColors = [...formData.gradientColors];
                        newColors[1] = e.target.value;
                        handleInputChange('gradientColors', newColors);
                      }}
                      className="w-full h-12 bg-gray-800/50 border border-gray-600 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Overlay Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    id="overlayEnabled"
                    checked={formData.overlay.enabled}
                    onChange={(e) => handleInputChange('overlay', { ...formData.overlay, enabled: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="overlayEnabled" className="text-gray-300 font-medium">
                    فعال‌سازی لایه روی تصویر
                  </label>
                </div>

                {formData.overlay.enabled && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        رنگ لایه
                      </label>
                      <input
                        type="color"
                        value={formData.overlay.color}
                        onChange={(e) => handleInputChange('overlay', { ...formData.overlay, color: e.target.value })}
                        className="w-full h-10 bg-gray-800/50 border border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        شفافیت لایه: {Math.round(formData.overlay.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.overlay.opacity}
                        onChange={(e) => handleInputChange('overlay', { ...formData.overlay, opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Text & Button Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">✏️ تنظیمات متن و دکمه</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  موقعیت متن
                </label>
                <select
                  value={formData.textPosition}
                  onChange={(e) => handleInputChange('textPosition', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="center">وسط</option>
                  <option value="left">چپ</option>
                  <option value="right">راست</option>
                  <option value="top-left">بالا چپ</option>
                  <option value="top-center">بالا وسط</option>
                  <option value="top-right">بالا راست</option>
                  <option value="bottom-left">پایین چپ</option>
                  <option value="bottom-center">پایین وسط</option>
                  <option value="bottom-right">پایین راست</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  رنگ متن
                </label>
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => handleInputChange('textColor', e.target.value)}
                  className="w-full h-12 bg-gray-800/50 border border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  متن دکمه *
                </label>
                <input
                  type="text"
                  required
                  value={formData.buttonText}
                  onChange={(e) => handleInputChange('buttonText', e.target.value)}
                  placeholder="مشاهده محصولات"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  لینک دکمه *
                </label>
                <input
                  type="text"
                  required
                  value={formData.buttonLink}
                  onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                  placeholder="/products"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  استایل دکمه
                </label>
                <select
                  value={formData.buttonStyle}
                  onChange={(e) => handleInputChange('buttonStyle', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="default">پیش‌فرض</option>
                  <option value="outline">حاشیه‌دار</option>
                  <option value="ghost">شفاف</option>
                  <option value="gradient">گرادیانت</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  رنگ دکمه
                </label>
                <input
                  type="color"
                  value={formData.buttonColor}
                  onChange={(e) => handleInputChange('buttonColor', e.target.value)}
                  className="w-full h-12 bg-gray-800/50 border border-gray-600 rounded-lg"
                />
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="textShadow"
                  checked={formData.textShadow}
                  onChange={(e) => handleInputChange('textShadow', e.target.checked)}
                  className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="textShadow" className="text-gray-300 font-medium">
                  سایه متن
                </label>
              </div>
            </div>
          </div>

          {/* Animation Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🎭 تنظیمات انیمیشن پیشرفته</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  انیمیشن ورود
                </label>
                <select
                  value={formData.animation.entrance}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, entrance: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="fade">محو شدن</option>
                  <option value="slideLeft">کشیدن از چپ</option>
                  <option value="slideRight">کشیدن از راست</option>
                  <option value="slideUp">کشیدن از بالا</option>
                  <option value="slideDown">کشیدن از پایین</option>
                  <option value="zoom">زوم داخل</option>
                  <option value="zoomOut">زوم خارج</option>
                  <option value="bounce">پرش</option>
                  <option value="flip">برگردان</option>
                  <option value="flipX">برگردان افقی</option>
                  <option value="flipY">برگردان عمودی</option>
                  <option value="rotate">چرخش</option>
                  <option value="rotateX">چرخش افقی</option>
                  <option value="rotateY">چرخش عمودی</option>
                  <option value="shake">تکان</option>
                  <option value="pulse">ضربان</option>
                  <option value="swing">تاب</option>
                  <option value="rubberBand">کشش</option>
                  <option value="wobble">لرزش</option>
                  <option value="jello">ژله‌ای</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  انیمیشن خروج
                </label>
                <select
                  value={formData.animation.exit}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, exit: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="fade">محو شدن</option>
                  <option value="slideLeft">کشیدن به چپ</option>
                  <option value="slideRight">کشیدن به راست</option>
                  <option value="slideUp">کشیدن به بالا</option>
                  <option value="slideDown">کشیدن به پایین</option>
                  <option value="zoom">زوم داخل</option>
                  <option value="zoomOut">زوم خارج</option>
                  <option value="bounce">پرش</option>
                  <option value="flip">برگردان</option>
                  <option value="flipX">برگردان افقی</option>
                  <option value="flipY">برگردان عمودی</option>
                  <option value="rotate">چرخش</option>
                  <option value="rotateX">چرخش افقی</option>
                  <option value="rotateY">چرخش عمودی</option>
                  <option value="shake">تکان</option>
                  <option value="pulse">ضربان</option>
                  <option value="swing">تاب</option>
                  <option value="rubberBand">کشش</option>
                  <option value="wobble">لرزش</option>
                  <option value="jello">ژله‌ای</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  نوع حرکت
                </label>
                <select
                  value={formData.animation.easing}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, easing: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="linear">خطی</option>
                  <option value="ease">نرم</option>
                  <option value="ease-in">شروع نرم</option>
                  <option value="ease-out">پایان نرم</option>
                  <option value="ease-in-out">شروع و پایان نرم</option>
                  <option value="bounce">پرشی</option>
                  <option value="elastic">کشسان</option>
                  <option value="back">برگشتی</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  مدت زمان: {formData.animation.duration}s
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={formData.animation.duration}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, duration: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  تاخیر: {formData.animation.delay}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.animation.delay}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, delay: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  جهت انیمیشن
                </label>
                <select
                  value={formData.animation.direction}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, direction: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="normal">عادی</option>
                  <option value="reverse">معکوس</option>
                  <option value="alternate">متناوب</option>
                  <option value="alternate-reverse">متناوب معکوس</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="animationLoop"
                  checked={formData.animation.loop}
                  onChange={(e) => handleInputChange('animation', { ...formData.animation, loop: e.target.checked })}
                  className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="animationLoop" className="text-gray-300 font-medium">
                  تکرار انیمیشن
                </label>
              </div>

              {/* Animation Preview Button */}
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => previewAnimation('entrance')}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  🎬 پیش‌نمایش ورود
                </button>
                <button
                  type="button"
                  onClick={() => previewAnimation('exit')}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  🚪 پیش‌نمایش خروج
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const presets = [
                      { entrance: 'bounce' as const, exit: 'zoomOut' as const, duration: 1.5, easing: 'bounce' as const },
                      { entrance: 'slideLeft' as const, exit: 'slideRight' as const, duration: 1, easing: 'ease-out' as const },
                      { entrance: 'rotate' as const, exit: 'flip' as const, duration: 2, easing: 'elastic' as const },
                      { entrance: 'shake' as const, exit: 'wobble' as const, duration: 1.2, easing: 'ease-in-out' as const },
                    ];
                    const preset = presets[Math.floor(Math.random() * presets.length)];
                    setFormData({
                      ...formData,
                      animation: { ...formData.animation, ...preset }
                    });
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  � انیمیشن تصادفی
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">⚙️ تنظیمات پیشرفته</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  تم رنگی
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="dark">تیره</option>
                  <option value="light">روشن</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="parallax"
                  checked={formData.parallax}
                  onChange={(e) => handleInputChange('parallax', e.target.checked)}
                  className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="parallax" className="text-gray-300 font-medium">
                  افکت پارالکس
                </label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="autoHeight"
                  checked={formData.autoHeight}
                  onChange={(e) => handleInputChange('autoHeight', e.target.checked)}
                  className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="autoHeight" className="text-gray-300 font-medium">
                  ارتفاع خودکار
                </label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-5 h-5 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="active" className="text-gray-300 font-medium">
                  فعال بودن اسلاید
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview with Animation */}
          {(formData.imageUrl || formData.backgroundType !== 'image') && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">👁️ پیش‌نمایش زنده با انیمیشن</h3>
              <div className="relative overflow-hidden rounded-xl h-80 bg-gray-800">
                {/* Background */}
                <div id="animation-preview" className="w-full h-full relative">
                  {formData.backgroundType === 'image' && formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Background"
                      className={`w-full h-full object-cover ${formData.parallax ? 'transform scale-110' : ''}`}
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/placeholder.svg';
                      }}
                    />
                  )}
                  {formData.backgroundType === 'gradient' && (
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${formData.gradientColors[0]}, ${formData.gradientColors[1]})`
                      }}
                    />
                  )}
                  {formData.backgroundType === 'video' && formData.videoUrl && (
                    <video
                      src={formData.videoUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                    />
                  )}

                  {/* Overlay */}
                  {formData.overlay.enabled && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: formData.overlay.color,
                        opacity: formData.overlay.opacity
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className={`absolute inset-0 flex items-center justify-center text-center p-8 ${
                    formData.textPosition.includes('top') ? 'items-start pt-16' :
                    formData.textPosition.includes('bottom') ? 'items-end pb-16' : 'items-center'
                  } ${
                    formData.textPosition.includes('left') ? 'text-left justify-start pl-16' :
                    formData.textPosition.includes('right') ? 'text-right justify-end pr-16' : 'text-center justify-center'
                  }`}>
                    <div className="space-y-4 max-w-2xl">
                      {formData.title && (
                        <h2
                          className="text-3xl font-bold animate-pulse"
                          style={{
                            color: formData.textColor,
                            textShadow: formData.textShadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
                            animationDuration: `${formData.animation.duration}s`,
                            animationDelay: `${formData.animation.delay}s`
                          }}
                        >
                          {formData.title}
                        </h2>
                      )}
                      {formData.subtitle && (
                        <p
                          className="text-xl opacity-90"
                          style={{
                            color: formData.textColor,
                            textShadow: formData.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                            animationDelay: `${formData.animation.delay + 0.2}s`
                          }}
                        >
                          {formData.subtitle}
                        </p>
                      )}
                      {formData.description && (
                        <p
                          className="text-lg opacity-80"
                          style={{
                            color: formData.textColor,
                            textShadow: formData.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                            animationDelay: `${formData.animation.delay + 0.4}s`
                          }}
                        >
                          {formData.description}
                        </p>
                      )}
                      {formData.buttonText && (
                        <button
                          className={`px-8 py-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                            formData.buttonStyle === 'outline' ? 'border-2 bg-transparent hover:bg-white/10' :
                            formData.buttonStyle === 'ghost' ? 'bg-transparent hover:bg-white/10' :
                            formData.buttonStyle === 'gradient' ? 'bg-gradient-to-r from-purple-500 to-blue-500' :
                            'bg-opacity-90 hover:bg-opacity-100'
                          }`}
                          style={{
                            backgroundColor: formData.buttonStyle === 'default' ? formData.buttonColor : 'transparent',
                            borderColor: formData.buttonStyle === 'outline' ? formData.buttonColor : 'transparent',
                            color: formData.buttonStyle === 'outline' ? formData.buttonColor : '#ffffff',
                            animationDelay: `${formData.animation.delay + 0.6}s`
                          }}
                        >
                          {formData.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Animation Controls */}
                <div className="absolute top-4 right-4 flex space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById('animation-preview');
                      if (element) {
                        element.style.animation = 'none';
                        setTimeout(() => {
                          const animationName = getAnimationCSS(formData.animation.entrance);
                          element.style.animation = `${animationName} ${formData.animation.duration}s ${formData.animation.easing} ${formData.animation.delay}s ${formData.animation.loop ? 'infinite' : '1'} ${formData.animation.direction}`;
                        }, 10);
                      }
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-400"
                  >
                    ▶️ ورود
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById('animation-preview');
                      if (element) {
                        element.style.animation = 'none';
                        setTimeout(() => {
                          const animationName = getAnimationCSS(formData.animation.exit);
                          element.style.animation = `${animationName} ${formData.animation.duration}s ${formData.animation.easing} ${formData.animation.delay}s ${formData.animation.loop ? 'infinite' : '1'} ${formData.animation.direction}`;
                        }, 10);
                      }
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-400"
                  >
                    ⏹️ خروج
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById('animation-preview');
                      if (element) {
                        element.style.animation = 'none';
                      }
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-400"
                  >
                    ⏸️ توقف
                  </button>
                </div>

                {/* Animation Info */}
                <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
                  <div>ورود: {formData.animation.entrance} | خروج: {formData.animation.exit}</div>
                  <div>مدت: {formData.animation.duration}s | تاخیر: {formData.animation.delay}s</div>
                  <div>حرکت: {formData.animation.easing} | تکرار: {formData.animation.loop ? 'بله' : 'خیر'}</div>
                </div>
              </div>

              {/* Animation CSS Examples */}
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-lg font-bold text-white mb-2">💻 CSS تولید شده:</h4>
                <code className="text-green-400 text-sm">
                  animation: {getAnimationCSS(formData.animation.entrance)} {formData.animation.duration}s {formData.animation.easing} {formData.animation.delay}s {formData.animation.loop ? 'infinite' : '1'} {formData.animation.direction};
                </code>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-500 text-white rounded-lg transition-all duration-300 shadow-lg font-medium"
            >
              {loading ? '⏳ در حال ایجاد...' : '✅ ایجاد اسلاید پیشرفته'}
            </button>
          </div>
        </form>
      </div>

      {/* Image Gallery Modal */}
      <SharedImageGallery
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={(imageUrl) => {
          handleInputChange('imageUrl', imageUrl);
          setShowImageGallery(false);
        }}
        title="انتخاب تصویر برای اسلایدر"
        source="admin"
      />
    </div>
    </>
  );
};

export default NewSliderPage;
