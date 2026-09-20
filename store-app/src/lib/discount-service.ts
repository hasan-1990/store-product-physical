import { connectDB } from '@/lib/mongodb';
import { DiscountCode, DiscountValidationResult } from '@/types/discount';
import { ObjectId } from 'mongodb';

export class DiscountService {
  /**
   * اعتبارسنجی کد تخفیف برای سفارش
   */
  static async validateDiscountCode(
    code: string,
    userId: string,
    orderAmount: number,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): Promise<DiscountValidationResult> {
    try {
      const db = await connectDB();
      
      // پیدا کردن کد تخفیف
      const discountCode = await db.discountCodes.findOne({ 
        code: code.toUpperCase(),
        isActive: true 
      });

      if (!discountCode) {
        return {
          isValid: false,
          error: 'کد تخفیف یافت نشد یا غیرفعال است'
        };
      }

      const now = new Date();
      
      // بررسی تاریخ اعتبار
      if (now < discountCode.validFrom) {
        return {
          isValid: false,
          error: 'کد تخفیف هنوز فعال نشده است'
        };
      }

      if (now > discountCode.validUntil) {
        return {
          isValid: false,
          error: 'کد تخفیف منقضی شده است'
        };
      }

      // بررسی حداقل مبلغ سفارش
      if (discountCode.minOrderAmount && orderAmount < discountCode.minOrderAmount) {
        return {
          isValid: false,
          error: `حداقل مبلغ سفارش برای این کد تخفیف ${discountCode.minOrderAmount.toLocaleString()} تومان است`
        };
      }

      // بررسی محدودیت تعداد استفاده کل
      if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
        return {
          isValid: false,
          error: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است'
        };
      }

      // بررسی محدودیت استفاده هر کاربر
      if (discountCode.usageLimitPerUser) {
        const userUsageCount = await db.discountUsages.countDocuments({
          discountCodeId: discountCode._id.toString(),
          userId: userId
        });

        if (userUsageCount >= discountCode.usageLimitPerUser) {
          return {
            isValid: false,
            error: 'شما قبلاً از حداکثر تعداد مجاز این کد تخفیف استفاده کرده‌اید'
          };
        }
      }

      // بررسی کاربران تازه
      if (discountCode.firstTimeUserOnly) {
        const userOrdersCount = await db.orders.countDocuments({ userId: userId });
        if (userOrdersCount > 0) {
          return {
            isValid: false,
            error: 'این کد تخفیف فقط برای اولین خرید کاربران جدید قابل استفاده است'
          };
        }
      }

      // بررسی محصولات قابل اعمال
      if (discountCode.applicableProducts && discountCode.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(productId => 
          discountCode.applicableProducts?.includes(productId)
        );
        if (!hasApplicableProduct) {
          return {
            isValid: false,
            error: 'این کد تخفیف برای محصولات انتخابی شما قابل استفاده نیست'
          };
        }
      }

      // بررسی دسته‌بندی‌های قابل اعمال
      if (discountCode.applicableCategories && discountCode.applicableCategories.length > 0) {
        const hasApplicableCategory = categoryIds.some(categoryId => 
          discountCode.applicableCategories?.includes(categoryId)
        );
        if (!hasApplicableCategory) {
          return {
            isValid: false,
            error: 'این کد تخفیف برای دسته‌بندی محصولات انتخابی شما قابل استفاده نیست'
          };
        }
      }

      // بررسی محصولات مستثنی
      if (discountCode.excludedProducts && discountCode.excludedProducts.length > 0) {
        const hasExcludedProduct = productIds.some(productId => 
          discountCode.excludedProducts?.includes(productId)
        );
        if (hasExcludedProduct) {
          return {
            isValid: false,
            error: 'برخی از محصولات سبد خرید شما از این کد تخفیف مستثنی هستند'
          };
        }
      }

      // بررسی دسته‌بندی‌های مستثنی
      if (discountCode.excludedCategories && discountCode.excludedCategories.length > 0) {
        const hasExcludedCategory = categoryIds.some(categoryId => 
          discountCode.excludedCategories?.includes(categoryId)
        );
        if (hasExcludedCategory) {
          return {
            isValid: false,
            error: 'برخی از دسته‌بندی‌های محصولات سبد خرید شما از این کد تخفیف مستثنی هستند'
          };
        }
      }

      // محاسبه مبلغ تخفیف
      let discountAmount = 0;
      if (discountCode.type === 'percentage') {
        discountAmount = (orderAmount * discountCode.value) / 100;
        // اعمال حداکثر مبلغ تخفیف در صورت وجود
        if (discountCode.maxDiscountAmount && discountAmount > discountCode.maxDiscountAmount) {
          discountAmount = discountCode.maxDiscountAmount;
        }
      } else {
        discountAmount = discountCode.value;
        // اطمینان از اینکه تخفیف از مبلغ سفارش بیشتر نباشد
        if (discountAmount > orderAmount) {
          discountAmount = orderAmount;
        }
      }

      const finalAmount = orderAmount - discountAmount;

      return {
        isValid: true,
        discountAmount,
        finalAmount,
        discountCode: discountCode as unknown as DiscountCode
      };

    } catch (error) {
      console.error('Error validating discount code:', error);
      return {
        isValid: false,
        error: 'خطا در اعتبارسنجی کد تخفیف'
      };
    }
  }

  /**
   * ثبت استفاده از کد تخفیف
   */
  static async recordDiscountUsage(
    discountCodeId: string,
    discountCode: string,
    userId: string,
    orderId: string,
    discountAmount: number,
    orderAmount: number
  ): Promise<boolean> {
    try {
      const db = await connectDB();

      // ثبت استفاده
      const discountUsage: any = {
        discountCodeId,
        discountCode,
        userId,
        orderId,
        discountAmount,
        orderAmount,
        usedAt: new Date()
      };

      await db.discountUsages.insertOne(discountUsage);

      // به‌روزرسانی تعداد استفاده در کد تخفیف
      await db.discountCodes.updateOne(
        { _id: new ObjectId(discountCodeId) },
        { $inc: { usedCount: 1 } }
      );

      return true;
    } catch (error) {
      console.error('Error recording discount usage:', error);
      return false;
    }
  }

  /**
   * تولید کد تخفیف یکتا
   */
  static async generateUniqueCode(length: number = 8): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // بررسی یکتا بودن
    try {
      const db = await connectDB();
      const existing = await db.discountCodes.findOne({ code: result });
      
      if (existing) {
        // اگر کد تکراری بود، دوباره تولید کن
        return this.generateUniqueCode(length);
      }
      
      return result;
    } catch (error) {
      console.error('Error checking code uniqueness:', error);
      return result;
    }
  }

  /**
   * تولید کد تخفیف برای سفارش خاص
   */
  static async createOrderSpecificCode(
    userId: string,
    orderAmount: number,
    discountPercentage: number = 10,
    validityDays: number = 30
  ): Promise<string | null> {
    try {
      const db = await connectDB();
      const code = await this.generateUniqueCode();
      
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      const discountCode: any = {
        code,
        type: 'percentage',
        value: discountPercentage,
        usageLimit: 1,
        usageLimitPerUser: 1,
        usedCount: 0,
        validFrom,
        validUntil,
        isActive: true,
        description: `کد تخفیف ویژه برای سفارش کاربر ${userId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      };

      await db.discountCodes.insertOne(discountCode);
      return code;
    } catch (error) {
      console.error('Error creating order specific discount code:', error);
      return null;
    }
  }

  /**
   * بررسی انقضای کدهای تخفیف و غیرفعال کردن آنها
   */
  static async deactivateExpiredCodes(): Promise<number> {
    try {
      const db = await connectDB();
      const now = new Date();

      const result = await db.discountCodes.updateMany(
        { 
          validUntil: { $lt: now },
          isActive: true 
        },
        { 
          $set: { 
            isActive: false,
            updatedAt: now
          } 
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error deactivating expired codes:', error);
      return 0;
    }
  }

  /**
   * بررسی کدهای تخفیف نزدیک به انقضا
   */
  static async getExpiringCodes(daysBeforeExpiry: number = 7): Promise<DiscountCode[]> {
    try {
      const db = await connectDB();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

      const expiringCodes = await db.discountCodes.find({
        validUntil: { 
          $gte: new Date(),
          $lte: futureDate 
        },
        isActive: true
      }).toArray();

      return expiringCodes as unknown as DiscountCode[];
    } catch (error) {
      console.error('Error getting expiring codes:', error);
      return [];
    }
  }
}