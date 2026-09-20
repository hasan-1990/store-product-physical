import { NextRequest, NextResponse } from 'next/server';
import { connectDB, mongodb } from '@/lib/mongodb';
import { readFile, stat, writeFile, mkdir, open } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import AdmZip from 'adm-zip';
import { createHash, randomBytes } from 'crypto';
import {
  generateMultiLayerProtectionFiles,
  generateProtectionDocumentation,
  type LicenseData
} from '@/lib/license-protection-system';
import { DuplicatorBackupLocker } from '@/lib/duplicator-locker';

/**
 * Parse Range header and return start/end bytes
 */
function parseRangeHeader(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  
  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
    return null;
  }
  
  return { start, end };
}

/**
 * ارسال فایل با پشتیبانی Range برای IDM
 */
async function sendFileWithRangeSupport(
  filePath: string,
  fileName: string,
  rangeHeader: string | null,
  extraHeaders: Record<string, string> = {}
): Promise<NextResponse> {
  const fileStat = await stat(filePath);
  const fileSize = fileStat.size;
  
  // پردازش Range request
  if (rangeHeader) {
    const range = parseRangeHeader(rangeHeader, fileSize);
    
    if (range) {
      // ارسال بخشی از فایل (206 Partial Content)
      const { start, end } = range;
      const chunkSize = end - start + 1;
      
      const fileHandle = await open(filePath, 'r');
      const buffer = Buffer.allocUnsafe(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();
      
      const response = new NextResponse(buffer as any, { status: 206 });
      
      response.headers.set('Content-Type', 'application/octet-stream');
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      response.headers.set('Content-Length', chunkSize.toString());
      response.headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      response.headers.set('Accept-Ranges', 'bytes');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      for (const [key, value] of Object.entries(extraHeaders)) {
        response.headers.set(key, value);
      }
      
      return response;
    }
  }
  
  // اگر Range header نداشته باشیم، کل فایل رو بفرست
  const fileBuffer = await readFile(filePath);
  const response = new NextResponse(fileBuffer as any);
  
  response.headers.set('Content-Type', 'application/octet-stream');
  response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
  response.headers.set('Content-Length', fileSize.toString());
  response.headers.set('Accept-Ranges', 'bytes');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  for (const [key, value] of Object.entries(extraHeaders)) {
    response.headers.set(key, value);
  }
  
  return response;
}

function buildLicenseFunctionKey(licenseKey: string): string {
  const sanitized = licenseKey.replace(/[^a-zA-Z0-9]/g, '_');
  const base = `lk_${sanitized}`.replace(/_+/g, '_');
  return /^[a-zA-Z]/.test(base) ? base : `lk_${base}`;
}

/**
 * تولید کد PHP بررسی لایسنس با هش و رمزنگاری
 */
function generateLicenseCheckerCode(licenseKey: string, domain: string, productName: string): string {
  const functionKey = buildLicenseFunctionKey(licenseKey);
  
  // تولید salt تصادفی برای هش
  const salt = randomBytes(16).toString('hex');
  const normalizedDomain = domain.trim().toLowerCase();
  const domainHash = createHash('sha256').update(`${normalizedDomain}${salt}`).digest('hex');
  
  // رمزنگاری اطلاعات به hex
  const domainHex = Buffer.from(domain, 'utf8').toString('hex');
  const productHex = Buffer.from(productName, 'utf8').toString('hex');
  const licenseHex = Buffer.from(licenseKey, 'utf8').toString('hex');
  
  return `<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('wpstore_hex_decode_${functionKey}')) {
    function wpstore_hex_decode_${functionKey}(\$hex) {
        if (!is_string(\$hex) || \$hex === '') {
            return '';
        }
        if (!preg_match('/^[0-9a-f]+$/i', \$hex)) {
            return '';
        }
        \$decoded = @pack('H*', \$hex);
        return \$decoded === false ? '' : \$decoded;
    }
}

if (!function_exists('wpstore_normalize_domain_${functionKey}')) {
    function wpstore_normalize_domain_${functionKey}(\$domain) {
        \$domain = strtolower(trim((string) \$domain));
        if (\$domain === '') {
            return '';
        }
        \$domain = preg_replace('/^https?:\\/\\//', '', \$domain);
        \$domain = preg_replace('/^www\\./', '', \$domain);
        \$parts = explode(':', \$domain);
        return trim(\$parts[0]);
    }
}

if (!function_exists('wpstore_hash_equals_${functionKey}')) {
    function wpstore_hash_equals_${functionKey}(\$known, \$user) {
        if (function_exists('hash_equals')) {
            return hash_equals((string) \$known, (string) \$user);
        }
        \$known = (string) \$known;
        \$user = (string) \$user;
        if (strlen(\$known) !== strlen(\$user)) {
            return false;
        }
        \$res = 0;
        \$len = strlen(\$known);
        for (\$i = 0; \$i < \$len; \$i++) {
            \$res |= ord(\$known[\$i]) ^ ord(\$user[\$i]);
        }
        return \$res === 0;
    }
}

if (!function_exists('wpstore_license_guard_${functionKey}')) {
    function wpstore_license_guard_${functionKey}(\$plugin_file) {
        \$salt = '${salt}';
        \$allowed_hash = '${domainHash}';
        \$encoded_domain = '${domainHex}';
        \$encoded_product = '${productHex}';
        \$encoded_license = '${licenseHex}';

        \$allowed_domain_raw = wpstore_hex_decode_${functionKey}(\$encoded_domain);
        \$allowed_domain = wpstore_normalize_domain_${functionKey}(\$allowed_domain_raw);

        if (\$allowed_domain === '') {
            return;
        }

        \$compute_hash = function(\$domain) use (\$salt) {
            if (\$domain === '') {
                return '';
            }
            return hash('sha256', \$domain . \$salt);
        };

        register_activation_hook(\$plugin_file, function() use (\$allowed_hash, \$allowed_domain, \$allowed_domain_raw, \$encoded_product, \$encoded_license, \$compute_hash, \$plugin_file) {
            \$current_host = isset(\$_SERVER['HTTP_HOST']) ? \$_SERVER['HTTP_HOST'] : '';
            if (\$current_host === '') {
                \$fallback = parse_url(home_url(), PHP_URL_HOST);
                \$current_host = \$fallback !== false ? \$fallback : '';
            }

            \$current = wpstore_normalize_domain_${functionKey}(\$current_host);
            \$current_hash = \$compute_hash(\$current);

            if (\$current === '' || \$current_hash === '' || !wpstore_hash_equals_${functionKey}(\$allowed_hash, \$current_hash)) {
                deactivate_plugins(plugin_basename(\$plugin_file));

                \$allowed_display = \$allowed_domain !== '' ? \$allowed_domain : \$allowed_domain_raw;
                \$current_display = \$current !== '' ? \$current : __('نامشخص', 'default');
                \$product_name = wpstore_hex_decode_${functionKey}(\$encoded_product);
                \$license_key = wpstore_hex_decode_${functionKey}(\$encoded_license);

                \$message  = '<div style="direction:rtl;text-align:right;font-family:tahoma;">';
                \$message .= '<h2 style="color:#dc3232;margin-top:0;">⛔ خطای لایسنس دامنه</h2>';
                \$message .= '<p><strong>محصول:</strong> <code>' . esc_html(\$product_name) . '</code></p>';
                \$message .= '<p><strong>کد لایسنس:</strong> <code>' . esc_html(\$license_key) . '</code></p>';
                \$message .= '<p>این افزونه فقط برای دامنه <code>' . esc_html(\$allowed_display) . '</code> فعال می‌شود.</p>';
                \$message .= '<p>دامنه فعلی: <code>' . esc_html(\$current_display) . '</code></p>';
                \$message .= '<p>برای فعال‌سازی، دامنه سایت باید با دامنه لایسنس هماهنگ باشد.</p>';
                \$message .= '</div>';

                wp_die(\$message, __('خطای لایسنس افزونه', 'default'), array('back_link' => true));
            }
        });

        add_action('admin_notices', function() use (\$allowed_hash, \$allowed_domain, \$allowed_domain_raw, \$encoded_product, \$encoded_license, \$compute_hash) {
            \$current = isset(\$_SERVER['HTTP_HOST']) ? \$_SERVER['HTTP_HOST'] : '';
            \$current = wpstore_normalize_domain_${functionKey}(\$current);
            \$current_hash = \$compute_hash(\$current);

            if (\$current === '' || \$current_hash === '' || wpstore_hash_equals_${functionKey}(\$allowed_hash, \$current_hash)) {
                return;
            }

            \$allowed_display = \$allowed_domain !== '' ? \$allowed_domain : \$allowed_domain_raw;
            \$current_display = \$current !== '' ? \$current : __('نامشخص', 'default');
            \$product_name = wpstore_hex_decode_${functionKey}(\$encoded_product);
            \$license_key = wpstore_hex_decode_${functionKey}(\$encoded_license);

            echo '<div class="notice notice-warning is-dismissible" style="padding:15px;border-right:4px solid #ff9800;direction:rtl;text-align:right;">';
            echo '<h3 style="margin:0 0 10px 0;">⚠️ دامنه این افزونه هماهنگ نیست</h3>';
            echo '<p style="margin:5px 0;"><strong>محصول:</strong> <code style="background:#eef;padding:3px 8px;">' . esc_html(\$product_name) . '</code></p>';
            echo '<p style="margin:5px 0;"><strong>کد لایسنس:</strong> <code style="background:#eef;padding:3px 8px;">' . esc_html(\$license_key) . '</code></p>';
            echo '<p style="margin:5px 0;"><strong>دامنه مجاز:</strong> <code style="background:#e7f7ff;padding:3px 8px;">' . esc_html(\$allowed_display) . '</code></p>';
            echo '<p style="margin:5px 0;"><strong>دامنه فعلی:</strong> <code style="background:#fff3cd;padding:3px 8px;">' . esc_html(\$current_display) . '</code></p>';
            echo '<p style="margin:10px 0 0 0;color:#856404;">برای فعال شدن کامل، افزونه باید روی دامنه مجاز نصب شود.</p>';
            echo '</div>';
        });
    }
}

?>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseKey = searchParams.get('licenseKey');
    const productId = searchParams.get('productId');

    if (!licenseKey || !productId) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات کامل ارسال نشده است' },
        { status: 400 }
      );
    }

  await connectDB();
  const db = mongodb;
    
    // تبدیل productId به ObjectId
    let productObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'شناسه محصول نامعتبر است' },
        { status: 400 }
      );
    }

    // بررسی لایسنس (بدون userId چون از licenseKey استفاده می‌کنیم)
    const license = await db.licenses.findOne({
      licenseKey,
      productId: productObjectId,
      isActive: true
    });

    if (!license) {
      return NextResponse.json(
        { success: false, error: 'لایسنس معتبر یافت نشد' },
        { status: 403 }
      );
    }

    // بررسی انقضا
    if (license.expiresAt && new Date() > new Date(license.expiresAt)) {
      return NextResponse.json(
        { success: false, error: 'لایسنس منقضی شده است' },
        { status: 403 }
      );
    }

    // دریافت اطلاعات محصول
    const product = await db.products.findOne({ _id: productObjectId });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'محصول یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی نوع محصول
    if (product.productType !== 'DIGITAL') {
      return NextResponse.json(
        { success: false, error: 'این محصول دیجیتال نیست' },
        { status: 400 }
      );
    }

    // دریافت URL فایل
    const fileUrl = product.downloadUrl || product.originalFileUrl || product.fileUrl;
    
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'فایل محصول تعریف نشده است' },
        { status: 404 }
      );
    }

    // مسیر فایل
    let filePath = '';
    
    if (fileUrl.startsWith('/')) {
      // مسیر نسبی
      filePath = path.join(process.cwd(), 'public', fileUrl);
    } else if (fileUrl.startsWith('http')) {
      // URL کامل - برای آینده
      return NextResponse.json(
        { success: false, error: 'دانلود از URL خارجی پشتیبانی نمی‌شود' },
        { status: 400 }
      );
    } else {
      // مسیر مطلق
      filePath = fileUrl;
    }

    // بررسی وجود فایل
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل محصول یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی محدودیت دانلود
    const usageCount = license.usageCount || license.downloads || 0;
    if (product.downloadLimit && usageCount >= product.downloadLimit) {
      return NextResponse.json(
        { success: false, error: 'تعداد دانلود مجاز به پایان رسیده است' },
        { status: 403 }
      );
    }

    // اگر فایل لایسنس‌دار کش شده وجود دارد، از آن استفاده کن
    if (license.licensedFilePath && existsSync(license.licensedFilePath)) {
      try {
        const fileName = path.basename(license.licensedFilePath);
        
        // به‌روزرسانی آمار دانلود
        await db.licenses.updateOne(
          { _id: license._id },
          { 
            $inc: { usageCount: 1 },
            $set: { lastUsed: new Date() }
          }
        );

        // ارسال فایل با پشتیبانی Range
        const rangeHeader = request.headers.get('range');
        return await sendFileWithRangeSupport(
          license.licensedFilePath,
          fileName,
          rangeHeader,
          {
            'X-Download-Count': (usageCount + 1).toString(),
            'X-Cached-File': 'true'
          }
        );
      } catch (cacheError) {
        console.error('خطا در خواندن فایل کش شده:', cacheError);
        // در صورت خطا، ادامه بده و فایل جدید بساز
      }
    }

    // ایجاد فایل لایسنس‌دار جدید
    const licensedDir = path.join(process.cwd(), 'licensed-files');
    if (!existsSync(licensedDir)) {
      await mkdir(licensedDir, { recursive: true });
    }

    const ext = path.extname(filePath).toLowerCase();
    const safeProductName = product.name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const licensedFileName = `${safeProductName}_${licenseKey}${ext}`;
    const licensedFilePath = path.join(licensedDir, licensedFileName);

    let fileBuffer: Buffer;

    if (ext === '.zip') {
      // 🔒🔒🔒 بررسی اینکه آیا این یک بکاپ Duplicator است
      const isDuplicatorBackup = DuplicatorBackupLocker.isDuplicatorBackup(filePath);
      
      if (isDuplicatorBackup) {
        // 🎯 قفل‌گذاری خودکار بکاپ Duplicator با دامنه
        console.log('🔒 Duplicator backup detected! Auto-locking with domain:', license.domain);
        
        const lockedDir = path.join(process.cwd(), 'licensed-files', 'duplicator-locked');
        const lockResult = await DuplicatorBackupLocker.lockBackup(
          filePath,
          license.domain,
          lockedDir
        );
        
        if (lockResult.success && lockResult.lockedFile) {
          // قفل‌گذاری موفق بود
          console.log('✅ Backup locked successfully:', {
            filename: lockResult.lockedFilename,
            domainHash: lockResult.domainHash,
            cached: lockResult.cached
          });
          
          // به‌روزرسانی لایسنس
          await db.licenses.updateOne(
            { _id: license._id },
            { 
              $inc: { usageCount: 1 },
              $set: { 
                lastUsed: new Date(),
                licensedFilePath: lockResult.lockedFile
              }
            }
          );
          
          const fileName = lockResult.lockedFilename!;
          const rangeHeader = request.headers.get('range');
          
          // ارسال فایل با پشتیبانی Range
          return await sendFileWithRangeSupport(
            lockResult.lockedFile,
            fileName,
            rangeHeader,
            {
              'X-Download-Count': (usageCount + 1).toString(),
              'X-Duplicator-Locked': 'true',
              'X-Domain-Hash': lockResult.domainHash!,
              'X-Cached-File': lockResult.cached ? 'true' : 'false'
            }
          );
        } else {
          // قفل‌گذاری ناموفق - ادامه با روش معمولی
          console.error('❌ Failed to lock Duplicator backup:', lockResult.message);
        }
      }
      
      // 🔒 برای فایل‌های ZIP معمولی (قالب/افزونه)، سیستم چند لایه حفاظت را تزریق کن
      const zip = new AdmZip(filePath);
      
      // پیدا کردن فایل اصلی افزونه/قالب
      const entries = zip.getEntries();
      let mainPluginFile: any = null;
      let pluginFolder = '';
      let isTheme = false;
      
      // جستجوی فایل اصلی PHP (افزونه یا قالب)
      for (const entry of entries) {
        const entryName = entry.entryName;
        
        // بررسی قالب (style.css با Theme Name:)
        if (entryName.endsWith('style.css') && !entry.isDirectory) {
          const content = entry.getData().toString('utf8');
          if (content.includes('Theme Name:')) {
            isTheme = true;
            // در قالب‌ها، فایل اصلی functions.php است
            const themeFolder = path.dirname(entryName);
            const functionsPath = themeFolder ? `${themeFolder}/functions.php` : 'functions.php';
            const functionsEntry = zip.getEntry(functionsPath);
            if (functionsEntry) {
              mainPluginFile = functionsEntry;
              pluginFolder = themeFolder ? `${themeFolder}/` : '';
            }
            break;
          }
        }
        
        // بررسی افزونه (فایل PHP با Plugin Name:)
        if (entryName.endsWith('.php') && !entry.isDirectory) {
          const content = entry.getData().toString('utf8');
          if (content.includes('Plugin Name:')) {
            mainPluginFile = entry;
            const parts = entryName.split('/');
            if (parts.length > 1) {
              pluginFolder = parts[0] + '/';
            }
            break;
          }
        }
      }
      
      if (mainPluginFile) {
        // 🎯 تولید تمام فایل‌های سیستم چند لایه
        const serverUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
        const licenseData: LicenseData = {
          licenseKey,
          domain: license.domain,
          productName: product.name,
          productId: productId,
          serverUrl,
          expiresAt: license.expiresAt
        };
        
        const protectionFiles = generateMultiLayerProtectionFiles(licenseData);
        const documentation = generateProtectionDocumentation(licenseData);
        
        // 1️⃣ اضافه کردن فایل‌های حفاظتی به ZIP
        const mainFileDir = path.dirname(mainPluginFile.entryName);
        const includesDir = mainFileDir ? `${mainFileDir}/includes` : 'includes';
        
        protectionFiles.forEach((content, relativePath) => {
          if (relativePath === 'MAIN_FILE_INJECTION.txt') {
            // این فایل برای تزریق به فایل اصلی است، نه اضافه کردن به ZIP
            return;
          }
          
          const fullPath = mainFileDir ? `${mainFileDir}/${relativePath}` : relativePath;
          zip.addFile(fullPath, Buffer.from(content, 'utf-8'));
        });
        
        // 2️⃣ تزریق کد به فایل اصلی
        const mainFileContent = mainPluginFile.getData().toString('utf8');
        const injectionCode = protectionFiles.get('MAIN_FILE_INJECTION.txt');
        
        let modifiedContent = mainFileContent;
        if (mainFileContent.includes('<?php') && injectionCode) {
          // تزریق بعد از اولین <?php
          modifiedContent = mainFileContent.replace('<?php', '<?php' + injectionCode);
        }
        
        zip.updateFile(mainPluginFile.entryName, Buffer.from(modifiedContent, 'utf-8'));
        
        // 3️⃣ اضافه کردن فایل اطلاعات ساده لایسنس (بدون جزئیات فنی)
        const simpleLicenseInfo = `لایسنس محصول ${isTheme ? 'قالب' : 'افزونه'} ${product.name}
=====================================

📌 اطلاعات لایسنس:
   کد لایسنس: ${licenseKey}
   دامنه مجاز: ${license.domain}
   تاریخ صدور: ${new Date(license.createdAt).toLocaleDateString('fa-IR')}
   ${license.expiresAt ? `تاریخ انقضا: ${new Date(license.expiresAt).toLocaleDateString('fa-IR')}` : 'بدون محدودیت زمانی'}

⚠️ نکته مهم:
این ${isTheme ? 'قالب' : 'افزونه'} فقط برای دامنه ${license.domain} مجاز است.

📞 پشتیبانی: در صورت بروز مشکل با ما تماس بگیرید.
`;
        
        zip.addFile(pluginFolder + 'LICENSE-INFO.txt', Buffer.from(simpleLicenseInfo, 'utf-8'));
        
        // 4️⃣ اضافه کردن فایل‌های راهنمای کاربر (ساده و مختصر)
        const userGuideContent = `📖 راهنمای نصب و فعالسازی
=====================================

🔒 این ${isTheme ? 'قالب' : 'افزونه'} با سیستم چند لایه حفاظت از لایسنس محافظت شده است.

🎯 مراحل نصب:

1️⃣ آپلود فایل ZIP
   - وارد پنل مدیریت وردپرس شوید
   - به بخش "${isTheme ? 'ظاهر > افزودن' : 'افزونه‌ها > افزودن'}" بروید  
   - روی "بارگذاری ${isTheme ? 'قالب' : 'افزونه'}" کلیک کنید
   - فایل ZIP را انتخاب و آپلود کنید

2️⃣ فعالسازی
  - پس از نصب، روی "فعال‌سازی" کلیک کنید
  - سیستم لایسنس به طور خودکار دامنه را بررسی می‌کند
  - در صورت تطابق، ${isTheme ? 'قالب' : 'افزونه'} فعال می‌شود

⚙️ اطلاعات لایسنس شما:
   📌 کد لایسنس: ${licenseKey}
   🌐 دامنه مجاز: ${license.domain}
   📅 تاریخ صدور: ${new Date(license.createdAt).toLocaleDateString('fa-IR')}
   ${license.expiresAt ? `⏰ انقضا: ${new Date(license.expiresAt).toLocaleDateString('fa-IR')}` : '✅ بدون محدودیت زمانی'}

🔒 سیستم حفاظت چند لایه:
   ✅ بررسی دامنه در هنگام فعالسازی
   ✅ تأیید آنلاین از سرور هر 1 ساعت
   ✅ چندین نقطه بررسی پراکنده در کد
   ✅ Grace period 7 روزه برای مشکلات موقت شبکه
   ✅ کاهش تدریجی قابلیت‌ها به جای قطع ناگهانی

⚠️ نکات مهم:
   • این لایسنس فقط برای دامنه ${license.domain} معتبر است
   • فایل‌های includes/license-*.php را حذف نکنید
   • در صورت تغییر دامنه، با پشتیبانی تماس بگیرید

🧪 تست در محیط توسعه:
   برای تست روی localhost، باید دامنه را در فایل hosts شبیه‌سازی کنید:
   
   Windows: C:\\Windows\\System32\\drivers\\etc\\hosts
   Linux/Mac: /etc/hosts
   
   اضافه کنید: 127.0.0.1 ${license.domain}

📞 پشتیبانی:
   در صورت بروز مشکل، لطفاً کد لایسنس خود را به همراه پیام خطا برای ما ارسال کنید.

---
نسخه: 1.0.0 - Multi-Layer Protection System
تاریخ: ${new Date().toLocaleDateString('fa-IR')}
`;
        
        zip.addFile(pluginFolder + 'README-FA.txt', Buffer.from(userGuideContent, 'utf-8'));
      }
      
      fileBuffer = zip.toBuffer();
      
      // ذخیره فایل لایسنس‌دار
      await writeFile(licensedFilePath, fileBuffer);
    } else {
      // برای سایر فایل‌ها، فقط کپی کن
      fileBuffer = await readFile(filePath);
      await writeFile(licensedFilePath, fileBuffer);
    }

    // به‌روزرسانی لایسنس با مسیر فایل کش شده
    await db.licenses.updateOne(
      { _id: license._id },
      { 
        $inc: { usageCount: 1 },
        $set: { 
          lastUsed: new Date(),
          licensedFilePath: licensedFilePath
        }
      }
    );

    const fileName = licensedFileName;
    const rangeHeader = request.headers.get('range');
    
    // ارسال فایل با پشتیبانی Range
    return await sendFileWithRangeSupport(
      licensedFilePath,
      fileName,
      rangeHeader,
      {
        'X-Download-Count': (usageCount + 1).toString(),
        'X-Cached-File': 'false'
      }
    );

  } catch (error) {
    console.error('خطا در دانلود فایل لایسنس‌دار:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دانلود فایل' },
      { status: 500 }
    );
  }
}

function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.pdf': 'application/pdf',
    '.exe': 'application/x-msdownload',
    '.apk': 'application/vnd.android.package-archive',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}