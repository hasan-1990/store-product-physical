/**
 * Zibal Error Messages
 * مستندات: https://help.zibal.ir/platform/#result-table
 */

export interface ZibalStatusMessage {
  code: number;
  message: string;
  description: string;
  isSuccess: boolean;
}

/**
 * کدهای نتیجه Zibal
 */
export const ZibalStatusMessages: Record<number, ZibalStatusMessage> = {
  // موفقیت
  1: {
    code: 1,
    message: 'موفق',
    description: 'عملیات با موفقیت انجام شد',
    isSuccess: true
  },

  // خطاهای عمومی
  2: {
    code: 2,
    message: 'خطای احراز هویت',
    description: 'API Key به درستی ارسال نشده است',
    isSuccess: false
  },
  3: {
    code: 3,
    message: 'کلید API نامعتبر',
    description: 'API Key صحیح نیست',
    isSuccess: false
  },
  4: {
    code: 4,
    message: 'عدم دسترسی',
    description: 'اجازه دسترسی به این سرویس صادر نشده‌است',
    isSuccess: false
  },
  5: {
    code: 5,
    message: 'آدرس بازگشت نامعتبر',
    description: 'callbackUrl نامعتبر است',
    isSuccess: false
  },
  6: {
    code: 6,
    message: 'ورودی نامعتبر',
    description: 'مقدار ورودی نامعتبر است',
    isSuccess: false
  },
  7: {
    code: 7,
    message: 'IP نامعتبر',
    description: 'IP ارسال‌کننده درخواست نامعتبر می‌باشد',
    isSuccess: false
  },
  8: {
    code: 8,
    message: 'کلید API غیرفعال',
    description: 'API Key غیرفعال است',
    isSuccess: false
  },
  9: {
    code: 9,
    message: 'مبلغ کمتر از حد مجاز',
    description: 'حداقل مبلغ باید 1000 ریال باشد',
    isSuccess: false
  },

  // خطاهای کیف پول
  10: {
    code: 10,
    message: 'کیف پول یافت نشد',
    description: 'کیف پول انتخاب شده وجود ندارد',
    isSuccess: false
  },
  11: {
    code: 11,
    message: 'موجودی ناکافی',
    description: 'مبلغ درخواستی از موجودی کیف پول بیشتر است',
    isSuccess: false
  },
  12: {
    code: 12,
    message: 'مبلغ تسویه کم',
    description: 'حداقل مبلغ تسویه 10000 ریال است',
    isSuccess: false
  },

  // خطاهای ذی‌نفع
  20: {
    code: 20,
    message: 'نام وارد نشده',
    description: 'نام وارد نشده‌است',
    isSuccess: false
  },
  21: {
    code: 21,
    message: 'شماره شبا نامعتبر',
    description: 'شماره شبای وارد شده معتبر نیست (26 کاراکتر و شروع با IR و بدون خط تیره (-) و فاصله)',
    isSuccess: false
  },
  22: {
    code: 22,
    message: 'ذی‌نفع تکراری',
    description: 'ذی‌نفع قبلا ثبت شده است',
    isSuccess: false
  },
  23: {
    code: 23,
    message: 'ذی‌نفع نامعتبر',
    description: 'ذی‌نفع نامعتبر است',
    isSuccess: false
  },
  24: {
    code: 24,
    message: 'ذی‌نفع غیرفعال',
    description: 'ذی‌نفع غیرفعال است',
    isSuccess: false
  },

  // خطاهای استرداد
  100: {
    code: 100,
    message: 'تراکنش موفق',
    description: 'تراکنش با موفقیت انجام شد',
    isSuccess: true
  },
  102: {
    code: 102,
    message: 'تراکنش یافت نشد',
    description: 'تراکنشی با این مشخصات یافت نشد',
    isSuccess: false
  },
  103: {
    code: 103,
    message: 'کیف پول مرچنت یافت نشد',
    description: 'merchant یافت نشد',
    isSuccess: false
  },
  104: {
    code: 104,
    message: 'مبلغ بیش از حد مجاز',
    description: 'مبلغ بیش از حد مجاز پذیرنده است',
    isSuccess: false
  },
  105: {
    code: 105,
    message: 'شناسه یافت نشد',
    description: 'trackId یافت نشد',
    isSuccess: false
  },
  106: {
    code: 106,
    message: 'مبلغ تسهیم صحیح نیست',
    description: 'مبلغ تسهیم درست نیست',
    isSuccess: false
  },
  113: {
    code: 113,
    message: 'مبلغ کمتر از حد مجاز',
    description: 'مبلغ کمتر از حد مجاز پذیرنده است',
    isSuccess: false
  },

  // وضعیت‌های تراکنش
  201: {
    code: 201,
    message: 'قبلا تایید شده',
    description: 'قبلا تایید شده',
    isSuccess: false
  },
  202: {
    code: 202,
    message: 'سفارش پرداخت نشده یا ناموفق بوده است',
    description: 'سفارش پرداخت نشده یا ناموفق بوده است',
    isSuccess: false
  },
  203: {
    code: 203,
    message: 'trackId نامعتبر می‌باشد',
    description: 'trackId نامعتبر می‌باشد',
    isSuccess: false
  },

  // پیش‌فرض برای کدهای ناشناخته
  0: {
    code: 0,
    message: 'خطای نامشخص',
    description: 'خطای نامشخص رخ داده است',
    isSuccess: false
  }
};

/**
 * دریافت پیام وضعیت بر اساس کد
 */
export function getStatusMessage(code: number): ZibalStatusMessage {
  return ZibalStatusMessages[code] || ZibalStatusMessages[0];
}

/**
 * بررسی موفقیت تراکنش
 */
export function isSuccessful(code: number): boolean {
  const status = getStatusMessage(code);
  return status.isSuccess;
}
