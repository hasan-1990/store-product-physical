// Script to create licensed files cleanup cron job
// Usage: node seed-licensed-cleanup-cron.js

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function seedLicensedFilesCleanupCron() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const cronJobs = db.collection('cronJobs');

    // Check if cleanup job already exists
    const existing = await cronJobs.findOne({ 
      taskType: 'licensed_files_cleanup' 
    });

    if (existing) {
      console.log('⚠️  Licensed files cleanup cron job already exists');
      console.log('📋 Job details:', {
        name: existing.name,
        schedule: existing.schedule,
        enabled: existing.enabled,
        status: existing.status
      });
      return;
    }

    // Create new cleanup job
    const cleanupJob = {
      name: 'پاکسازی خودکار فایل‌های موقت',
      description: 'حذف خودکار فایل‌های قدیمی‌تر از ۵ دقیقه از پوشه‌های licensed-files و duplicator-locked',
      taskType: 'licensed_files_cleanup',
      schedule: '* * * * *', // Every minute
      enabled: true,
      status: 'active',
      priority: 'high',
      config: {
        maxAgeMinutes: 5, // Delete files older than 5 minutes
        directories: [] // Additional directories can be added here
      },
      runCount: 0,
      successCount: 0,
      failCount: 0,
      logs: [],
      maxLogs: 100,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await cronJobs.insertOne(cleanupJob);
    
    console.log('✅ Licensed files cleanup cron job created successfully!');
    console.log('📋 Job details:', {
      _id: result.insertedId,
      name: cleanupJob.name,
      schedule: cleanupJob.schedule,
      maxAgeMinutes: cleanupJob.config.maxAgeMinutes,
      enabled: cleanupJob.enabled
    });
    console.log('\n⏰ Schedule: Every minute');
    console.log('🗑️  Will delete files older than: 5 minutes');
    console.log('📁 Directories monitored:');
    console.log('   - licensed-files/');
    console.log('   - licensed-files/duplicator-locked/');
    console.log('\n⚠️  IMPORTANT: You need to restart the Next.js app for the cron job to start!');
    console.log('   Command: npm run dev (or restart production server)');

  } catch (error) {
    console.error('❌ Error creating cleanup cron job:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seedLicensedFilesCleanupCron()
  .then(() => {
    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
