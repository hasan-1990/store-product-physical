#!/usr/bin/env node

/**
 * اسکریپت مدیریت تنظیمات سایت
 * استفاده: node scripts/manage-site-settings.js [command]
 * 
 * Commands:
 *   view    - نمایش تنظیمات فعلی
 *   edit    - ویرایش تنظیمات
 *   reset   - بازگشت به تنظیمات پیش‌فرض
 *   backup  - پشتیبان‌گیری از تنظیمات
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'site-settings.json');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backup');

// رنگ‌ها برای خروجی کنسول
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// خواندن تنظیمات
async function readSettings() {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}❌ خطا در خواندن فایل تنظیمات${colors.reset}`);
    return null;
  }
}

// ذخیره تنظیمات
async function saveSettings(settings) {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    console.log(`${colors.green}✅ تنظیمات با موفقیت ذخیره شد${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ خطا در ذخیره تنظیمات: ${error.message}${colors.reset}`);
    return false;
  }
}

// نمایش تنظیمات
async function viewSettings() {
  const settings = await readSettings();
  if (!settings) return;

  console.log(`\n${colors.bright}${colors.cyan}📋 تنظیمات فعلی سایت:${colors.reset}\n`);
  console.log(`${colors.bright}نام سایت:${colors.reset} ${settings.site_name}`);
  console.log(`${colors.bright}توضیحات:${colors.reset} ${settings.site_description}`);
  console.log(`${colors.bright}توضیحات SEO:${colors.reset} ${settings.seo_description}`);
  console.log(`${colors.bright}کلمات کلیدی:${colors.reset} ${settings.seo_keywords}\n`);
}

// ویرایش تنظیمات تعاملی
async function editSettings() {
  const settings = await readSettings();
  if (!settings) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log(`\n${colors.bright}${colors.blue}✏️  ویرایش تنظیمات سایت${colors.reset}`);
  console.log(`${colors.yellow}(برای نگه داشتن مقدار فعلی، Enter را بزنید)${colors.reset}\n`);

  const siteName = await question(`نام سایت [${settings.site_name}]: `);
  const siteDesc = await question(`توضیحات سایت [${settings.site_description}]: `);
  const seoDesc = await question(`توضیحات SEO [${settings.seo_description.substring(0, 50)}...]: `);
  const seoKeys = await question(`کلمات کلیدی [${settings.seo_keywords}]: `);

  rl.close();

  const newSettings = {
    site_name: siteName || settings.site_name,
    site_description: siteDesc || settings.site_description,
    seo_description: seoDesc || settings.seo_description,
    seo_keywords: seoKeys || settings.seo_keywords
  };

  await saveSettings(newSettings);
}

// بازگشت به تنظیمات پیش‌فرض
async function resetSettings() {
  const defaultSettings = {
    site_name: "فروشگاه هاب",
    site_description: "تامین کننده قالب های وردپرس و افزونه های وب",
    seo_description: "محصولات با کیفیت را با قیمت‌های شکست ناپذیر کشف کنید. الکترونیک، مد، لوازم خانگی و موارد دیگر را با ارسال سریع و خدمات عالی مشتریان خریداری کنید.",
    seo_keywords: "قالب وردپرس, افزونه وب, تم وردپرس, طراحی سایت"
  };

  console.log(`${colors.yellow}⚠️  آیا مطمئن هستید که می‌خواهید تنظیمات را به حالت پیش‌فرض برگردانید؟${colors.reset}`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('تایید (y/n): ', resolve);
  });

  rl.close();

  if (answer.toLowerCase() === 'y') {
    await saveSettings(defaultSettings);
    console.log(`${colors.green}✅ تنظیمات به حالت پیش‌فرض برگشت${colors.reset}`);
  } else {
    console.log(`${colors.blue}ℹ️  عملیات لغو شد${colors.reset}`);
  }
}

// پشتیبان‌گیری
async function backupSettings() {
  try {
    // ایجاد پوشه backup اگر وجود نداشت
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const settings = await readSettings();
    if (!settings) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `site-settings-${timestamp}.json`);

    await fs.writeFile(backupFile, JSON.stringify(settings, null, 2), 'utf-8');
    console.log(`${colors.green}✅ پشتیبان در مسیر زیر ذخیره شد:${colors.reset}`);
    console.log(`${colors.cyan}${backupFile}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ خطا در پشتیبان‌گیری: ${error.message}${colors.reset}`);
  }
}

// نمایش راهنما
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}📚 راهنمای اسکریپت مدیریت تنظیمات سایت${colors.reset}

${colors.bright}استفاده:${colors.reset}
  node scripts/manage-site-settings.js [command]

${colors.bright}دستورات:${colors.reset}
  ${colors.green}view${colors.reset}    - نمایش تنظیمات فعلی
  ${colors.green}edit${colors.reset}    - ویرایش تنظیمات (تعاملی)
  ${colors.green}reset${colors.reset}   - بازگشت به تنظیمات پیش‌فرض
  ${colors.green}backup${colors.reset}  - پشتیبان‌گیری از تنظیمات
  ${colors.green}help${colors.reset}    - نمایش این راهنما

${colors.bright}مثال‌ها:${colors.reset}
  node scripts/manage-site-settings.js view
  node scripts/manage-site-settings.js edit
  node scripts/manage-site-settings.js backup

${colors.bright}توجه:${colors.reset}
  فایل تنظیمات: ${colors.cyan}data/site-settings.json${colors.reset}
  پوشه پشتیبان: ${colors.cyan}data/backup/${colors.reset}
  `);
}

// اجرای دستور
async function main() {
  const command = process.argv[2];

  console.log(`${colors.bright}${colors.blue}⚙️  مدیریت تنظیمات سایت${colors.reset}\n`);

  switch (command) {
    case 'view':
      await viewSettings();
      break;
    case 'edit':
      await editSettings();
      break;
    case 'reset':
      await resetSettings();
      break;
    case 'backup':
      await backupSettings();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch(console.error);
