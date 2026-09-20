import * as cron from 'node-cron';
import { connectDB } from '@/lib/mongodb';
import type { CronJob, CronLog } from '@/types/cron';
import { ObjectId } from 'mongodb';

// Store active cron jobs
const activeCronJobs = new Map<string, ReturnType<typeof cron.schedule>>();

// Import task handlers
import { handleAbandonedCart } from './tasks/abandoned-cart';
import { handleOrderManagement } from './tasks/order-management';
import { handleDatabaseBackup } from './tasks/database-backup';
import { handleEmailQueue } from './tasks/email-queue';
import { handleTicketCleanup } from './tasks/ticket-cleanup';
import { handleDiscountManagement } from './tasks/discount-management';
import { handleReportGeneration } from './tasks/report-generation';
import { handleCacheCleanup } from './tasks/cache-cleanup';
import { handleUserCleanup } from './tasks/user-cleanup';
import { handleLicensedFilesCleanup } from './tasks/licensed-files-cleanup';
import { handleSiteDnsCheck } from './tasks/site-dns-check';
import { handleCustomTask } from './tasks/custom-task';

/**
 * Validate cron expression
 */
export function isValidCronExpression(expression: string): boolean {
  try {
    return cron.validate(expression);
  } catch {
    return false;
  }
}

/**
 * Parse cron expression to human readable format
 */
export function parseCronExpression(expression: string): string {
  const parts = expression.split(' ');
  if (parts.length < 5) return 'نامعتبر';

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  let description = '';

  // Minute
  if (minute === '*') description += 'هر دقیقه';
  else if (minute.startsWith('*/')) description += `هر ${minute.slice(2)} دقیقه`;
  else description += `دقیقه ${minute}`;

  // Hour
  if (hour !== '*') {
    if (hour.startsWith('*/')) description += ` از هر ${hour.slice(2)} ساعت`;
    else description += ` از ساعت ${hour}`;
  }

  // Day of month
  if (dayOfMonth !== '*') {
    description += ` در روز ${dayOfMonth} ماه`;
  }

  // Month
  if (month !== '*') {
    description += ` در ماه ${month}`;
  }

  // Day of week
  if (dayOfWeek !== '*') {
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
    description += ` در روز ${days[parseInt(dayOfWeek)] || dayOfWeek}`;
  }

  return description;
}

/**
 * Calculate next run time for cron expression
 */
export function getNextRunTime(expression: string): Date | null {
  try {
    if (!isValidCronExpression(expression)) return null;

    // Use cron-parser for accurate next run calculation
    // Dynamic import for cron-parser to avoid build issues
    return null; // Temporarily disabled - needs proper async implementation
  } catch {
    return null;
  }
}

/**
 * Execute a cron task
 */
async function executeCronTask(jobId: string): Promise<void> {
  const db = await connectDB();
  const startTime = Date.now();

  try {
    // Get job details
    const job = await db.cronJobs.findOne({ 
      _id: new ObjectId(jobId) 
    }) as unknown as CronJob;

    if (!job || !job.enabled) {
      console.log(`⏭️ Job ${jobId} is disabled or not found`);
      return;
    }

    console.log(`🚀 Starting cron job: ${job.name} (${job.taskType})`);

    // Update status to running
    await db.cronJobs.updateOne(
      { _id: new ObjectId(jobId) },
      { 
        $set: { 
          status: 'running',
          lastRun: new Date().toISOString()
        }
      }
    );

    // Execute task based on type
    let result;
    const config = job.config || {};
    switch (job.taskType) {
      case 'abandoned_cart':
        result = await handleAbandonedCart(config as any);
        break;
      case 'order_management':
        result = await handleOrderManagement(config as any);
        break;
      case 'database_backup':
        result = await handleDatabaseBackup(config as any);
        break;
      case 'email_queue':
        result = await handleEmailQueue(config as any);
        break;
      case 'ticket_cleanup':
        result = await handleTicketCleanup(config as any);
        break;
      case 'discount_management':
        result = await handleDiscountManagement(config as any);
        break;
      case 'report_generation':
        result = await handleReportGeneration(config as any);
        break;
      case 'cache_cleanup':
        result = await handleCacheCleanup(config as any);
        break;
      case 'user_cleanup':
        result = await handleUserCleanup(config as any);
        break;
      case 'licensed_files_cleanup':
        result = await handleLicensedFilesCleanup(config as any);
        break;
      case 'site_dns_check':
        result = await handleSiteDnsCheck();
        break;
      case 'custom':
        result = await handleCustomTask(config as any);
        break;
      default:
        throw new Error(`Unknown task type: ${job.taskType}`);
    }

    const duration = Date.now() - startTime;

    // Create log entry
    const log: CronLog = {
      timestamp: new Date().toISOString(),
      status: 'success',
      message: result.message || 'Task completed successfully',
      duration,
      details: result.details
    };

    // Update job with success
    await db.cronJobs.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'active',
          nextRun: getNextRunTime(job.schedule)?.toISOString()
        },
        $inc: {
          runCount: 1,
          successCount: 1
        },
        $push: {
          logs: {
            $each: [log],
            $slice: -(job.maxLogs || 100) // Keep only last N logs
          }
        } as any
      }
    );

    console.log(`✅ Job ${job.name} completed in ${duration}ms`);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Cron job ${jobId} failed:`, error);

    // Create error log
    const log: CronLog = {
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message || 'Task failed',
      duration,
      details: { error: error.stack }
    };

    // Update job with error
    await db.cronJobs.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'error'
        },
        $inc: {
          runCount: 1,
          failCount: 1
        },
        $push: {
          logs: {
            $each: [log],
            $slice: -100
          }
        } as any
      }
    );
  }
}

/**
 * Start a single cron job
 */
export async function startCronJob(jobId: string, schedule: string): Promise<boolean> {
  try {
    // Stop existing job if any
    stopCronJob(jobId);

    // Validate schedule
    if (!isValidCronExpression(schedule)) {
      console.error(`Invalid cron expression for job ${jobId}: ${schedule}`);
      return false;
    }

    // Create and start new cron task
    const task = cron.schedule(schedule, () => {
      executeCronTask(jobId).catch(err => {
        console.error(`Error executing cron task ${jobId}:`, err);
      });
    });

    activeCronJobs.set(jobId, task);
    console.log(`✅ Started cron job ${jobId} with schedule: ${schedule}`);
    
    return true;
  } catch (error) {
    console.error(`Failed to start cron job ${jobId}:`, error);
    return false;
  }
}

/**
 * Stop a single cron job
 */
export function stopCronJob(jobId: string): void {
  const task = activeCronJobs.get(jobId);
  if (task) {
    task.stop();
    activeCronJobs.delete(jobId);
    console.log(`🛑 Stopped cron job ${jobId}`);
  }
}

/**
 * Initialize all active cron jobs from database
 */
export async function initializeCronJobs(): Promise<void> {
  console.log('🔄 Initializing cron jobs...');
  
  try {
    const db = await connectDB();
    
    // Get all enabled jobs
    const jobs = await db.cronJobs.find({ 
      enabled: true 
    }).toArray() as unknown as CronJob[];

    console.log(`Found ${jobs.length} enabled cron jobs`);

    // Start each job
    for (const job of jobs) {
      if (job._id) {
        await startCronJob(job._id.toString(), job.schedule);
      }
    }

    console.log('✅ Cron jobs initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
  }
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
  console.log('🛑 Stopping all cron jobs...');
  activeCronJobs.forEach((task, jobId) => {
    task.stop();
    console.log(`Stopped job: ${jobId}`);
  });
  activeCronJobs.clear();
  console.log('✅ All cron jobs stopped');
}

/**
 * Get active cron job count
 */
export function getActiveCronJobCount(): number {
  return activeCronJobs.size;
}

/**
 * Check if a specific job is running
 */
export function isCronJobRunning(jobId: string): boolean {
  return activeCronJobs.has(jobId);
}

/**
 * Manually trigger a cron job (run immediately)
 */
export async function triggerCronJob(jobId: string): Promise<void> {
  console.log(`🔧 Manually triggering cron job: ${jobId}`);
  await executeCronTask(jobId);
}
