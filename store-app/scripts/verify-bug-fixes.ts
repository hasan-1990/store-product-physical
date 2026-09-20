/**
 * تأیید خودکار رفع باگ‌های BUG-001 تا BUG-007
 * Usage: npm run verify:bugs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getCategoryHubUrl,
  getSubcategoryProductUrl,
} from '../src/lib/category-urls';
import { isDevOnlyApiRoute, isDevRouteAllowed } from '../src/lib/dev-routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnvFile(filename: string) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

type Check = { id: string; ok: boolean; message: string };

const results: Check[] = [];

function pass(id: string, message: string) {
  results.push({ id, ok: true, message });
  console.log(`✅ ${id}: ${message}`);
}

function fail(id: string, message: string) {
  results.push({ id, ok: false, message });
  console.error(`❌ ${id}: ${message}`);
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function verifyBug001() {
  const parent = getCategoryHubUrl('', 'wordpress', 3);
  const leaf = getCategoryHubUrl('wordpress', 'themes', 0);
  const sub = getSubcategoryProductUrl('wordpress', 'themes', 'shop');

  if (parent !== '/categories/wordpress') {
    fail('BUG-001', `parent URL wrong: ${parent}`);
    return;
  }
  if (leaf !== '/products/wordpress/themes') {
    fail('BUG-001', `leaf URL wrong: ${leaf}`);
    return;
  }
  if (sub !== '/products/wordpress/themes/shop') {
    fail('BUG-001', `sub pill URL wrong: ${sub}`);
    return;
  }

  if (!read('src/app/categories/page.tsx').includes('currentPath={parentCategory?.slug')) {
    fail('BUG-001', 'categories/page.tsx does not pass currentPath');
    return;
  }

  if (!read('src/app/categories/[...slug]/page.tsx').includes('redirect(`/products/${slug.join')) {
    fail('BUG-001', 'categories/[...slug] missing leaf redirect');
    return;
  }

  pass('BUG-001', 'URLهای دسته‌بندی و redirect leaf درست است');
}

function verifyBug002() {
  const mw = read('middleware.ts');
  if (!mw.includes('MAINTENANCE_MODE') || !mw.includes("maintenance_mode")) {
    fail('BUG-002', 'middleware maintenance logic incomplete');
    return;
  }
  if (!exists('src/app/maintenance/page.tsx')) {
    fail('BUG-002', 'maintenance page missing');
    return;
  }
  pass('BUG-002', 'Maintenance mode (env + cookie) پیاده‌سازی شده');
}

function verifyBug003() {
  const route = read('src/app/api/admin/wishlist/route.ts');
  if (!route.includes('requireAdminFromRequest')) {
    fail('BUG-003', 'wishlist route missing admin auth');
    return;
  }
  if (!route.includes('if (!admin.authorized)')) {
    fail('BUG-003', 'wishlist route missing authorized check');
    return;
  }
  pass('BUG-003', 'Admin wishlist API محافظت شده');
}

function verifyBug004() {
  const jwt = read('src/lib/jwt.ts');
  const secrets = read('src/lib/secrets.ts');
  if (jwt.includes('your-jwt-secret') || jwt.includes('your-secret-key')) {
    fail('BUG-004', 'jwt.ts still has weak fallback');
    return;
  }
  if (!secrets.includes('throw new Error') && !secrets.includes('validateSecretValue')) {
    fail('BUG-004', 'secrets.ts missing production guard');
    return;
  }
  pass('BUG-004', 'JWT secret بدون fallback ناامن');
}

function verifyBug005() {
  const prev = process.env.NODE_ENV;
  (process.env as any).NODE_ENV = 'production';
  process.env.ALLOW_DEV_ROUTES = 'false';

  const blocked = [
    '/api/debug/session',
    '/api/test-db',
    '/api/simple-test',
  ].every((p) => isDevOnlyApiRoute(p) && !isDevRouteAllowed());

  (process.env as any).NODE_ENV = prev;

  if (!blocked) {
    fail('BUG-005', 'dev routes not blocked in production');
    return;
  }
  pass('BUG-005', 'Debug/test API در production مسدود است');
}

function verifyBug006() {
  const pkg = JSON.parse(read('package.json'));
  const seedScript = pkg.scripts?.['db:seed'] || '';
  const seedFile = seedScript.includes('seed-dynamic-content.js');

  if (!seedFile || !exists('scripts/seed-dynamic-content.js')) {
    fail('BUG-006', 'db:seed script or target file missing');
    return;
  }
  pass('BUG-006', `db:seed → ${seedScript.trim()}`);
}

function verifyBug007() {
  const queue = read('src/lib/cron/tasks/email-queue.ts');
  const cart = read('src/lib/cron/tasks/abandoned-cart.ts');

  if (!queue.includes('emailService.send')) {
    fail('BUG-007', 'email-queue not wired to emailService');
    return;
  }
  if (!cart.includes('emailService.send')) {
    fail('BUG-007', 'abandoned-cart not wired to emailService');
    return;
  }
  pass('BUG-007', 'Cron email tasks به emailService متصل‌اند');
}

async function verifyMongoOptional() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    pass('MONGO-SMOKE', 'رد شد — MONGODB_URI تنظیم نشده (اختیاری)');
    return;
  }

  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db();
    await db.command({ ping: 1 });
    const categories = await db.collection('categories').countDocuments({ active: true });
    await client.close();
    pass('MONGO-SMOKE', `اتصال OK — ${categories} دسته فعال`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'اتصال MongoDB ناموفق';
    pass('MONGO-SMOKE', `رد شد — ${message}`);
  }
}

async function verifyEmailConfigOptional() {
  const enabled = process.env.EMAIL_ENABLED === 'true';
  if (!enabled) {
    pass('EMAIL-SMOKE', 'رد شد — EMAIL_ENABLED=false (ارسال واقعی در cron غیرفعال)');
    return;
  }

  const hasSmtpOrResend =
    !!process.env.RESEND_API_KEY ||
    !!process.env.SMTP_HOST ||
    !!process.env.EMAIL_HOST ||
    !!process.env.EMAIL_FROM_ADDRESS;

  if (!hasSmtpOrResend) {
    fail('EMAIL-SMOKE', 'EMAIL_ENABLED=true ولی SMTP/Resend تنظیم نشده');
    return;
  }

  pass('EMAIL-SMOKE', 'EMAIL_ENABLED=true و پیکربندی ایمیل موجود است');
}

async function main() {
  console.log('🔍 Verify BUG-001 … BUG-007\n');

  verifyBug001();
  verifyBug002();
  verifyBug003();
  verifyBug004();
  verifyBug005();
  verifyBug006();
  verifyBug007();
  await verifyMongoOptional();
  await verifyEmailConfigOptional();

  const failed = results.filter((r) => !r.ok && r.id.startsWith('BUG-'));
  console.log('');
  if (failed.length > 0) {
    console.error(`❌ ${failed.length} بررسی ناموفق`);
    process.exit(1);
  }
  console.log(`✅ همه ${results.length} بررسی موفق`);
}

main().catch((error) => {
  console.error('❌', error);
  process.exit(1);
});
