/**
 * Next.js Instrumentation
 * This file runs once when the server starts
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 Server instrumentation starting...');
    
    // Skip cron initialization if MongoDB is not available
    if (process.env.SKIP_CRON === 'true') {
      console.log('⏭️  Skipping cron system (SKIP_CRON=true)');
      return;
    }
    
    // Initialize Cron Jobs
    try {
      const { initCronSystem } = await import('./lib/cron/init');
      await initCronSystem();
    } catch (error) {
      console.error('❌ Failed to initialize cron system:', error);
      console.log('⚠️  Server will continue without cron jobs');
    }

    // Production deploy safety checks (secrets, dev routes, ...)
    try {
      const { assertProductionReady } = await import('./lib/deploy-checks');
      assertProductionReady();
      console.log('✅ Production deploy checks passed');
    } catch (error) {
      console.error('❌ Production deploy checks failed:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }

    // Next Rocket v1 (performance module)
    try {
      const { initNextRocket } = await import('./lib/next-rocket-init');
      await initNextRocket();
    } catch (error) {
      console.error('❌ Next Rocket init failed:', error);
    }

    // Sentry (optional)
    try {
      const { registerGlobalErrorHandlers } = await import('./lib/error-monitoring');
      registerGlobalErrorHandlers();
    } catch (error) {
      console.error('❌ Error monitoring init failed:', error);
    }
  }
}
