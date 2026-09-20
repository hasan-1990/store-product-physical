// خواندن تنظیمات URL - فقط برای server-side
import fs from 'fs';
import path from 'path';

export const getUrlSettings = () => {
  try {
    const settingsPath = path.join(process.cwd(), 'data', 'url-settings.json');
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch (error) {
    console.error('خطا در خواندن تنظیمات URL:', error);
  }
  
  // تنظیمات پیش‌فرض
  // fallback پیش‌فرض را مطابق نیاز پروژه (دسته/slug-عدد) قرار می‌دهیم
  return {
    urlStructure: 'category-product',
    categoryPrefix: '',
    productPrefix: '',
    removeStopWords: false,
    slugLanguage: 'english',
    maxSlugLength: 50,
    separatorType: '-',
    includeId: true,
    removeNumbers: false
  };
};