import { WEAK_SECRET_VALUES, MIN_SECRET_LENGTH } from '@/lib/secrets';
export { WEAK_SECRET_VALUES, MIN_SECRET_LENGTH };

export type DeployCheckResult = {
  id: string;
  ok: boolean;
  message: string;
};

export function checkSecretStrength(envName: 'JWT_SECRET' | 'NEXTAUTH_SECRET'): DeployCheckResult {
  const value = process.env[envName]?.trim();
  const id = envName.toLowerCase();

  if (!value) {
    return { id, ok: false, message: `${envName} تنظیم نشده است` };
  }

  if (value.length < MIN_SECRET_LENGTH) {
    return { id, ok: false, message: `${envName} باید حداقل ${MIN_SECRET_LENGTH} کاراکتر باشد` };
  }

  if (WEAK_SECRET_VALUES.has(value)) {
    return { id, ok: false, message: `${envName} مقدار پیش‌فرض/ضعیف دارد — مقدار تصادفی جدید تولید کنید` };
  }

  return { id, ok: true, message: 'معتبر' };
}

export function checkDevRoutesDisabled(): DeployCheckResult {
  if (process.env.NODE_ENV !== 'production') {
    return { id: 'allow_dev_routes', ok: true, message: 'در development بررسی نمی‌شود' };
  }

  const enabled = process.env.ALLOW_DEV_ROUTES === 'true';
  return {
    id: 'allow_dev_routes',
    ok: !enabled,
    message: enabled
      ? 'ALLOW_DEV_ROUTES=true در production غیرمجاز است'
      : 'مسیرهای debug/test غیرفعال',
  };
}

export function checkNodeEnvProduction(): DeployCheckResult {
  const ok = process.env.NODE_ENV === 'production';
  return {
    id: 'node_env',
    ok,
    message: ok ? 'NODE_ENV=production' : `NODE_ENV=${process.env.NODE_ENV || 'undefined'}`,
  };
}

export async function checkMaintenanceSettings(): Promise<DeployCheckResult> {
  try {
    const { connectDB } = await import('@/lib/mongodb');
    const db = await connectDB();
    const mode = await db.settings.findOne({ key: 'maintenanceMode' });
    const endTime = await db.settings.findOne({ key: 'maintenanceEndTime' });
    const active = mode?.value === 'true';
    return {
      id: 'maintenance_settings',
      ok: true,
      message: active
        ? `فعال${endTime?.value ? ` تا ${endTime.value}` : ''}`
        : 'غیرفعال',
    };
  } catch (error) {
    return {
      id: 'maintenance_settings',
      ok: false,
      message: error instanceof Error ? error.message : 'خطا در خواندن تنظیمات maintenance',
    };
  }
}

export function checkRedisRequiredInProduction(): DeployCheckResult {
  if (process.env.NODE_ENV !== 'production') {
    return { id: 'redis_required', ok: true, message: 'در development اختیاری' };
  }

  const enabled = process.env.REDIS_ENABLED === 'true';
  const hasConnection =
    !!process.env.REDIS_URL || !!process.env.REDIS_HOST;

  const ok = enabled && hasConnection;
  return {
    id: 'redis_required',
    ok,
    message: ok
      ? 'Redis اجباری در production فعال است'
      : 'REDIS_ENABLED=true و REDIS_URL/REDIS_HOST در production الزامی است',
  };
}

export async function checkRedisPing(): Promise<DeployCheckResult> {
  if (process.env.REDIS_ENABLED !== 'true') {
    if (process.env.NODE_ENV === 'production') {
      return { id: 'redis_ping', ok: false, message: 'Redis غیرفعال' };
    }
    return { id: 'redis_ping', ok: true, message: 'رد شد — Redis غیرفعال (dev)' };
  }

  try {
    const { cache } = await import('@/lib/redis');
    const ping = await cache.ping();
    const ok = ping === 'PONG';
    return {
      id: 'redis_ping',
      ok,
      message: ok ? `PONG (${ping})` : `پاسخ غیرمنتظره: ${ping}`,
    };
  } catch (error) {
    return {
      id: 'redis_ping',
      ok: false,
      message: error instanceof Error ? error.message : 'اتصال Redis ناموفق',
    };
  }
}

export function checkSentryConfigured(): DeployCheckResult {
  const dsn = process.env.SENTRY_DSN?.trim();
  return {
    id: 'sentry',
    ok: !!dsn,
    message: dsn ? 'Sentry DSN تنظیم شده' : 'اختیاری — SENTRY_DSN تنظیم نشده',
  };
}

export function checkCdnConfigured(): DeployCheckResult {
  const cdn =
    process.env.CDN_URL ||
    process.env.NEXT_PUBLIC_CDN_URL ||
    process.env.CDN_UPLOADS_URL;
  return {
    id: 'cdn',
    ok: !!cdn,
    message: cdn ? 'CDN URL تنظیم شده' : 'اختیاری — Nginx edge cache برای uploads فعال است',
  };
}

export async function checkRecentBackup(maxAgeHours = 26): Promise<DeployCheckResult> {
  try {
    const { getLatestBackupInfo } = await import('@/lib/mongodb-backup');
    const info = await getLatestBackupInfo();
    if (!info.found || info.ageHours === undefined) {
      return {
        id: 'backup_recent',
        ok: process.env.NODE_ENV !== 'production',
        message: 'هنوز بک‌آپی ثبت نشده — npm run db:backup',
      };
    }
    const ok = info.ageHours <= maxAgeHours;
    return {
      id: 'backup_recent',
      ok,
      message: ok
        ? `آخرین بک‌آپ ${info.ageHours}h پیش (${info.collections} collection)`
        : `بک‌آپ قدیمی است (${info.ageHours}h) — cron یا db:backup را اجرا کنید`,
    };
  } catch (error) {
    return {
      id: 'backup_recent',
      ok: false,
      message: error instanceof Error ? error.message : 'خطا در بررسی بک‌آپ',
    };
  }
}

export function runProductionDeployChecks(): DeployCheckResult[] {
  return [
    checkNodeEnvProduction(),
    checkSecretStrength('JWT_SECRET'),
    checkSecretStrength('NEXTAUTH_SECRET'),
    checkDevRoutesDisabled(),
    checkRedisRequiredInProduction(),
  ];
}

export async function runFullDeployChecks(): Promise<DeployCheckResult[]> {
  const syncChecks = runProductionDeployChecks();
  const [maintenance, redisPing] = await Promise.all([
    checkMaintenanceSettings(),
    checkRedisPing(),
  ]);
  return [...syncChecks, maintenance, redisPing];
}

export async function runScaleChecks(): Promise<DeployCheckResult[]> {
  const base = await runFullDeployChecks();
  const [backup, sentry, cdn] = await Promise.all([
    checkRecentBackup(),
    Promise.resolve(checkSentryConfigured()),
    Promise.resolve(checkCdnConfigured()),
  ]);
  return [...base, backup, sentry, cdn];
}

export function assertProductionReady(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const failed = runProductionDeployChecks().filter((check) => !check.ok);
  if (failed.length === 0) return;

  const summary = failed.map((check) => `${check.id}: ${check.message}`).join(' | ');
  throw new Error(`Production deploy checks failed — ${summary}`);
}
