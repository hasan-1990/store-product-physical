/**
 * تأیید تکمیل Q3 2026 — Polish
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

console.log('🔍 Verify Q3 Polish\n');

// Next Rocket v1
if (!exists('src/lib/next-rocket-init.ts')) {
  fail('Q3-ROCKET', 'next-rocket-init.ts missing');
} else if (!read('src/instrumentation.ts').includes('initNextRocket')) {
  fail('Q3-ROCKET', 'instrumentation does not call initNextRocket');
} else {
  pass('Q3-ROCKET', 'Next Rocket v1 wired in instrumentation');
}

// SMS facade
const smsService = read('src/lib/sms-service.ts');
if (!smsService.includes("import smsClient from './sms'")) {
  fail('Q3-SMS', 'sms-service.ts is not a facade over sms.ts');
} else {
  pass('Q3-SMS', 'SMS unified facade (sms-service → sms.ts)');
}

// Tests
const testFiles = ['tests/auth-security.test.ts', 'tests/payment-utils.test.ts', 'tests/sms-facade.test.ts'];
const missingTests = testFiles.filter((f) => !exists(f));
if (missingTests.length > 0) {
  fail('Q3-TESTS', `missing: ${missingTests.join(', ')}`);
} else {
  pass('Q3-TESTS', `${testFiles.length} test files present`);
}

// Performance audit script
if (!exists('scripts/perf-audit.ts')) {
  fail('Q3-PERF', 'scripts/perf-audit.ts missing');
} else if (!read('package.json').includes('"perf:audit"')) {
  fail('Q3-PERF', 'npm run perf:audit not in package.json');
} else {
  pass('Q3-PERF', 'perf:audit script registered');
}

// DiscountSections cleanup (canonical chain)
const positioned = read('src/components/PositionedDiscountSections.tsx');
if (!positioned.includes('MultipleDiscountSectionsSSR')) {
  fail('Q3-DISCOUNT', 'PositionedDiscountSections chain broken');
} else {
  pass('Q3-DISCOUNT', 'DiscountSections canonical chain OK');
}

console.log('');
if (process.exitCode === 1) {
  console.error('❌ Q3 polish verification failed');
} else {
  console.log('✅ Q3 Polish checks passed');
}
