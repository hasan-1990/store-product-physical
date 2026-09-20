/**
 * Database Optimizer
 * بهینه‌سازی MongoDB و کوئری‌ها
 */

import { connectDB } from '@/lib/mongodb';

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;

  private constructor() {}

  static getInstance(): DatabaseOptimizer {
    if (!this.instance) {
      this.instance = new DatabaseOptimizer();
    }
    return this.instance;
  }

  /**
   * بهینه‌سازی Indexها
   */
  async optimizeIndexes(): Promise<{ message: string; success: boolean }> {
    try {
      const db = await connectDB();
      
      const results: string[] = [];

      // بهینه‌سازی indexهای اصلی
      try {
        await db.products.createIndex({ createdAt: -1 });
        await db.products.createIndex({ active: 1, featured: 1 });
        await db.products.createIndex({ categoryId: 1 });
        results.push('✅ Products indexes optimized');
      } catch (error) {
        results.push('⚠️ Products indexes: already exist');
      }

      try {
        await db.orders.createIndex({ createdAt: -1 });
        await db.orders.createIndex({ userId: 1 });
        await db.orders.createIndex({ status: 1 });
        results.push('✅ Orders indexes optimized');
      } catch (error) {
        results.push('⚠️ Orders indexes: already exist');
      }

      try {
        await db.users.createIndex({ email: 1 }, { unique: true });
        results.push('✅ Users indexes optimized');
      } catch (error) {
        results.push('⚠️ Users indexes: already exist');
      }

      try {
        await db.categories.createIndex({ slug: 1 }, { unique: true });
        results.push('✅ Categories indexes optimized');
      } catch (error) {
        results.push('⚠️ Categories indexes: already exist');
      }

      console.log('📊 Index Optimization Results:\n', results.join('\n'));

      return {
        success: true,
        message: `Indexes optimized for 4 collections`
      };
    } catch (error: any) {
      console.error('❌ خطا در بهینه‌سازی Indexها:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * پاکسازی داده‌های قدیمی
   */
  async cleanup(daysOld: number = 90): Promise<{
    deletedSessions: number;
    deletedCarts: number;
    deletedLogs: number;
  }> {
    try {
      const db = await connectDB();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedSessions = 0;
      let deletedCarts = 0;
      let deletedLogs = 0;

      // حذف سشن‌های منقضی شده
      try {
        const sessionsCollection = db.getCollection('sessions');
        const sessionResult = await sessionsCollection.deleteMany({
          expiresAt: { $lt: new Date() }
        });
        deletedSessions = sessionResult.deletedCount || 0;
      } catch (error) {
        console.warn('⚠️ No sessions collection found');
      }

      // حذف سبدهای خرید قدیمی
      try {
        const cartsCollection = db.carts;
        const cartResult = await cartsCollection.deleteMany({
          updatedAt: { $lt: cutoffDate },
          status: 'abandoned'
        });
        deletedCarts = cartResult.deletedCount || 0;
      } catch (error) {
        console.warn('⚠️ Carts cleanup failed');
      }

      // حذف لاگ‌های قدیمی
      try {
        const logsCollection = db.getCollection('logs');
        const logResult = await logsCollection.deleteMany({
          createdAt: { $lt: cutoffDate }
        });
        deletedLogs = logResult.deletedCount || 0;
      } catch (error) {
        console.warn('⚠️ No logs collection found');
      }

      console.log(`🗑️  پاکسازی انجام شد:
        - سشن‌ها: ${deletedSessions}
        - سبدها: ${deletedCarts}
        - لاگ‌ها: ${deletedLogs}
      `);

      return {
        deletedSessions,
        deletedCarts,
        deletedLogs
      };
    } catch (error) {
      console.error('❌ خطا در پاکسازی دیتابیس:', error);
      return {
        deletedSessions: 0,
        deletedCarts: 0,
        deletedLogs: 0
      };
    }
  }

  /**
   * تحلیل collectionها
   */
  async analyzeCollections(): Promise<{
    collections: Array<{
      name: string;
      documentCount: number;
      avgDocSize?: number;
    }>;
    totalDocuments: number;
  }> {
    try {
      const db = await connectDB();
      
      const collectionNames = [
        'products',
        'orders',
        'users',
        'categories',
        'blogPosts',
        'payments',
        'carts',
        'cart_items'
      ];

      const results: Array<{
        name: string;
        documentCount: number;
        avgDocSize?: number;
      }> = [];

      let totalDocuments = 0;

      for (const name of collectionNames) {
        try {
          const collection = db.getCollection(name);
          const count = await collection.countDocuments();
          
          results.push({
            name,
            documentCount: count,
          });

          totalDocuments += count;
        } catch (error) {
          console.warn(`⚠️ Could not analyze collection: ${name}`);
        }
      }

      console.log('📊 Collection Analysis:');
      results.forEach(r => {
        console.log(`  - ${r.name}: ${r.documentCount} documents`);
      });

      return {
        collections: results,
        totalDocuments
      };
    } catch (error) {
      console.error('❌ خطا در تحلیل collectionها:', error);
      return {
        collections: [],
        totalDocuments: 0
      };
    }
  }

  /**
   * دریافت پیشنهادات بهینه‌سازی
   */
  async getSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      const analysis = await this.analyzeCollections();

      // پیشنهاد بر اساس تعداد documents
      analysis.collections.forEach(coll => {
        if (coll.documentCount > 10000) {
          suggestions.push(
            `🔍 Collection "${coll.name}" دارای ${coll.documentCount.toLocaleString()} سند است. Pagination و Index optimization پیشنهاد می‌شود.`
          );
        }

        if (coll.documentCount === 0) {
          suggestions.push(
            `🗑️  Collection "${coll.name}" خالی است و می‌تواند حذف شود.`
          );
        }
      });

      // پیشنهادات کلی
      suggestions.push('💡 اجرای optimizeIndexes() به صورت هفتگی توصیه می‌شود.');
      suggestions.push('💡 اجرای cleanup() به صورت ماهانه برای حذف داده‌های قدیمی.');
      suggestions.push('💡 برای کوئری‌های پرتکرار، از Redis cache استفاده کنید.');

    } catch (error) {
      console.error('❌ خطا در تولید پیشنهادات:', error);
    }

    return suggestions;
  }
}

export default DatabaseOptimizer.getInstance();
