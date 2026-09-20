// Types for discount code system
export interface DiscountCode {
  _id?: string;
  id?: string;
  code: string; // کد تخفیف
  type: 'percentage' | 'fixed'; // نوع تخفیف: درصدی یا مبلغ ثابت
  value: number; // مقدار تخفیف
  minOrderAmount?: number; // حداقل مبلغ سفارش
  maxDiscountAmount?: number; // حداکثر مبلغ تخفیف (برای درصدی)
  usageLimit?: number; // محدودیت تعداد استفاده کل
  usageLimitPerUser?: number; // محدودیت تعداد استفاده هر کاربر
  usedCount: number; // تعداد استفاده شده
  validFrom: Date; // تاریخ شروع اعتبار
  validUntil: Date; // تاریخ پایان اعتبار
  isActive: boolean; // وضعیت فعال/غیرفعال
  applicableProducts?: string[]; // محصولات قابل اعمال (اختیاری)
  applicableCategories?: string[]; // دسته‌بندی‌های قابل اعمال (اختیاری)
  excludedProducts?: string[]; // محصولات مستثنی
  excludedCategories?: string[]; // دسته‌بندی‌های مستثنی
  firstTimeUserOnly?: boolean; // فقط برای کاربران تازه
  description?: string; // توضیحات
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // شناسه کاربر ایجادکننده
}

export interface DiscountUsage {
  _id?: string;
  id?: string;
  discountCodeId: string;
  discountCode: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  orderAmount: number;
  usedAt: Date;
}

export interface DiscountValidationResult {
  isValid: boolean;
  error?: string;
  discountAmount?: number;
  finalAmount?: number;
  discountCode?: DiscountCode;
}

export interface DiscountStats {
  totalCodes: number;
  activeCodes: number;
  expiredCodes: number;
  totalUsage: number;
  totalDiscountGiven: number;
  topCodes: Array<{
    code: string;
    usageCount: number;
    discountGiven: number;
  }>;
  recentUsage: Array<{
    code: string;
    orderId: string;
    amount: number;
    usedAt: Date;
  }>;
}

export interface CreateDiscountRequest {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  validFrom: string; // ISO date string
  validUntil: string; // ISO date string
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
  firstTimeUserOnly?: boolean;
  description?: string;
}

export interface UpdateDiscountRequest extends Partial<CreateDiscountRequest> {
  id: string;
}

export interface DiscountFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
  excludedCategories: string[];
  firstTimeUserOnly: boolean;
  description: string;
}

export interface DiscountFilters {
  search?: string;
  type?: 'percentage' | 'fixed' | 'all';
  status?: 'active' | 'inactive' | 'expired' | 'all';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'code' | 'value' | 'usedCount' | 'createdAt' | 'validUntil';
  sortOrder?: 'asc' | 'desc';
}