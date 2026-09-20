/**
 * تأیید تکمیل Q4 2026 — Scale
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function pass(id: string, msg: string) {
  console.log(`✅ ${id}: ${msg}`);
}

function fail(id: string, msg: string) {
  console.error(`❌ ${id}: ${msg}`);
  process.exitCode = 1;
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

console.log('🔍 Verify Q4 Scale\n');

if (!exists('src/lib/mongodb-backup.ts')) {
  fail('Q4-BACKUP', 'mongodb-backup.ts missing');
} else if (!read('src/lib/cron/tasks/database-backup.ts').includes('createMongoJsonBackup')) {
  fail('Q4-BACKUP', 'cron backup not wired to JSON backup');
} else {
  pass('Q4-BACKUP', 'backup automation (JSON + cron task)');
}

if (!exists('src/lib/cdn.ts')) {
  fail('Q4-CDN', 'cdn.ts missing');
} else {
  pass('Q4-CDN', 'CDN URL helpers');
}

if (!read('src/lib/deploy-checks.ts').includes('checkRedisRequiredInProduction')) {
  fail('Q4-REDIS', 'Redis production check missing');
} else {
  pass('Q4-REDIS', 'Redis required in production deploy checks');
}

if (!exists('src/lib/error-monitoring.ts')) {
  fail('Q4-SENTRY', 'error-monitoring.ts missing');
} else if (!read('src/instrumentation.ts').includes('registerGlobalErrorHandlers')) {
  fail('Q4-SENTRY', 'Sentry not wired in instrumentation');
} else {
  pass('Q4-SENTRY', 'optional Sentry monitoring');
}

if (!exists('src/app/api/health/scale/route.ts')) {
  fail('Q4-HEALTH', '/api/health/scale missing');
} else {
  pass('Q4-HEALTH', 'GET /api/health/scale');
}

if (!exists('data/openapi.json') || !exists('src/app/api/openapi/route.ts')) {
  fail('Q4-OPENAPI', 'OpenAPI spec or route missing');
} else {
  pass('Q4-OPENAPI', 'GET /api/openapi');
}

if (!exists('scripts/seed-scale-defaults.js')) {
  fail('Q4-SEED', 'seed-scale-defaults.js missing');
} else {
  pass('Q4-SEED', 'npm run scale:seed for daily backup cron');
}

console.log('');
if (process.exitCode === 1) {
  console.error('❌ Q4 scale verification failed');
} else {
  console.log('✅ Q4 Scale checks passed');
}
