'use client';

import { useState } from 'react';

interface InlineLicenseInjectorProps {
  selectedFile: File | null;
  selectedFileUrl?: {url: string; name: string} | null;
  productId: string;
  onProcessComplete: (processedFile: { url: string; fileName: string }) => void;
  onError: (error: string) => void;
}

export default function InlineLicenseInjector({ 
  selectedFile, 
  selectedFileUrl,
  productId, 
  onProcessComplete, 
  onError 
}: InlineLicenseInjectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');

  const processWithLicense = async () => {
    if ((!selectedFile && !selectedFileUrl) || !productId.trim()) {
      onError('فایل و شناسه محصول مورد نیاز است');
      return;
    }

    const fileName = selectedFile ? selectedFile.name : selectedFileUrl?.name || '';

    // بررسی نوع فایل
    if (!fileName.toLowerCase().endsWith('.zip')) {
      onError('فقط فایل‌های ZIP قابل پردازش هستند');
      return;
    }

    setIsProcessing(true);
    setProcessStatus('uploading');

    try {
      let uploadResult;
      
      if (selectedFile) {
        // آپلود فایل از کامپیوتر
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadResponse = await fetch('/api/upload-zip', {
          method: 'POST',
          body: uploadData
        });

        if (!uploadResponse.ok) {
          throw new Error('خطا در آپلود فایل');
        }

        uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'خطا در آپلود فایل');
        }

        setProcessStatus('processing');

        // پردازش فایل و تزریق لایسنس
        const processResponse = await fetch('/api/admin/files/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: uploadResult.filePath,
            productId: productId.trim(),
            fileType: 'theme'
          })
        });

        if (!processResponse.ok) {
          throw new Error('خطا در پردازش فایل');
        }

        const processResult = await processResponse.json();
        
        if (!processResult.success) {
          throw new Error(processResult.error || 'خطا در پردازش فایل');
        }

        setProcessStatus('complete');

        // ارسال نتیجه به والد
        onProcessComplete({
          url: `/api/download?file=${encodeURIComponent(processResult.processedFilePath)}`,
          fileName: processResult.fileName || fileName.replace('.zip', '_licensed.zip')
        });

      } else if (selectedFileUrl) {
        // پردازش فایل موجود در فایل منیجر
        setProcessStatus('processing');

        const processResponse = await fetch('/api/admin/files/process-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: selectedFileUrl.url,
            productId: productId.trim()
          })
        });

        if (!processResponse.ok) {
          throw new Error('خطا در پردازش فایل');
        }

        const processResult = await processResponse.json();
        
        if (!processResult.success) {
          throw new Error(processResult.error || 'خطا در پردازش فایل');
        }

        setProcessStatus('complete');

        // ارسال نتیجه به والد
        onProcessComplete({
          url: `/api/download?file=${encodeURIComponent(processResult.processedFilePath)}`,
          fileName: processResult.fileName || fileName.replace('.zip', '_licensed.zip')
        });
      }

    } catch (error) {
      console.error('خطا در پردازش لایسنس:', error);
      onError(error instanceof Error ? error.message : 'خطای نامشخص در پردازش');
      setProcessStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  // اگر فایل انتخاب نشده یا شناسه محصول نداریم، چیزی نمایش نده
  if ((!selectedFile && !selectedFileUrl) || !productId.trim()) {
    return null;
  }

  const currentFileName = selectedFile ? selectedFile.name : selectedFileUrl?.name || '';

  // فقط فایل‌های ZIP قابل پردازش هستند
  if (!currentFileName.toLowerCase().endsWith('.zip')) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-purple-900">🔐 تزریق خودکار لایسنس</h4>
          <p className="text-sm text-purple-700">برای محصولات وردپرس (قالب و افزونه)</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* اطلاعات فایل */}
        <div className="bg-white/50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{currentFileName}</div>
              <div className="text-sm text-gray-600">
                شناسه محصول: <span className="font-mono text-purple-700">{productId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* وضعیت پردازش */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-blue-800">
                {processStatus === 'uploading' && '📤 در حال آپلود فایل...'}
                {processStatus === 'processing' && '⚙️ در حال تزریق کدهای لایسنس...'}
              </div>
            </div>
          </div>
        )}

        {/* وضعیت موفقیت */}
        {processStatus === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                ✅ لایسنس با موفقیت تزریق شد!
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              فایل نهایی آماده آپلود در سیستم است. فایل اصلی با کدهای لایسنس تزریق شده جایگزین خواهد شد.
            </p>
          </div>
        )}

        {/* دکمه پردازش */}
        <button
          onClick={processWithLicense}
          disabled={isProcessing || processStatus === 'complete'}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            processStatus === 'complete'
              ? 'bg-green-100 text-green-700 cursor-default'
              : isProcessing
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
          }`}
        >
          {processStatus === 'complete' ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              لایسنس تزریق شده
            </>
          ) : isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              در حال پردازش...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              🚀 تزریق لایسنس
            </>
          )}
        </button>

        {/* راهنما */}
        <div className="text-xs text-purple-600 bg-white/30 rounded-lg p-2">
          <p className="font-medium mb-1">💡 این ویژگی برای:</p>
          <ul className="space-y-0.5 text-purple-700">
            <li>• قالب‌های وردپرس (.zip)</li>
            <li>• افزونه‌های وردپرس (.zip)</li>
            <li>• تزریق خودکار کدهای لایسنس و فعال‌سازی</li>
          </ul>
        </div>
      </div>
    </div>
  );
}