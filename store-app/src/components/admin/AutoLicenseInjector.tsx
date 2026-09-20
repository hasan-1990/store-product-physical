'use client';

import { useState, useRef } from 'react';
import { useFileProcessor } from '@/hooks/useFileProcessor';

interface AutoLicenseInjectorProps {
  onProcessComplete?: (result: any) => void;
  apiUrl?: string;
}

export default function AutoLicenseInjector({ onProcessComplete, apiUrl }: AutoLicenseInjectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processFile } = useFileProcessor();

  const [formData, setFormData] = useState({
    productId: '',
    fileType: 'theme' as 'theme' | 'plugin',
    selectedFile: null as File | null
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
        setError('لطفاً فقط فایل‌های ZIP انتخاب کنید');
        return;
      }
      setFormData(prev => ({ ...prev, selectedFile: file }));
      setError('');
    }
  };

  const handleProcess = async () => {
    if (!formData.selectedFile || !formData.productId.trim()) {
      setError('لطفاً همه فیلدها را پر کنید');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // ایجاد FormData برای آپلود فایل
      const uploadData = new FormData();
      uploadData.append('file', formData.selectedFile);
      
      // آپلود فایل
      const uploadResponse = await fetch('/api/upload-zip', {
        method: 'POST',
        body: uploadData
      });

      if (!uploadResponse.ok) {
        throw new Error('خطا در آپلود فایل');
      }

      const uploadResult = await uploadResponse.json();
      
      // پردازش فایل و تزریق لایسنس
      const processResult = await processFile({
        filePath: uploadResult.filePath,
        productId: formData.productId,
        fileType: formData.fileType,
        apiUrl: apiUrl || process.env.NEXT_PUBLIC_API_URL
      });

      if (processResult.success) {
        setProcessResult(processResult);
        onProcessComplete?.(processResult);
      } else {
        setError(processResult.error || 'خطا در پردازش فایل');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطای نامشخص');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      fileType: 'theme',
      selectedFile: null
    });
    setProcessResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">🔐 تزریق خودکار لایسنس</h2>
          <p className="text-sm text-gray-600">آپلود فایل و تزریق خودکار کدهای لایسنس</p>
        </div>
      </div>

      {!processResult ? (
        <div className="space-y-6">
          {/* انتخاب نوع فایل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع پروژه
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, fileType: 'theme' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.fileType === 'theme'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-medium">قالب وردپرس</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, fileType: 'plugin' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.fileType === 'plugin'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔌</div>
                  <div className="font-medium">افزونه وردپرس</div>
                </div>
              </button>
            </div>
          </div>

          {/* شناسه محصول */}
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
              شناسه محصول
            </label>
            <input
              type="text"
              id="productId"
              value={formData.productId}
              onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="مثال: THEME_001 یا PLUGIN_001"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">
              شناسه یکتا برای این محصول (ترکیب حروف انگلیسی، اعداد و خط تیره)
            </p>
          </div>

          {/* انتخاب فایل */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              فایل ZIP پروژه
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-2">
                    {formData.selectedFile ? (
                      <p className="text-sm text-green-600 font-medium">
                        ✅ {formData.selectedFile.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-purple-600">کلیک کنید</span> یا فایل را اینجا بکشید
                        </p>
                        <p className="text-xs text-gray-500">فقط فایل‌های ZIP (حداکثر 100MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* نمایش خطا */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="mr-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* دکمه پردازش */}
          <button
            onClick={handleProcess}
            disabled={isProcessing || !formData.selectedFile || !formData.productId.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                در حال پردازش و تزریق لایسنس...
              </div>
            ) : (
              '🚀 پردازش و تزریق لایسنس'
            )}
          </button>
        </div>
      ) : (
        /* نمایش نتیجه */
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-green-800">✅ پردازش با موفقیت انجام شد!</h3>
                <p className="text-sm text-green-700 mt-1">کدهای لایسنس به فایل تزریق شد.</p>
              </div>
            </div>
          </div>

          {/* جزئیات پردازش */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 جزئیات پردازش:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• نوع پروژه: {formData.fileType === 'theme' ? 'قالب وردپرس' : 'افزونه وردپرس'}</li>
              <li>• شناسه محصول: {formData.productId}</li>
              <li>• فایل اصلی: {formData.selectedFile?.name}</li>
              {processResult.injectedFiles && (
                <li>• فایل‌های تغییر یافته: {processResult.injectedFiles.join(', ')}</li>
              )}
            </ul>
          </div>

          {/* دکمه‌های عملیات */}
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 پردازش فایل جدید
            </button>
            
            {processResult.processedFilePath && (
              <a
                href={`/api/download?file=${encodeURIComponent(processResult.processedFilePath)}`}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                📥 دانلود فایل نهایی
              </a>
            )}
          </div>
        </div>
      )}

      {/* راهنما */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">💡 راهنمای استفاده:</h4>
        <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
          <li>نوع پروژه خود را انتخاب کنید (قالب یا افزونه)</li>
          <li>شناسه یکتا برای محصول تعیین کنید</li>
          <li>فایل ZIP پروژه خود را آپلود کنید</li>
          <li>روی دکمه پردازش کلیک کنید</li>
          <li>فایل نهایی با کدهای لایسنس را دانلود کنید</li>
        </ol>
      </div>
    </div>
  );
}