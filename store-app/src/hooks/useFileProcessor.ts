import { useCallback } from 'react';

interface ProcessFileOptions {
  filePath: string;
  productId: string;
  fileType: 'theme' | 'plugin';
  apiUrl?: string;
}

interface ProcessFileResult {
  success: boolean;
  processedFilePath?: string;
  injectedFiles?: string[];
  error?: string;
}

export const useFileProcessor = () => {
  const processFile = useCallback(async (options: ProcessFileOptions): Promise<ProcessFileResult> => {
    try {
      const response = await fetch('/api/admin/files/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'خطا در پردازش فایل');
      }

      return result;
    } catch (error) {
      console.error('خطا در پردازش فایل:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای نامشخص'
      };
    }
  }, []);

  return { processFile };
};