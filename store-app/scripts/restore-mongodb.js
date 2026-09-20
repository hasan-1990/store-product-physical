/**
 * MongoDB Restore Script
 * برای انتقال backup به MongoDB Atlas
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// دریافت آرگومان‌ها
const args = process.argv.slice(2);
const ATLAS_URI = args[0];
const BACKUP_PATH = args[1];

// رنگ‌ها
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m'
};

if (!ATLAS_URI || !BACKUP_PATH) {
  console.log(`${colors.red}❌ خطا: پارامترهای لازم وارد نشده‌اند${colors.reset}\n`);
  console.log(`${colors.yellow}استفاده:${colors.reset}`);
  console.log(`${colors.white}  node scripts/restore-mongodb.js "ATLAS_CONNECTION_STRING" "BACKUP_PATH"${colors.reset}\n`);
  console.log(`${colors.yellow}مثال:${colors.reset}`);
  console.log(`${colors.cyan}  node scripts/restore-mongodb.js "mongodb+srv://user:pass@cluster.mongodb.net/store-app" "./database-backup/backup-2025-01-15"${colors.reset}\n`);
  process.exit(1);
}

console.log(`${colors.cyan}🔵 MongoDB Restore Tool${colors.reset}`);
console.log(`${colors.cyan}================================${colors.reset}\n`);

async function restoreDatabase() {
  let client;
  
  try {
    // بررسی وجود پوشه backup
    console.log(`${colors.yellow}📁 بررسی پوشه backup...${colors.reset}`);
    const backupExists = await fs.access(BACKUP_PATH).then(() => true).catch(() => false);
    
    if (!backupExists) {
      throw new Error(`پوشه backup پیدا نشد: ${BACKUP_PATH}`);
    }
    console.log(`${colors.green}✅ پوشه backup پیدا شد${colors.reset}\n`);
    
    // اتصال به Atlas
    console.log(`${colors.yellow}🔗 در حال اتصال به MongoDB Atlas...${colors.reset}`);
    client = new MongoClient(ATLAS_URI);
    await client.connect();
    console.log(`${colors.green}✅ اتصال به Atlas برقرار شد${colors.reset}\n`);
    
    // خواندن metadata
    const metadataPath = path.join(BACKUP_PATH, 'metadata.json');
    let metadata;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
      console.log(`${colors.cyan}📊 اطلاعات backup:${colors.reset}`);
      console.log(`${colors.white}   Database: ${metadata.database}${colors.reset}`);
      console.log(`${colors.white}   Collections: ${metadata.collections}${colors.reset}`);
      console.log(`${colors.white}   Total Documents: ${metadata.totalDocuments}${colors.reset}`);
      console.log(`${colors.white}   Date: ${new Date(metadata.timestamp).toLocaleString('fa-IR')}${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️  فایل metadata پیدا نشد${colors.reset}\n`);
    }
    
    const dbName = metadata?.database || 'store-app';
    const db = client.db(dbName);
    
    // خواندن فایل‌های JSON
    console.log(`${colors.yellow}📦 در حال restore کردن...${colors.reset}\n`);
    const files = await fs.readdir(BACKUP_PATH);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'metadata.json');
    
    let totalRestored = 0;
    
    for (const file of jsonFiles) {
      const collectionName = path.basename(file, '.json');
      
      try {
        const filePath = path.join(BACKUP_PATH, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const documents = JSON.parse(fileContent);
        
        if (documents.length > 0) {
          const collection = db.collection(collectionName);
          
          // پاک کردن collection قبلی (اختیاری)
          await collection.deleteMany({});
          
          // insert documents
          await collection.insertMany(documents);
          totalRestored += documents.length;
          
          console.log(`${colors.white}  ✓ ${collectionName}: ${documents.length} documents${colors.reset}`);
        } else {
          console.log(`${colors.yellow}  ⚠ ${collectionName}: خالی${colors.reset}`);
        }
        
      } catch (error) {
        console.log(`${colors.red}  ✗ ${collectionName}: خطا - ${error.message}${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✅ Restore با موفقیت انجام شد!${colors.reset}\n`);
    console.log(`${colors.cyan}📊 خلاصه:${colors.reset}`);
    console.log(`${colors.white}   Collections: ${jsonFiles.length}${colors.reset}`);
    console.log(`${colors.white}   Documents: ${totalRestored}${colors.reset}\n`);
    
    console.log(`${colors.green}🎉 دیتابیس شما با موفقیت به Atlas منتقل شد!${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    console.log(`${colors.yellow}📝 مراحل بعدی:${colors.reset}`);
    console.log(`${colors.white}1️⃣  فایل .env.local را ویرایش کنید${colors.reset}`);
    console.log(`${colors.white}2️⃣  MONGODB_URI را با Atlas connection string جایگزین کنید${colors.reset}`);
    console.log(`${colors.white}3️⃣  اپلیکیشن را مجدد راه‌اندازی کنید${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ خطا در restore:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log(`${colors.yellow}🔌 اتصال به Atlas بسته شد${colors.reset}\n`);
    }
  }
}

// اجرای restore
restoreDatabase();
