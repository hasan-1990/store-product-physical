#!/usr/bin/env node
/**
 * Pre-deploy validation — run before docker build / production deploy
 * Usage:
 *   node scripts/validate-deploy-env.js
 *   node scripts/validate-deploy-env.js --env .env.production
 */

const fs = require('fs');
const path = require('path');

const WEAK_SECRETS = new Set([
  'your-secret-key',
  'your-jwt-secret-key-here',
  'your-super-secret-jwt-key-change-this-in-production',
  'your-super-secret-nextauth-key-change-this-minimum-32-characters',
  'fallback-secret',
  'fallback-secret-key',
  'change-this',
  'dev-only-secret-do-not-use-in-production',
  'CHANGE-THIS-TO-A-RANDOM-32-CHARACTER-STRING',
  'CHANGE-THIS-TO-ANOTHER-RANDOM-32-CHARACTER-STRING',
]);

const MIN_LEN = 32;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ فایل env یافت نشد: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function checkSecret(name) {
  const value = (process.env[name] || '').trim();
  if (!value) return { ok: false, message: 'تنظیم نشده' };
  if (value.length < MIN_LEN) return { ok: false, message: `کمتر از ${MIN_LEN} کاراکتر` };
  if (WEAK_SECRETS.has(value)) return { ok: false, message: 'مقدار پیش‌فرض/ضعیف' };
  return { ok: true, message: 'OK' };
}

function main() {
  const envArg = process.argv.find((arg) => arg.startsWith('--env='));
  const envFile = envArg
    ? envArg.split('=')[1]
    : process.argv.includes('--env')
      ? process.argv[process.argv.indexOf('--env') + 1]
      : null;

  if (envFile) {
    loadEnvFile(path.resolve(process.cwd(), envFile));
  }

  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  const checks = [
    { id: 'JWT_SECRET', ...checkSecret('JWT_SECRET') },
    { id: 'NEXTAUTH_SECRET', ...checkSecret('NEXTAUTH_SECRET') },
    {
      id: 'ALLOW_DEV_ROUTES',
      ok: process.env.ALLOW_DEV_ROUTES !== 'true',
      message:
        process.env.ALLOW_DEV_ROUTES === 'true'
          ? 'نباید true باشد در production'
          : 'OK',
    },
    {
      id: 'MONGODB_URI',
      ok: !!(process.env.MONGODB_URI || process.env.DATABASE_URL),
      message: process.env.MONGODB_URI || process.env.DATABASE_URL ? 'OK' : 'تنظیم نشده',
    },
    {
      id: 'NEXTAUTH_URL',
      ok: !!process.env.NEXTAUTH_URL,
      message: process.env.NEXTAUTH_URL ? 'OK' : 'تنظیم نشده',
    },
    {
      id: 'REDIS_ENABLED',
      ok: process.env.REDIS_ENABLED === 'true',
      message:
        process.env.REDIS_ENABLED === 'true'
          ? 'OK'
          : 'باید true باشد در production (Q4 Scale)',
    },
    {
      id: 'REDIS_URL',
      ok: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
      message: process.env.REDIS_URL || process.env.REDIS_HOST ? 'OK' : 'تنظیم نشده',
    },
  ];

  let failed = 0;
  console.log('🔍 Deploy environment validation\n');

  for (const check of checks) {
    const icon = check.ok ? '✅' : '❌';
    console.log(`${icon} ${check.id}: ${check.message}`);
    if (!check.ok) failed++;
  }

  console.log('');
  if (failed > 0) {
    console.error(`❌ ${failed} مورد ناموفق — deploy را متوقف کنید.`);
    console.error('   تولید secret: openssl rand -base64 48');
    process.exit(1);
  }

  console.log('✅ همه بررسی‌ها موفق — آماده build/deploy');
  console.log('');
  console.log('مراحل بعدی:');
  console.log('  npm run deploy:rebuild');
  console.log('  curl http://localhost:3000/api/health/deploy');
}

main();
