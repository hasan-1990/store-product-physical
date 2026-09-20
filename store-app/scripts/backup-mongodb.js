/**
 * MongoDB Backup Script با استفاده از Node.js
 * برای زمانی که MongoDB Tools نصب نیست
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// تنظیمات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'store-app';
const BACKUP_DIR = path.join(__dirname, '..', 'database-backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_PATH = path.join(BACKUP_DIR, `backup-${timestamp}`);

// رنگ‌ها برای console
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}🔵 MongoDB Backup Tool (Node.js)${colors.reset}`);
console.log(`${colors.cyan}================================${colors.reset}\n`);

async function backupDatabase() {
  let client;
  
  try {
    // اتصال به MongoDB
    console.log(`${colors.yellow}🔗 در حال اتصال به MongoDB...${colors.reset}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log(`${colors.green}✅ اتصال برقرار شد${colors.reset}\n`);
    
    const db = client.db(DB_NAME);
    
    // لیست collections
    console.log(`${colors.yellow}📋 در حال دریافت لیست collections...${colors.reset}`);
    const collections = await db.listCollections().toArray();
    console.log(`${colors.green}✅ ${collections.length} collection پیدا شد${colors.reset}\n`);
    
    // ساخت پوشه backup
    await fs.mkdir(BACKUP_PATH, { recursive: true });
    console.log(`${colors.green}✅ پوشه backup ساخته شد: ${BACKUP_PATH}${colors.reset}\n`);
    
    // backup هر collection
    console.log(`${colors.cyan}📦 در حال backup گرفتن...${colors.reset}\n`);
    
    let totalDocs = 0;
    let totalSize = 0;
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        const count = documents.length;
        
        // ذخیره به JSON
        const filename = path.join(BACKUP_PATH, `${collectionName}.json`);
        const jsonData = JSON.stringify(documents, null, 2);
        await fs.writeFile(filename, jsonData, 'utf8');
        
        const size = Buffer.byteLength(jsonData, 'utf8');
        totalDocs += count;
        totalSize += size;
        
        console.log(`${colors.white}  ✓ ${collectionName}: ${count} documents (${(size / 1024).toFixed(2)} KB)${colors.reset}`);
        
      } catch (error) {
        console.log(`${colors.red}  ✗ ${collectionName}: خطا - ${error.message}${colors.reset}`);
      }
    }
    
    // ذخیره metadata
    const metadata = {
      database: DB_NAME,
      timestamp: new Date().toISOString(),
      collections: collections.length,
      totalDocuments: totalDocs,
      totalSize: totalSize,
      backupPath: BACKUP_PATH
    };
    
    await fs.writeFile(
      path.join(BACKUP_PATH, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
    
    console.log(`\n${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✅ Backup با موفقیت انجام شد!${colors.reset}\n`);
    console.log(`${colors.cyan}📊 خلاصه:${colors.reset}`);
    console.log(`${colors.white}   Collections: ${collections.length}${colors.reset}`);
    console.log(`${colors.white}   Documents: ${totalDocs}${colors.reset}`);
    console.log(`${colors.white}   Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
    console.log(`${colors.white}   Path: ${BACKUP_PATH}${colors.reset}\n`);
    
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}📤 مراحل انتقال به MongoDB Atlas:${colors.reset}\n`);
    console.log(`${colors.white}1️⃣  به MongoDB Atlas بروید: https://cloud.mongodb.com${colors.reset}`);
    console.log(`${colors.white}2️⃣  یک cluster رایگان بسازید${colors.reset}`);
    console.log(`${colors.white}3️⃣  Connection String را کپی کنید${colors.reset}`);
    console.log(`${colors.white}4️⃣  اسکریپت restore را اجرا کنید:${colors.reset}\n`);
    console.log(`${colors.cyan}   node scripts/restore-mongodb.js "YOUR_ATLAS_CONNECTION_STRING" "${BACKUP_PATH}"${colors.reset}\n`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ خطا در backup:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log(`${colors.yellow}🔌 اتصال به MongoDB بسته شد${colors.reset}`);
    }
  }
}

// اجرای backup
backupDatabase();
