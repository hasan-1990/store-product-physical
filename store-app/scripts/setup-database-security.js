// scripts/setup-database-security.js
/**
 * Setup Database Security Indexes
 * ایجاد index های امنیتی برای MongoDB
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/store';

async function setupDatabaseSecurity() {
  console.log('🔐 Setting up database security...\n');
  
  const client = await MongoClient.connect(DATABASE_URL);
  const db = client.db();
  
  try {
    // 1. Users Collection Indexes
    console.log('📝 Creating indexes for users collection...');
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { mobile: 1 }, sparse: true, name: 'mobile_sparse' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { createdAt: 1 }, name: 'created_date' },
      { key: { lastLogin: -1 }, name: 'last_login' }
    ]);
    console.log('✅ Users indexes created\n');
    
    // 2. Products Collection Indexes
    console.log('📝 Creating indexes for products collection...');
    await db.collection('products').createIndexes([
      { key: { active: 1, createdAt: -1 }, name: 'active_products' },
      { key: { categoryId: 1, active: 1 }, name: 'category_products' },
      { key: { slug: 1 }, unique: true, sparse: true, name: 'slug_unique' },
      { key: { sku: 1 }, unique: true, sparse: true, name: 'sku_unique' },
      { key: { name: 'text', description: 'text' }, name: 'product_search' }
    ]);
    console.log('✅ Products indexes created\n');
    
    // 3. Orders Collection Indexes
    console.log('📝 Creating indexes for orders collection...');
    await db.collection('orders').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'user_orders' },
      { key: { orderNumber: 1 }, unique: true, name: 'order_number_unique' },
      { key: { status: 1, createdAt: -1 }, name: 'order_status' },
      { key: { 'payment.transactionId': 1 }, sparse: true, name: 'transaction_id' }
    ]);
    console.log('✅ Orders indexes created\n');
    
    // 4. Sessions Collection Indexes
    console.log('📝 Creating indexes for sessions collection...');
    await db.collection('sessions').createIndexes([
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'session_expiry' },
      { key: { userId: 1 }, name: 'user_sessions' },
      { key: { ip: 1, createdAt: -1 }, name: 'ip_sessions' }
    ]);
    console.log('✅ Sessions indexes created\n');
    
    // 5. Security Logs Collection Indexes
    console.log('📝 Creating indexes for security_logs collection...');
    await db.collection('security_logs').createIndexes([
      { key: { createdAt: 1 }, expireAfterSeconds: 2592000, name: 'log_retention' }, // 30 days
      { key: { eventType: 1, createdAt: -1 }, name: 'event_type' },
      { key: { ip: 1, createdAt: -1 }, name: 'ip_logs' },
      { key: { userId: 1, createdAt: -1 }, name: 'user_logs' }
    ]);
    console.log('✅ Security logs indexes created\n');
    
    // 6. Audit Trail Collection Indexes
    console.log('📝 Creating indexes for audit_trail collection...');
    await db.collection('audit_trail').createIndexes([
      { key: { userId: 1, timestamp: -1 }, name: 'user_audit' },
      { key: { collection: 1, operation: 1, timestamp: -1 }, name: 'collection_audit' },
      { key: { timestamp: 1 }, expireAfterSeconds: 7776000, name: 'audit_retention' } // 90 days
    ]);
    console.log('✅ Audit trail indexes created\n');
    
    // 7. List all indexes
    console.log('📊 Database Index Summary:\n');
    
    const collections = ['users', 'products', 'orders', 'sessions', 'security_logs', 'audit_trail'];
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`${collectionName}:`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        const unique = index.unique ? ' (unique)' : '';
        const ttl = index.expireAfterSeconds !== undefined ? ` (TTL: ${index.expireAfterSeconds}s)` : '';
        console.log(`  - ${index.name}: ${keys}${unique}${ttl}`);
      });
      console.log('');
    }
    
    // 8. Database Stats
    console.log('📈 Database Statistics:\n');
    const stats = await db.stats();
    console.log(`Collections: ${stats.collections}`);
    console.log(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Size: ${((stats.dataSize + stats.indexSize) / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Database security setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database security:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupDatabaseSecurity().catch(console.error);
