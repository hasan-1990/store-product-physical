'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Eye, Star, Settings, Trash2, X, Check, RefreshCw } from 'lucide-react';

// تعاریف Type
interface FontWeight {
  weight: number;
  style: 'normal' | 'italic';
  filename: string;
  url: string;
}

interface Font {
  _id: string;
  name: string;
  family: string;
  weights: FontWeight[];
  isActive: boolean;
  isDefault: boolean;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PendingFontFile {
  file: File;
  weight: number;
  style: 'normal' | 'italic';
  preview: string;
}

interface PendingFont {
  name: string;
  family: string;
  files: PendingFontFile[];
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function FontsAdminPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFonts, setPendingFonts] = useState<PendingFont[]>([]);
  const [refreshingFont, setRefreshingFont] = useState(false);

  // بارگذاری فونت‌ها
  const loadFonts = async () => {
    try {
      const response = await fetch('/api/admin/fonts');
      const data = await response.json();
      
      if (data.success) {
        setFonts(data.fonts);
      } else {
        console.error('خطا در دریافت فونت‌ها:', data.error);
      }
    } catch (error) {
      console.error('خطا در دریافت فونت‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFonts();
  }, []);

  // تشخیص وزن فونت از نام فایل
  const detectFontWeight = (filename: string): number => {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('thin') || lowerName.includes('100')) return 100;
    if (lowerName.includes('extralight') || lowerName.includes('200')) return 200;
    if (lowerName.includes('light') || lowerName.includes('300')) return 300;
    if (lowerName.includes('regular') || lowerName.includes('normal') || lowerName.includes('400')) return 400;
    if (lowerName.includes('medium') || lowerName.includes('500')) return 500;
    if (lowerName.includes('semibold') || lowerName.includes('600')) return 600;
    if (lowerName.includes('bold') || lowerName.includes('700')) return 700;
    if (lowerName.includes('extrabold') || lowerName.includes('800')) return 800;
    if (lowerName.includes('black') || lowerName.includes('heavy') || lowerName.includes('900')) return 900;
    
    const weightMatch = lowerName.match(/[_\\-\\s]([1-9]00)[_\\-\\s\\.]/);
    if (weightMatch) {
      const weight = parseInt(weightMatch[1]);
      if (weight >= 100 && weight <= 900 && weight % 100 === 0) {
        return weight;
      }
    }
    
    return 400;
  };

  // تشخیص استایل فونت از نام فایل
  const detectFontStyle = (filename: string): 'normal' | 'italic' => {
    const lowerName = filename.toLowerCase();
    return lowerName.includes('italic') || lowerName.includes('oblique') || lowerName.includes('slanted') ? 'italic' : 'normal';
  };

  // مدیریت فایل‌های انتخاب شده
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => 
      file.type === 'font/woff' || 
      file.type === 'font/woff2' || 
      file.type === 'font/ttf' || 
      file.type === 'font/otf' ||
      file.name.endsWith('.woff') ||
      file.name.endsWith('.woff2') ||
      file.name.endsWith('.ttf') ||
      file.name.endsWith('.otf')
    );

    if (validFiles.length === 0) {
      alert('لطفاً فایل‌های فونت معتبر انتخاب کنید (woff, woff2, ttf, otf)');
      return;
    }

    // گروه‌بندی فایل‌ها بر اساس نام فونت (تشخیص خودکار)
    const fontGroups: { [key: string]: { files: File[], detectedWeights: { file: File, weight: number, style: string }[] } } = {};
    
    validFiles.forEach(file => {
      // استخراج نام فونت از نام فایل (حذف وزن و پسوند)
      const baseName = file.name
        .replace(/\\.(woff2?|ttf|otf)$/i, '')
        .replace(/[-_](thin|extralight|light|regular|normal|medium|semibold|bold|extrabold|black|heavy|italic|oblique|slanted|100|200|300|400|500|600|700|800|900)/gi, '')
        .trim();
      
      if (!fontGroups[baseName]) {
        fontGroups[baseName] = { 
          files: [], 
          detectedWeights: [] 
        };
      }
      
      fontGroups[baseName].files.push(file);
      
      // تشخیص خودکار وزن و استایل
      const weight = detectFontWeight(file.name);
      const style = detectFontStyle(file.name);
      
      fontGroups[baseName].detectedWeights.push({
        file,
        weight,
        style
      });
    });

    // تبدیل به PendingFont با وزن‌های تشخیص داده شده
    const newPendingFonts: PendingFont[] = Object.entries(fontGroups).map(([baseName, group]) => {
      // حذف extension اگر هنوز مانده باشد
      const cleanName = baseName.replace(/\.(woff2?|ttf|otf)$/i, '');
      
      return {
        name: cleanName,
        family: cleanName.replace(/\s+/g, ''),
        files: group.detectedWeights.map(item => ({
          file: item.file,
          weight: item.weight,
          style: item.style as 'normal' | 'italic',
          preview: `نمونه متن با ${cleanName} - وزن ${item.weight}`
        }))
      };
    });

    setPendingFonts(newPendingFonts);
    setShowUploadModal(true);
  };

  // آپلود فونت‌ها به شیوه جدید (یک‌مرحله‌ای)
  const uploadPendingFonts = async () => {
    if (pendingFonts.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const pendingFont of pendingFonts) {
        try {
          // بررسی اینکه آیا فونت با این نام وجود دارد
          const existingFont = fonts.find(f => f.family === pendingFont.family);
          
          if (existingFont) {
            const shouldReplace = confirm(`فونت "${pendingFont.name}" قبلاً وجود دارد. وزن‌های جدید به فونت موجود اضافه می‌شوند. ادامه می‌دهید؟`);
            if (!shouldReplace) {
              continue;
            }
          }

          // ایجاد FormData برای آپلود همه فایل‌های این فونت
          const formData = new FormData();
          formData.append('fontName', pendingFont.name);
          formData.append('fontFamily', pendingFont.family);

          // اضافه کردن همه فایل‌ها با ایندکس
          pendingFont.files.forEach((fontFile, index) => {
            formData.append(`file_${index}`, fontFile.file);
          });

          const response = await fetch('/api/admin/fonts', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'خطا در آپلود فونت');
          }

          const result = await response.json();
          console.log(`فونت ${pendingFont.name} با موفقیت آپلود شد:`, result);

          successCount++;
        } catch (error) {
          console.error(`خطا در آپلود فونت ${pendingFont.name}:`, error);
          errorCount++;
        }
      }

      // بروزرسانی لیست فونت‌ها
      await loadFonts();
      
      // تازه‌سازی CSS فونت پویا
      await refreshDynamicFont();
      
      // نمایش نتیجه
      if (successCount > 0) {
        alert(`${successCount} فونت با موفقیت آپلود شد و فونت سایت بروزرسانی شد!`);
      }
      if (errorCount > 0) {
        alert(`خطا در آپلود ${errorCount} فونت`);
      }

      // بستن مودال و پاک کردن فایل‌های انتظار
      setShowUploadModal(false);
      setPendingFonts([]);
      
    } catch (error) {
      console.error('خطا در آپلود فونت‌ها:', error);
      alert('خطا در آپلود فونت‌ها');
    } finally {
      setUploading(false);
    }
  };

  // تغییر وضعیت فونت
  const toggleFontStatus = async (fontId: string, isActive: boolean, isDefault: boolean = false) => {
    console.log('🎨 شروع تغییر وضعیت فونت:', { fontId, isActive, isDefault });
    
    try {
      const response = await fetch('/api/admin/fonts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fontId, isActive, isDefault }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ پاسخ موفق از سرور:', result);
        
        await loadFonts();
        // تازه‌سازی فونت فعال
        await refreshDynamicFont();
        
        if (isDefault) {
          console.log('⭐ فونت پیش‌فرض تغییر کرد');
          alert('فونت پیش‌فرض تغییر کرد و در کل سایت اعمال شد!');
        } else if (isActive) {
          console.log('✅ فونت فعال شد');
          alert('فونت فعال شد!');
        } else {
          console.log('❌ فونت غیرفعال شد');
          alert('فونت غیرفعال شد!');
        }
      } else {
        const error = await response.json();
        console.error('❌ خطا از سرور:', error);
        throw new Error(error.error || 'خطا در تغییر وضعیت فونت');
      }
    } catch (error) {
      console.error('❌ خطا در تغییر وضعیت فونت:', error);
      alert(error instanceof Error ? error.message : 'خطا در تغییر وضعیت فونت');
    }
  };

  // حذف فونت
  const deleteFont = async (fontId: string) => {
    if (!confirm('آیا از حذف این فونت اطمینان دارید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/fonts?fontId=${fontId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFonts();
        await refreshDynamicFont();
        alert('فونت با موفقیت حذف شد و فونت سایت بروزرسانی شد!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'خطا در حذف فونت');
      }
    } catch (error) {
      console.error('خطا:', error);
      alert(error instanceof Error ? error.message : 'خطا در حذف فونت');
    }
  };

  // تازه‌سازی فونت‌های پویا
  const refreshDynamicFont = async () => {
    console.log('🔄 شروع تازه‌سازی فونت‌های پویا...');
    setRefreshingFont(true);
    try {
      // ایجاد timestamp برای جلوگیری از cache
      const timestamp = new Date().getTime();
      const dynamicFontUrl = `/api/fonts/dynamic.css?t=${timestamp}`;
      console.log('🔗 URL فونت پویا:', dynamicFontUrl);
      
      // بررسی CSS فعلی
      const response = await fetch(dynamicFontUrl);
      const cssContent = await response.text();
      console.log('📄 CSS دریافت شده:', cssContent.substring(0, 300) + (cssContent.length > 300 ? '...' : ''));
      
      // حذف link قبلی و ایجاد link جدید
      const existingLink = document.querySelector('link[href*="/api/fonts/dynamic.css"]');
      if (existingLink) {
        console.log('🗑️ حذف link قبلی فونت');
        existingLink.remove();
      }
      
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = dynamicFontUrl;
      newLink.type = 'text/css';
      document.head.appendChild(newLink);
      console.log('➕ link جدید فونت اضافه شد');
      
      // کمی صبر کنیم تا CSS بارگذاری شود
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ تازه‌سازی فونت‌های پویا کامل شد');
      
    } catch (error) {
      console.error('❌ خطا در تازه‌سازی فونت:', error);
    } finally {
      setRefreshingFont(false);
    }
  };

  // مدیریت Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // آمار فونت‌ها
  const activeFonts = fonts.filter(font => font.isActive);
  const defaultFont = fonts.find(font => font.isDefault);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* هدر */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">🎨 مدیریت فونت‌های سایت</h1>
              <p className="text-gray-300">مدیریت کامل فونت‌ها با اعمال زنده در کل سایت</p>
            </div>
            
            <button
              onClick={refreshDynamicFont}
              disabled={refreshingFont}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg"
              title="تازه‌سازی فونت‌های سایت"
            >
              <RefreshCw className={`h-5 w-5 ${refreshingFont ? 'animate-spin' : ''}`} />
              <span>{refreshingFont ? 'در حال تازه‌سازی...' : '🔄 تازه‌سازی فونت سایت'}</span>
            </button>
          </div>
        </div>

        {/* وضعیت فعلی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">فونت فعال</h3>
                {activeFonts.length > 0 ? (
                  <div>
                    <p className="text-xl font-bold text-green-300">{activeFonts[0]?.name}</p>
                    <p className="text-sm text-gray-300">{activeFonts[0]?.family}</p>
                    {activeFonts.length > 1 && (
                      <p className="text-xs text-orange-300 mt-1">
                        ⚠️ {activeFonts.length - 1} فونت دیگر نیز فعال است!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-lg text-red-300">هیچ فونتی فعال نیست</p>
                )}
              </div>
              <Eye className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">فونت پیش‌فرض</h3>
                <p className="text-lg text-green-300">{defaultFont?.name || 'تنظیم نشده'}</p>
              </div>
              <Star className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">کل فونت‌ها</h3>
                <p className="text-2xl font-bold text-blue-300">{fonts.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* منطقه آپلود */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-purple-400 bg-purple-500/20 scale-105' 
                : 'border-gray-600 hover:border-gray-500 bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="text-purple-400">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                <p className="text-lg">در حال آپلود...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">آپلود فونت جدید</h3>
                <p className="text-gray-300 mb-4">فایل‌های فونت را بکشید و رها کنید یا کلیک کنید</p>
                <input
                  type="file"
                  multiple
                  accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="font-upload"
                />
                <label
                  htmlFor="font-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  انتخاب فایل‌ها
                </label>
                <p className="text-sm text-gray-400 mt-3">
                  فرمت‌های پشتیبانی: WOFF, WOFF2, TTF, OTF - تشخیص خودکار وزن فونت
                </p>
              </>
            )}
          </div>
        </div>

        {/* لیست همه فونت‌ها */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Eye className="h-6 w-6 mr-2" />
            همه فونت‌ها
          </h2>
          
          {fonts.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-gray-600/30">
              <div className="text-gray-400 mb-4">
                <Upload className="mx-auto h-16 w-16 mb-4" />
                <p className="text-lg">هنوز فونتی آپلود نشده</p>
                <p className="text-sm">اولین فونت خود را آپلود کنید</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fonts.map((font) => (
                <div key={font._id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white" style={{ fontFamily: font.family }}>
                        {font.name}
                      </h3>
                      {font.isSystem && (
                        <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full mt-1 inline-block">سیستمی</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {font.isDefault && (
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      )}
                      {font.isActive && (
                        <Check className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 bg-black/20 rounded-lg">
                    <p className="text-white" style={{ fontFamily: font.family }}>
                      نمونه متن با این فونت - لورم ایپسوم
                    </p>
                  </div>

                  <div className="text-xs text-gray-400 mb-4">
                    <p>خانواده: {font.family}</p>
                    <p>وزن‌ها: {font.weights?.length || 1}</p>
                    <p>نوع: {font.isSystem ? 'سیستمی' : 'آپلود شده'}</p>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => toggleFontStatus(font._id, !font.isActive)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        font.isActive 
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                          : 'bg-gray-500/20 text-gray-300 border border-gray-400/30 hover:bg-gray-400/30'
                      }`}
                    >
                      {font.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                    
                    <button
                      onClick={() => toggleFontStatus(font._id, true, true)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        font.isDefault 
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' 
                          : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {font.isDefault ? 'پیش‌فرض' : 'تنظیم'}
                    </button>

                    {/* دکمه حذف فقط برای فونت‌های غیرپیش‌فرض و غیرسیستمی */}
                    {!font.isDefault && !font.isSystem && (
                      <button
                        onClick={() => deleteFont(font._id)}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-400/30 transition-all duration-200 group"
                        title="حذف فونت"
                      >
                        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    
                    {/* نمایش قفل برای فونت پیش‌فرض یا سیستمی */}
                    {(font.isDefault || font.isSystem) && !font.isActive && (
                      <div className="px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-600/30 bg-gray-600/10" title={font.isSystem ? "فونت سیستمی" : "فونت پیش‌فرض"}>
                        🔒
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* مودال آپلود پیشرفته */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">بررسی و تایید فونت‌های آپلود</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-gray-300 mt-2">وزن و استایل هر فایل به صورت خودکار تشخیص داده شده است. در صورت نیاز می‌توانید تغییر دهید.</p>
              </div>

              <div className="p-6 space-y-6">
                {pendingFonts.map((pendingFont, fontIndex) => (
                  <div key={fontIndex} className="bg-white/5 rounded-xl p-4 border border-purple-500/10">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      📝 {pendingFont.name} 
                      <span className="text-sm text-gray-400 ml-2">({pendingFont.files.length} فایل)</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {pendingFont.files.map((fontFile, fileIndex) => (
                        <div key={fileIndex} className="bg-white/5 rounded-lg p-4 border border-gray-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <span className="text-white font-medium">📄 {fontFile.file.name}</span>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                {(fontFile.file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                وزن: {fontFile.weight}
                              </span>
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                                {fontFile.style === 'italic' ? 'مایل' : 'عادی'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* انتخاب وزن */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">تصحیح وزن فونت</label>
                              <select
                                value={fontFile.weight}
                                onChange={(e) => {
                                  const newPendingFonts = [...pendingFonts];
                                  newPendingFonts[fontIndex].files[fileIndex].weight = parseInt(e.target.value);
                                  setPendingFonts(newPendingFonts);
                                }}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                              >
                                <option value={100}>نازک (100)</option>
                                <option value={200}>خیلی سبک (200)</option>
                                <option value={300}>سبک (300)</option>
                                <option value={400}>معمولی (400)</option>
                                <option value={500}>متوسط (500)</option>
                                <option value={600}>نیمه ضخیم (600)</option>
                                <option value={700}>ضخیم (700)</option>
                                <option value={800}>خیلی ضخیم (800)</option>
                                <option value={900}>سیاه (900)</option>
                              </select>
                            </div>

                            {/* انتخاب استایل */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">تصحیح استایل</label>
                              <select
                                value={fontFile.style}
                                onChange={(e) => {
                                  const newPendingFonts = [...pendingFonts];
                                  newPendingFonts[fontIndex].files[fileIndex].style = e.target.value as 'normal' | 'italic';
                                  setPendingFonts(newPendingFonts);
                                }}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                              >
                                <option value="normal">عادی</option>
                                <option value="italic">مایل</option>
                              </select>
                            </div>

                            {/* متن پیش‌نمایش */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">متن نمونه</label>
                              <input
                                type="text"
                                value={fontFile.preview}
                                onChange={(e) => {
                                  const newPendingFonts = [...pendingFonts];
                                  newPendingFonts[fontIndex].files[fileIndex].preview = e.target.value;
                                  setPendingFonts(newPendingFonts);
                                }}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-400 focus:outline-none"
                                placeholder="متن نمونه برای پیش‌نمایش"
                              />
                            </div>
                          </div>

                          {/* پیش‌نمایش فونت */}
                          <div className="mt-4 p-3 bg-white/10 rounded-lg">
                            <p className="text-gray-300 text-sm mb-2">پیش‌نمایش:</p>
                            <div 
                              className="text-white text-lg"
                              style={{ 
                                fontWeight: fontFile.weight,
                                fontStyle: fontFile.style 
                              }}
                            >
                              {fontFile.preview}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-purple-500/20 flex justify-between items-center bg-gray-900/50">
                <div className="text-sm text-gray-400">
                  📊 مجموع: {pendingFonts.reduce((sum, font) => sum + font.files.length, 0)} فایل در {pendingFonts.length} فونت
                </div>
                
                <div className="flex space-x-3 space-x-reverse">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    انصراف
                  </button>
                  
                  <button
                    onClick={uploadPendingFonts}
                    disabled={uploading}
                    className="px-8 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>در حال آپلود...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>✅ تایید و آپلود همه فونت‌ها</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}