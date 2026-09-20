/**
 * Cron Jobs Initializer
 * This file initializes all enabled cron jobs when the application starts
 */

import { initializeCronJobs, stopAllCronJobs } from '@/lib/cron/scheduler';

let isInitialized = false;

/**
 * Initialize cron jobs on application startup
 */
export async function initCronSystem() {
  if (isInitialized) {
    console.log('⚠️ Cron system already initialized');
    return;
  }

  console.log('🚀 Initializing Cron Job System...');
  
  try {
    await initializeCronJobs();
    isInitialized = true;
    console.log('✅ Cron Job System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Cron Job System:', error);
    throw error;
  }
}

/**
 * Shutdown cron jobs gracefully
 */
export function shutdownCronSystem() {
  if (!isInitialized) {
    console.log('⚠️ Cron system not initialized, nothing to shutdown');
    return;
  }

  console.log('🛑 Shutting down Cron Job System...');
  stopAllCronJobs();
  isInitialized = false;
  console.log('✅ Cron Job System shut down successfully');
}

/**
 * Check if cron system is initialized
 */
export function isCronSystemInitialized(): boolean {
  return isInitialized;
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('\n📛 Received SIGINT, shutting down gracefully...');
    shutdownCronSystem();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n📛 Received SIGTERM, shutting down gracefully...');
    shutdownCronSystem();
    process.exit(0);
  });
}
