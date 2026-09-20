import { connectDB } from '@/lib/mongodb';
import type { TaskResult } from './types';
import fs from 'fs/promises';
import path from 'path';

/**
 * Handle report generation
 */
export async function handleReportGeneration(config: {
  reportType?: string;
}): Promise<TaskResult> {
  try {
    const db = await connectDB();
    const reportType = config.reportType || 'daily_sales';
    const reportDir = path.join(process.cwd(), 'reports');
    
    await fs.mkdir(reportDir, { recursive: true });

    let reportData: any = {};
    let reportName = '';

    switch (reportType) {
      case 'daily_sales': {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const orders = await db.orders.find({
          createdAt: { $gte: startOfDay },
          paymentStatus: 'paid'
        }).toArray();

        const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        reportData = {
          date: startOfDay.toISOString().split('T')[0],
          totalOrders: orders.length,
          totalSales,
          averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0
        };
        reportName = `daily-sales-${reportData.date}.json`;
        break;
      }

      case 'weekly_sales': {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        
        const orders = await db.orders.find({
          createdAt: { $gte: startOfWeek },
          paymentStatus: 'paid'
        }).toArray();

        const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        reportData = {
          period: `${startOfWeek.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
          totalOrders: orders.length,
          totalSales,
          averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0
        };
        reportName = `weekly-sales-${new Date().toISOString().split('T')[0]}.json`;
        break;
      }

      case 'new_users': {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const users = await db.users.find({
          createdAt: { $gte: startOfDay }
        }).toArray();

        reportData = {
          date: startOfDay.toISOString().split('T')[0],
          totalNewUsers: users.length
        };
        reportName = `new-users-${reportData.date}.json`;
        break;
      }

      case 'best_sellers': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const topProducts = await db.orders.aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo },
              paymentStatus: 'paid'
            }
          },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              totalSold: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          },
          { $sort: { totalSold: -1 } },
          { $limit: 20 }
        ]).toArray();

        reportData = {
          period: 'Last 30 days',
          topProducts
        };
        reportName = `best-sellers-${new Date().toISOString().split('T')[0]}.json`;
        break;
      }

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Save report
    const reportPath = path.join(reportDir, reportName);
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    console.log(`📊 Report generated: ${reportName}`);

    return {
      success: true,
      message: `گزارش ${reportType} با موفقیت ایجاد شد`,
      details: {
        reportType,
        reportPath,
        reportData
      }
    };
  } catch (error: any) {
    console.error('Report generation task error:', error);
    return {
      success: false,
      message: `خطا در تولید گزارش: ${error.message}`,
      details: { error: error.message }
    };
  }
}
