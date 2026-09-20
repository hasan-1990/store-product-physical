// Types for Cron Job System

export type CronTaskType = 
  | 'abandoned_cart'
  | 'order_management'
  | 'database_backup'
  | 'email_queue'
  | 'ticket_cleanup'
  | 'discount_management'
  | 'report_generation'
  | 'cache_cleanup'
  | 'user_cleanup'
  | 'licensed_files_cleanup'
  | 'site_dns_check'
  | 'custom';

export type CronStatus = 'active' | 'paused' | 'error' | 'running';

export type CronPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CronLog {
  _id?: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

export interface CronJob {
  _id?: string;
  name: string;
  description: string;
  taskType: CronTaskType;
  schedule: string; // Cron expression: "*/5 * * * *"
  enabled: boolean;
  status: CronStatus;
  priority: CronPriority;
  
  // Task specific configuration
  config?: {
    emailTemplate?: string;
    targetUsers?: string;
    backupPath?: string;
    retentionDays?: number;
    [key: string]: any;
  };
  
  // Statistics
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  failCount: number;
  averageDuration?: number;
  
  // Logs
  logs: CronLog[];
  maxLogs?: number; // Default 100
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronSchedulePreset {
  label: string;
  value: string;
  description: string;
}

export const CRON_PRESETS: CronSchedulePreset[] = [
  { label: 'هر دقیقه', value: '* * * * *', description: 'هر دقیقه اجرا می‌شود' },
  { label: 'هر 5 دقیقه', value: '*/5 * * * *', description: 'هر 5 دقیقه یکبار' },
  { label: 'هر 15 دقیقه', value: '*/15 * * * *', description: 'هر 15 دقیقه یکبار' },
  { label: 'هر 30 دقیقه', value: '*/30 * * * *', description: 'هر 30 دقیقه یکبار' },
  { label: 'هر ساعت', value: '0 * * * *', description: 'ابتدای هر ساعت' },
  { label: 'هر 6 ساعت', value: '0 */6 * * *', description: 'هر 6 ساعت یکبار' },
  { label: 'روزانه (نیمه شب)', value: '0 0 * * *', description: 'هر روز ساعت 00:00' },
  { label: 'روزانه (صبح)', value: '0 6 * * *', description: 'هر روز ساعت 06:00' },
  { label: 'روزانه (ظهر)', value: '0 12 * * *', description: 'هر روز ساعت 12:00' },
  { label: 'روزانه (عصر)', value: '0 18 * * *', description: 'هر روز ساعت 18:00' },
  { label: 'هفتگی (شنبه)', value: '0 0 * * 6', description: 'هر شنبه ساعت 00:00' },
  { label: 'ماهانه', value: '0 0 1 * *', description: 'اول هر ماه ساعت 00:00' },
];

export interface CronTaskTemplate {
  taskType: CronTaskType;
  name: string;
  description: string;
  icon: string;
  defaultSchedule: string;
  configFields?: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    options?: { label: string; value: string }[];
    defaultValue?: any;
  }[];
}

export const CRON_TASK_TEMPLATES: CronTaskTemplate[] = [
  {
    taskType: 'abandoned_cart',
    name: 'یادآوری سبد خرید رها شده',
    description: 'ارسال ایمیل یادآوری به کاربرانی که سبد خریدشان را رها کرده‌اند',
    icon: '🛒',
    defaultSchedule: '*/30 * * * *',
    configFields: [
      {
        name: 'minMinutes',
        label: 'حداقل زمان رها شدن (دقیقه)',
        type: 'number',
        defaultValue: 30
      },
      {
        name: 'discountCode',
        label: 'کد تخفیف تشویقی',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    taskType: 'order_management',
    name: 'مدیریت خودکار سفارشات',
    description: 'کنسل کردن سفارشات پرداخت نشده و تایید خودکار سفارشات تحویل شده',
    icon: '📦',
    defaultSchedule: '0 * * * *',
    configFields: [
      {
        name: 'cancelAfterHours',
        label: 'کنسل بعد از (ساعت)',
        type: 'number',
        defaultValue: 24
      },
      {
        name: 'completeAfterDays',
        label: 'تکمیل خودکار بعد از (روز)',
        type: 'number',
        defaultValue: 7
      }
    ]
  },
  {
    taskType: 'database_backup',
    name: 'بک‌آپ دیتابیس',
    description: 'بک‌آپ خودکار از دیتابیس MongoDB',
    icon: '🗄️',
    defaultSchedule: '0 2 * * *',
    configFields: [
      {
        name: 'retentionDays',
        label: 'نگهداری بک‌آپ (روز)',
        type: 'number',
        defaultValue: 30
      },
      {
        name: 'compressionLevel',
        label: 'سطح فشرده‌سازی',
        type: 'select',
        options: [
          { label: 'کم', value: 'low' },
          { label: 'متوسط', value: 'medium' },
          { label: 'زیاد', value: 'high' }
        ],
        defaultValue: 'medium'
      }
    ]
  },
  {
    taskType: 'email_queue',
    name: 'ارسال ایمیل‌های صف',
    description: 'پردازش و ارسال ایمیل‌های در انتظار',
    icon: '📧',
    defaultSchedule: '*/5 * * * *'
  },
  {
    taskType: 'ticket_cleanup',
    name: 'پاکسازی تیکت‌ها',
    description: 'بستن خودکار تیکت‌های حل شده و قدیمی',
    icon: '🎫',
    defaultSchedule: '0 3 * * *',
    configFields: [
      {
        name: 'closeAfterDays',
        label: 'بستن تیکت‌های بدون پاسخ بعد از (روز)',
        type: 'number',
        defaultValue: 3
      }
    ]
  },
  {
    taskType: 'discount_management',
    name: 'مدیریت تخفیف‌ها',
    description: 'فعال/غیرفعال کردن خودکار کدهای تخفیف بر اساس تاریخ',
    icon: '💰',
    defaultSchedule: '0 0 * * *'
  },
  {
    taskType: 'report_generation',
    name: 'تولید گزارش',
    description: 'تولید گزارش‌های فروش، کاربران و محصولات',
    icon: '📊',
    defaultSchedule: '0 1 * * *',
    configFields: [
      {
        name: 'reportType',
        label: 'نوع گزارش',
        type: 'select',
        options: [
          { label: 'فروش روزانه', value: 'daily_sales' },
          { label: 'فروش هفتگی', value: 'weekly_sales' },
          { label: 'فروش ماهانه', value: 'monthly_sales' },
          { label: 'کاربران جدید', value: 'new_users' },
          { label: 'محصولات پرفروش', value: 'best_sellers' }
        ],
        defaultValue: 'daily_sales'
      }
    ]
  },
  {
    taskType: 'cache_cleanup',
    name: 'پاکسازی کش',
    description: 'پاک کردن کش، فایل‌های موقت و session‌های منقضی شده',
    icon: '🧹',
    defaultSchedule: '0 4 * * *'
  },
  {
    taskType: 'licensed_files_cleanup',
    name: 'پاکسازی فایل‌های لایسنس موقت',
    description: 'حذف خودکار فایل‌های دانلود شده بعد از 5 دقیقه',
    icon: '🗑️',
    defaultSchedule: '*/1 * * * *'
  },
  {
    taskType: 'site_dns_check',
    name: 'بررسی DNS سایت‌های مشتری',
    description: 'چک DNS دامنه‌های ثبت‌شده و فعال‌سازی سایت پس از تأیید',
    icon: '🌐',
    defaultSchedule: '*/5 * * * *'
  },
  {
    taskType: 'user_cleanup',
    name: 'پاکسازی کاربران',
    description: 'حذف اکانت‌های تایید نشده و غیرفعال',
    icon: '👤',
    defaultSchedule: '0 5 * * 0',
    configFields: [
      {
        name: 'deleteUnverifiedAfterDays',
        label: 'حذف اکانت‌های تایید نشده بعد از (روز)',
        type: 'number',
        defaultValue: 7
      },
      {
        name: 'deactivateInactiveAfterMonths',
        label: 'غیرفعال کردن کاربران غیرفعال بعد از (ماه)',
        type: 'number',
        defaultValue: 6
      }
    ]
  },
  {
    taskType: 'custom',
    name: 'کار سفارشی',
    description: 'تعریف یک کار سفارشی با تنظیمات دلخواه',
    icon: '⚙️',
    defaultSchedule: '0 * * * *',
    configFields: [
      {
        name: 'customCode',
        label: 'کد سفارشی (JavaScript)',
        type: 'textarea',
        defaultValue: '// کد خود را اینجا بنویسید\nconsole.log("Custom task executed");'
      }
    ]
  }
];
