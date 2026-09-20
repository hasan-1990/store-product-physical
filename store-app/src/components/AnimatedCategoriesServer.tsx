import { connectDB } from '@/lib/mongodb';
import { getFeaturedCategories } from '@/lib/homepage-data';
import AnimatedCategoriesClient from './AnimatedCategoriesClient';

export default async function AnimatedCategoriesServer() {
  try {
    // دریافت دسته‌بندی‌ها از تابع کش‌دار
    const categories = await getFeaturedCategories();
    
    // اگر دسته‌بندی نداریم، null برمی‌گردونیم
    if (!categories || categories.length === 0) {
      return null;
    }

    // ارسال به Client Component
    return <AnimatedCategoriesClient categories={categories} />;
  } catch (error) {
    console.error('❌ Error in AnimatedCategoriesServer:', error);
    return null;
  }
}
