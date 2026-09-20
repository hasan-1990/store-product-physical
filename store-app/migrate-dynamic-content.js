const { MongoClient } = require('mongodb');

async function migrateCollection() {
  // در سرور از mongodb داخل docker استفاده می‌کنیم
  const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/store-app';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('store-app');
    
    // لیست تمام کالکشن‌ها
    const collections = await db.listCollections().toArray();
    console.log('\n📦 All collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // جستجوی کالکشن‌های مرتبط با dynamic
    const dynamicCollections = collections.filter(col => 
      col.name.toLowerCase().includes('dynamic')
    );
    
    console.log('\n🔍 Dynamic related collections:');
    dynamicCollections.forEach(col => console.log(`  ✓ ${col.name}`));
    
    if (dynamicCollections.length === 0) {
      console.log('\n❌ No dynamic collections found!');
      return;
    }
    
    // چک کردن داده‌های هر کالکشن
    for (const col of dynamicCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`\n📊 ${col.name}: ${count} documents`);
      
      // اگر کالکشن dynamic_content وجود دارد و dynamicContent خالی است
      if (col.name === 'dynamic_content') {
        const targetCount = await db.collection('dynamicContent').countDocuments();
        console.log(`📊 dynamicContent: ${targetCount} documents`);
        
        if (count > 0 && targetCount === 0) {
          console.log('\n🔄 Migrating data from dynamic_content to dynamicContent...');
          const docs = await db.collection('dynamic_content').find().toArray();
          
          if (docs.length > 0) {
            await db.collection('dynamicContent').insertMany(docs);
            console.log(`✅ Migrated ${docs.length} documents`);
          }
        } else if (count > 0 && targetCount > 0) {
          console.log('⚠️  Both collections have data. Skipping migration.');
        }
      }
      
      // اگر کالکشن dynamicContent وجود دارد و dynamic_content خالی است
      if (col.name === 'dynamicContent') {
        const sourceCount = await db.collection('dynamic_content').countDocuments();
        
        if (count === 0 && sourceCount > 0) {
          console.log('\n🔄 Migrating data from dynamic_content to dynamicContent...');
          const docs = await db.collection('dynamic_content').find().toArray();
          
          if (docs.length > 0) {
            await db.collection('dynamicContent').insertMany(docs);
            console.log(`✅ Migrated ${docs.length} documents`);
          }
        }
      }
    }
    
    // نمایش نمونه داده از کالکشن فعال
    const finalCount = await db.collection('dynamicContent').countDocuments();
    if (finalCount > 0) {
      console.log(`\n✅ Final dynamicContent collection has ${finalCount} documents`);
      const samples = await db.collection('dynamicContent').find().limit(3).toArray();
      console.log('\nSample data:');
      samples.forEach(doc => {
        console.log(`  - ${doc.key}: ${doc.value?.substring(0, 40)}...`);
      });
    } else {
      console.log('\n⚠️  dynamicContent collection is empty!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

migrateCollection();
