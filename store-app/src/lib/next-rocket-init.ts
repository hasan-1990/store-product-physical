/**
 * راه‌اندازی Next Rocket v1 در startup سرور
 */
import { DEFAULT_SETTINGS } from '@/modules/next-rocket/config';
import type { NextRocketSettings } from '@/modules/next-rocket/types';

function isNextRocketEnabled(): boolean {
  return (
    process.env.NEXT_ROCKET_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_NEXT_ROCKET_ENABLED === 'true'
  );
}

export async function initNextRocket(): Promise<void> {
  if (!isNextRocketEnabled()) {
    console.log('⏭️  Next Rocket disabled (set NEXT_ROCKET_ENABLED=true to enable)');
    return;
  }

  try {
    const { NextRocket } = await import('@/modules/next-rocket');
    const rocket = NextRocket.getInstance();

    let settings: Partial<NextRocketSettings> = { ...DEFAULT_SETTINGS, enabled: true };

    try {
      const { connectDB } = await import('@/lib/mongodb');
      const db = await connectDB();
      const stored = await db.nextRocketSettings.findOne({ key: 'main' });
      if (stored) {
        const { _id, key, ...rest } = stored as Record<string, unknown>;
        settings = { ...settings, ...(rest as Partial<NextRocketSettings>) };
      }
    } catch (dbError) {
      console.warn('⚠️  Next Rocket: using defaults (DB unavailable)', dbError);
    }

    await rocket.initialize(settings);
    console.log('🚀 Next Rocket v1 initialized');
  } catch (error) {
    console.error('❌ Next Rocket initialization failed:', error);
  }
}
