import type { TaskResult } from './types';

/**
 * Handle custom JavaScript tasks
 */
export async function handleCustomTask(config: {
  customCode?: string;
}): Promise<TaskResult> {
  try {
    const code = config.customCode || 'console.log("No custom code provided");';

    console.log('⚙️ Executing custom task...');

    // Execute custom code safely
    // Note: In production, consider using a safer sandboxed execution environment
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('console', code);
    
    const result = await fn(console);

    console.log('✅ Custom task executed successfully');

    return {
      success: true,
      message: 'کد سفارشی با موفقیت اجرا شد',
      details: {
        code: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
        result
      }
    };
  } catch (error: any) {
    console.error('Custom task error:', error);
    return {
      success: false,
      message: `خطا در اجرای کد سفارشی: ${error.message}`,
      details: { error: error.message }
    };
  }
}
