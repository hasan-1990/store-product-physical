'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { SharedImageGallery } from '@/components';

// Animation CSS Styles
const animationStyles = `
  .animate-preview {
    animation-fill-mode: both;
  }

  /* Fade Animations */
  .animate-preview.fade { animation: fadeIn var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* Slide Animations */
  .animate-preview.slideLeft { animation: slideInLeft var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .animate-preview.slideRight { animation: slideInRight var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .animate-preview.slideUp { animation: slideInUp var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .animate-preview.slideDown { animation: slideInDown var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes slideInDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* Zoom Animations */
  .animate-preview.zoom { animation: zoomIn var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes zoomIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .animate-preview.zoomOut { animation: zoomOut var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes zoomOut { from { transform: scale(1.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  /* Bounce Animation */
  .animate-preview.bounce { animation: bounceIn var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes bounceIn {
    0%, 20%, 40%, 60%, 80% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  /* Flip Animations */
  .animate-preview.flip { animation: flipIn var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes flipIn { from { transform: rotateY(-90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }

  .animate-preview.flipX { animation: flipInX var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes flipInX { from { transform: rotateX(-90deg); opacity: 0; } to { transform: rotateX(0); opacity: 1; } }

  .animate-preview.flipY { animation: flipInY var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes flipInY { from { transform: rotateY(-90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }

  /* Rotate Animations */
  .animate-preview.rotate { animation: rotateIn var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes rotateIn { from { transform: rotate(-360deg); opacity: 0; } to { transform: rotate(0); opacity: 1; } }

  .animate-preview.rotateX { animation: rotateInX var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes rotateInX { from { transform: rotateX(-90deg); opacity: 0; } to { transform: rotateX(0); opacity: 1; } }

  .animate-preview.rotateY { animation: rotateInY var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes rotateInY { from { transform: rotateY(-90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }

  /* Special Effects */
  .animate-preview.shake { animation: shake var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .animate-preview.pulse { animation: pulse var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }

  .animate-preview.swing { animation: swing var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes swing {
    0%, 100% { transform: rotate(0deg); transform-origin: center top; }
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-10deg); }
    60% { transform: rotate(5deg); }
    80% { transform: rotate(-5deg); }
  }

  .animate-preview.rubberBand { animation: rubberBand var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes rubberBand {
    0% { transform: scale(1); }
    30% { transform: scaleX(1.25) scaleY(0.75); }
    40% { transform: scaleX(0.75) scaleY(1.25); }
    50% { transform: scaleX(1.15) scaleY(0.85); }
    65% { transform: scaleX(0.95) scaleY(1.05); }
    75% { transform: scaleX(1.05) scaleY(0.95); }
    100% { transform: scale(1); }
  }

  .animate-preview.wobble { animation: wobble var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes wobble {
    0% { transform: translateX(0%); }
    15% { transform: translateX(-25%) rotate(-5deg); }
    30% { transform: translateX(20%) rotate(3deg); }
    45% { transform: translateX(-15%) rotate(-3deg); }
    60% { transform: translateX(10%) rotate(2deg); }
    75% { transform: translateX(-5%) rotate(-1deg); }
    100% { transform: translateX(0%); }
  }

  .animate-preview.jello { animation: jello var(--duration, 1s) var(--easing, ease) var(--delay, 0s); }
  @keyframes jello {
    0%, 11.1%, 100% { transform: none; }
    22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); }
    33.3% { transform: skewX(6.25deg) skewY(6.25deg); }
    44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); }
    55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); }
    66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); }
    77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); }
    88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'slider-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = animationStyles;
    document.head.appendChild(style);
  }
}

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

const EditSliderPage = () => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [formData, setFormData] = useState<SliderFormData>({
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    backgroundType: 'image',
    videoUrl: '',
    gradientColors: ['#667eea', '#764ba2'],
    buttonText: '',
    buttonLink: '',
    buttonStyle: 'default',
    buttonColor: '#6366f1',
    order: 1,
    active: true,
    animation: {
      entrance: 'fade',
      exit: 'slideRight',
      duration: 1,
      delay: 0,
      easing: 'ease',
      loop: false,
      direction: 'normal'
    },
    textPosition: 'center',
    textColor: '#ffffff',
    textShadow: true,
    overlay: {
      enabled: false,
      color: '#000000',
      opacity: 0.5
    },
    parallax: false,
    autoHeight: false
  });

  useEffect(() => {
    loadSlider();
  }, []);

  // Update preview animation when animation settings change
  useEffect(() => {
    const previewEl = document.querySelector('.animation-preview-content');
    if (previewEl) {
      // Remove all animation classes
      previewEl.classList.remove('animate-preview', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello');
      
      // Add new animation with slight delay
      setTimeout(() => {
        previewEl.classList.add('animate-preview', formData.animation.entrance);
      }, 100);
    }
  }, [formData.animation]);

  const loadSlider = async () => {
    try {
      const response = await fetch(`/api/admin/slider/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          title: data.data.title || '',
          subtitle: data.data.subtitle || '',
          description: data.data.description || '',
          imageUrl: data.data.image || data.data.imageUrl || '',
          backgroundType: data.data.backgroundType || 'image',
          videoUrl: data.data.videoUrl || '',
          gradientColors: data.data.gradientColors || ['#667eea', '#764ba2'],
          buttonText: data.data.buttonText || '',
          buttonLink: data.data.buttonLink || '',
          buttonStyle: data.data.buttonStyle || 'default',
          buttonColor: data.data.buttonColor || '#6366f1',
          order: data.data.order || 1,
          active: data.data.active ?? true,
          animation: data.data.animation || { entrance: 'fade', exit: 'slideRight', duration: 1, delay: 0, easing: 'ease', loop: false, direction: 'normal' },
          textPosition: data.data.textPosition || 'center',
          textColor: data.data.textColor || '#ffffff',
          textShadow: data.data.textShadow ?? true,
          overlay: data.data.overlay || { enabled: false, color: '#000000', opacity: 0.5 },
          parallax: data.data.parallax || false,
          autoHeight: data.data.autoHeight || false
        });
      } else {
        alert('خطا در بارگذاری اطلاعات اسلاید');
        router.push('/admin/content');
      }
    } catch (error) {
      console.error('Error loading slider:', error);
      alert('خطا در بارگذاری اطلاعات اسلاید');
      router.push('/admin/content');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/slider/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('اسلاید با موفقیت به‌روزرسانی شد');
        router.push('/admin/content');
      } else {
        alert('خطا در به‌روزرسانی اسلاید: ' + (data.message || 'خطای نامشخص'));
      }
    } catch (error) {
      console.error('Error updating slider:', error);
      alert('خطا در به‌روزرسانی اسلاید');
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">ویرایش اسلاید</h1>
          <p className="text-gray-300 mt-1">ویرایش اطلاعات اسلاید</p>
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

          {/* Animation Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🎬 تنظیمات انیمیشن</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <option value="slideLeft">لغزش از چپ</option>
                  <option value="slideRight">لغزش از راست</option>
                  <option value="slideUp">لغزش از پایین</option>
                  <option value="slideDown">لغزش از بالا</option>
                  <option value="zoom">بزرگ‌نمایی</option>
                  <option value="zoomOut">کوچک‌نمایی</option>
                  <option value="bounce">پرش</option>
                  <option value="flip">چرخش</option>
                  <option value="flipX">چرخش افقی</option>
                  <option value="flipY">چرخش عمودی</option>
                  <option value="rotate">دوران</option>
                  <option value="rotateX">دوران افقی</option>
                  <option value="rotateY">دوران عمودی</option>
                  <option value="shake">لرزش</option>
                  <option value="pulse">نبض</option>
                  <option value="swing">تاب</option>
                  <option value="rubberBand">کشسان</option>
                  <option value="wobble">تلق‌تلق</option>
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
                  <option value="slideLeft">لغزش به چپ</option>
                  <option value="slideRight">لغزش به راست</option>
                  <option value="slideUp">لغزش به بالا</option>
                  <option value="slideDown">لغزش به پایین</option>
                  <option value="zoom">بزرگ‌نمایی</option>
                  <option value="zoomOut">کوچک‌نمایی</option>
                  <option value="bounce">پرش</option>
                  <option value="flip">چرخش</option>
                  <option value="flipX">چرخش افقی</option>
                  <option value="flipY">چرخش عمودی</option>
                  <option value="rotate">دوران</option>
                  <option value="rotateX">دوران افقی</option>
                  <option value="rotateY">دوران عمودی</option>
                  <option value="shake">لرزش</option>
                  <option value="pulse">نبض</option>
                  <option value="swing">تاب</option>
                  <option value="rubberBand">کشسان</option>
                  <option value="wobble">تلق‌تلق</option>
                  <option value="jello">ژله‌ای</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  نوع ایسینگ
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
                  مدت زمان (ثانیه): {formData.animation.duration}s
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
                  تأخیر (ثانیه): {formData.animation.delay}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
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

              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex items-center space-x-3 space-x-reverse mb-4">
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

                <button
                  type="button"
                  onClick={() => {
                    const animations: ('fade' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'zoom' | 'zoomOut' | 'bounce' | 'flip' | 'flipX' | 'flipY' | 'rotate' | 'rotateX' | 'rotateY' | 'shake' | 'pulse' | 'swing' | 'rubberBand' | 'wobble' | 'jello')[] = ['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello'];
                    const easings: ('linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'back')[] = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'bounce', 'elastic', 'back'];
                    const directions: ('normal' | 'reverse' | 'alternate' | 'alternate-reverse')[] = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
                    
                    const randomAnimation = {
                      entrance: animations[Math.floor(Math.random() * animations.length)],
                      exit: animations[Math.floor(Math.random() * animations.length)],
                      duration: Math.round((Math.random() * 4.9 + 0.1) * 10) / 10,
                      delay: Math.round((Math.random() * 3) * 10) / 10,
                      easing: easings[Math.floor(Math.random() * easings.length)],
                      loop: Math.random() > 0.7,
                      direction: directions[Math.floor(Math.random() * directions.length)]
                    };
                    
                    // Force state update with new object reference
                    setFormData(prev => ({
                      ...prev,
                      animation: { ...randomAnimation }
                    }));

                    // Trigger preview animation
                    setTimeout(() => {
                      const previewEl = document.querySelector('.animation-preview-content');
                      if (previewEl) {
                        previewEl.classList.remove('animate-preview', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello');
                        setTimeout(() => {
                          previewEl.classList.add('animate-preview', randomAnimation.entrance);
                        }, 50);
                      }
                    }, 100);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg transition-all duration-300 font-medium"
                >
                  🎲 انیمیشن تصادفی
                </button>
              </div>
            </div>
          </div>

          {/* Button Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">🔗 تنظیمات دکمه</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  متن دکمه
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => handleInputChange('buttonText', e.target.value)}
                  placeholder="متن دکمه (اختیاری)"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  لینک دکمه
                </label>
                <input
                  type="text"
                  value={formData.buttonLink}
                  onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                  placeholder="/products (اختیاری)"
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
                  <option value="ghost">شبح</option>
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
            </div>
          </div>

          {/* Text & Visual Settings */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">📍 تنظیمات متن و نمایش</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  موقعیت متن
                </label>
                <select
                  value={formData.textPosition}
                  onChange={(e) => handleInputChange('textPosition', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="left">چپ</option>
                  <option value="center">وسط</option>
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
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                  فعال
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border-b border-gray-600 pb-6">
            <h3 className="text-xl font-bold text-white mb-4">👁️ پیش‌نمایش زنده</h3>
            <div className="relative h-64 rounded-lg overflow-hidden border border-gray-600">
              {/* Background */}
              <div 
                className={`absolute inset-0 transition-all duration-300 ${
                  formData.backgroundType === 'gradient' 
                    ? '' 
                    : formData.backgroundType === 'video' 
                      ? 'bg-gray-900' 
                      : 'bg-gray-800'
                }`}
                style={{
                  background: formData.backgroundType === 'gradient' 
                    ? `linear-gradient(135deg, ${formData.gradientColors[0]}, ${formData.gradientColors[1]})` 
                    : formData.backgroundType === 'image' && formData.imageUrl
                      ? `url(${formData.imageUrl}) center/cover`
                      : undefined
                }}
              >
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
                <div className={`animation-preview-content absolute inset-0 flex items-center ${
                  formData.textPosition.includes('left') ? 'justify-start text-left pl-8' :
                  formData.textPosition.includes('right') ? 'justify-end text-right pr-8' :
                  'justify-center text-center'
                } ${
                  formData.textPosition.includes('top') ? 'items-start pt-8' :
                  formData.textPosition.includes('bottom') ? 'items-end pb-8' :
                  'items-center'
                }`}
                style={{
                  '--duration': `${formData.animation.duration}s`,
                  '--delay': `${formData.animation.delay}s`,
                  '--easing': formData.animation.easing,
                  animationDirection: formData.animation.direction,
                  animationIterationCount: formData.animation.loop ? 'infinite' : '1'
                } as React.CSSProperties}
                >
                  <div className="max-w-lg">
                    {formData.title && (
                      <h2 
                        className={`text-2xl font-bold mb-2 ${formData.textShadow ? 'drop-shadow-lg' : ''}`}
                        style={{ color: formData.textColor }}
                      >
                        {formData.title}
                      </h2>
                    )}
                    {formData.subtitle && (
                      <p 
                        className={`text-lg mb-2 ${formData.textShadow ? 'drop-shadow-lg' : ''}`}
                        style={{ color: formData.textColor }}
                      >
                        {formData.subtitle}
                      </p>
                    )}
                    {formData.description && (
                      <p 
                        className={`text-sm mb-4 ${formData.textShadow ? 'drop-shadow-lg' : ''}`}
                        style={{ color: formData.textColor }}
                      >
                        {formData.description}
                      </p>
                    )}
                    {formData.buttonText && (
                      <button
                        type="button"
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                          formData.buttonStyle === 'outline' 
                            ? 'border-2 bg-transparent hover:bg-opacity-20' 
                            : formData.buttonStyle === 'ghost'
                              ? 'bg-transparent hover:bg-opacity-20'
                              : formData.buttonStyle === 'gradient'
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                : 'text-white'
                        }`}
                        style={{
                          backgroundColor: formData.buttonStyle === 'default' ? formData.buttonColor : undefined,
                          borderColor: formData.buttonStyle === 'outline' ? formData.buttonColor : undefined,
                          color: formData.buttonStyle === 'outline' || formData.buttonStyle === 'ghost' ? formData.buttonColor : undefined
                        }}
                      >
                        {formData.buttonText}
                      </button>
                    )}
                  </div>
                </div>

                {/* Animation Preview Trigger */}
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => {
                      const previewEl = document.querySelector('.animation-preview-content');
                      if (previewEl) {
                        // Remove all animation classes
                        previewEl.classList.remove('animate-preview', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello');
                        
                        // Add animation with slight delay
                        setTimeout(() => {
                          previewEl.classList.add('animate-preview', formData.animation.entrance);
                        }, 50);
                      }
                    }}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
                  >
                    🎬 پیش‌نمایش
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-500 text-white rounded-lg transition-all duration-300 shadow-lg font-medium"
            >
              {loading ? '⏳ در حال به‌روزرسانی...' : '✅ به‌روزرسانی اسلاید'}
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
  );
};

export default EditSliderPage;
